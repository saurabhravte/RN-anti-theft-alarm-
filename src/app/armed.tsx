import { useRouter } from "expo-router";
import { Accelerometer, Gyroscope, LightSensor } from "expo-sensors";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  Vibration,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PinPad } from "../components/PinPad";
import { useAppState } from "../lib/store";
import { useTheme } from "../lib/theme";
import { getThresholds } from "../lib/thresholds";

type Phase = "countdown" | "armed" | "triggered";

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

const ZERO: Vec3 = { x: 0, y: 0, z: 0 };

export default function ArmedScreen() {
  const router = useRouter();
  const { colors, scheme } = useTheme();
  const state = useAppState();
  const thresholds = getThresholds(state.sensitivity);

  const [phase, setPhase] = useState<Phase>("countdown");
  const [countdown, setCountdown] = useState(3);

  const [accel, setAccel] = useState<Vec3>(ZERO);
  const [gyro, setGyro] = useState<Vec3>(ZERO);
  const [light, setLight] = useState<number | null>(null);
  const [lightAvailable, setLightAvailable] = useState<boolean | null>(null);

  const [triggerReason, setTriggerReason] = useState<string>("");
  const [pinError, setPinError] = useState(0);

  const baselineLight = useRef<number | null>(null);
  const flash = useRef(new Animated.Value(0)).current;

  const accelMag = Math.sqrt(accel.x ** 2 + accel.y ** 2 + accel.z ** 2);
  const accelDelta = Math.abs(accelMag - 1); // 1g gravity baseline
  const gyroMag = Math.sqrt(gyro.x ** 2 + gyro.y ** 2 + gyro.z ** 2);

  // ─── Countdown ────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdown <= 0) {
      setPhase("armed");
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, phase]);

  // ─── Sensor subscriptions ─────────────────────────────────────
  useEffect(() => {
    if (phase === "triggered") return;

    Accelerometer.setUpdateInterval(100);
    Gyroscope.setUpdateInterval(100);
    LightSensor.setUpdateInterval(300);

    let cancelled = false;
    const subs: { remove: () => void }[] = [];

    if (state.accelEnabled) {
      subs.push(Accelerometer.addListener(setAccel));
    }
    if (state.gyroEnabled) {
      subs.push(Gyroscope.addListener(setGyro));
    }
    if (state.lightEnabled) {
      LightSensor.isAvailableAsync()
        .then((avail) => {
          if (cancelled) return;
          setLightAvailable(avail);
          if (avail) {
            const s = LightSensor.addListener((d) => setLight(d.illuminance));
            if (cancelled) s.remove();
            else subs.push(s);
          }
        })
        .catch(() => {
          if (!cancelled) setLightAvailable(false);
        });
    } else {
      setLightAvailable(false);
    }

    return () => {
      cancelled = true;
      subs.forEach((s) => s.remove());
    };
  }, [phase, state.accelEnabled, state.gyroEnabled, state.lightEnabled]);

  // ─── Capture light baseline on arm ────────────────────────────
  useEffect(() => {
    if (
      phase === "armed" &&
      state.lightEnabled &&
      lightAvailable &&
      light !== null &&
      baselineLight.current === null
    ) {
      baselineLight.current = light;
    }
  }, [phase, light, state.lightEnabled, lightAvailable]);

  // ─── Threshold check ──────────────────────────────────────────
  useEffect(() => {
    if (phase !== "armed") return;

    if (state.accelEnabled && accelDelta > thresholds.accel) {
      fire("Movement detected");
      return;
    }
    if (state.gyroEnabled && gyroMag > thresholds.gyro) {
      fire("Rotation detected");
      return;
    }
    if (
      state.lightEnabled &&
      lightAvailable &&
      light !== null &&
      baselineLight.current !== null &&
      baselineLight.current > 8
    ) {
      const ratio = light / baselineLight.current;
      if (ratio < thresholds.lightRatio) {
        fire("Light obstruction detected");
        return;
      }
    }
  }, [phase, accelDelta, gyroMag, light]);

  // ─── Flash animation while triggered ──────────────────────────
  useEffect(() => {
    if (phase !== "triggered") {
      flash.stopAnimation();
      flash.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(flash, {
          toValue: 1,
          duration: 400,
          easing: Easing.linear,
          useNativeDriver: false,
        }),
        Animated.timing(flash, {
          toValue: 0,
          duration: 400,
          easing: Easing.linear,
          useNativeDriver: false,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [phase, flash]);

  // ─── Cleanup vibration on unmount ─────────────────────────────
  useEffect(() => {
    return () => Vibration.cancel();
  }, []);

  function fire(reason: string) {
    setTriggerReason(reason);
    setPhase("triggered");
    // Long-looping pattern: pause 0, vibrate 600ms, pause 200ms — repeats.
    Vibration.vibrate([0, 600, 200], true);
  }

  function attemptDisarm(entered: string) {
    if (entered === state.pin) {
      Vibration.cancel();
      router.back();
    } else {
      setPinError((n) => n + 1);
      Vibration.vibrate(200);
    }
  }

  function cancelCountdown() {
    Vibration.cancel();
    router.back();
  }

  // ───────────── Triggered (alarm) view ─────────────────────────
  if (phase === "triggered") {
    const flashBg = flash.interpolate({
      inputRange: [0, 1],
      outputRange:
        scheme === "dark" ? ["#000000", "#FFFFFF"] : ["#FFFFFF", "#000000"],
    });
    const flashFg = flash.interpolate({
      inputRange: [0, 1],
      outputRange:
        scheme === "dark" ? ["#FFFFFF", "#000000"] : ["#000000", "#FFFFFF"],
    });

    return (
      <Animated.View style={[styles.alarmRoot, { backgroundColor: flashBg }]}>
        <SafeAreaView style={{ flex: 1, width: "100%" }}>
          <View style={styles.alarmTop}>
            <Animated.Text style={[styles.alarmHeading, { color: flashFg }]}>
              ALARM
            </Animated.Text>
            <Animated.Text style={[styles.alarmReason, { color: flashFg }]}>
              {triggerReason.toUpperCase()}
            </Animated.Text>
          </View>
          <View style={styles.alarmPinWrap}>
            <PinPad
              title="Enter PIN to disarm"
              subtitle={
                pinError > 0 ? `Wrong PIN — try again (${pinError})` : undefined
              }
              onComplete={attemptDisarm}
              errorShake={pinError}
            />
          </View>
        </SafeAreaView>
      </Animated.View>
    );
  }

  // ───────────── Countdown / Armed view ─────────────────────────
  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.bg }]}
      edges={["top", "left", "right", "bottom"]}
    >
      <View style={styles.armedHeader}>
        <Text style={[styles.armedKicker, { color: colors.textMuted }]}>
          {phase === "countdown" ? "ARMING IN" : "STATUS"}
        </Text>
        {phase === "countdown" ? (
          <Text style={[styles.countdownNumber, { color: colors.text }]}>
            {countdown}
          </Text>
        ) : (
          <View style={styles.armedStatusRow}>
            <View
              style={[styles.statusDot, { backgroundColor: colors.success }]}
            />
            <Text style={[styles.armedTitle, { color: colors.text }]}>
              ARMED
            </Text>
          </View>
        )}
      </View>

      <View style={styles.readingsWrap}>
        <Reading
          label="Accelerometer"
          enabled={state.accelEnabled}
          available={true}
          primary={`${accelDelta.toFixed(2)} g`}
          detail={`x ${accel.x.toFixed(2)}  y ${accel.y.toFixed(2)}  z ${accel.z.toFixed(2)}`}
          progress={Math.min(1, accelDelta / Math.max(0.01, thresholds.accel))}
          threshold={`thr ${thresholds.accel.toFixed(2)} g`}
        />
        <Reading
          label="Gyroscope"
          enabled={state.gyroEnabled}
          available={true}
          primary={`${gyroMag.toFixed(2)} rad/s`}
          detail={`x ${gyro.x.toFixed(2)}  y ${gyro.y.toFixed(2)}  z ${gyro.z.toFixed(2)}`}
          progress={Math.min(1, gyroMag / Math.max(0.01, thresholds.gyro))}
          threshold={`thr ${thresholds.gyro.toFixed(2)} rad/s`}
        />
        <Reading
          label="Light sensor"
          enabled={state.lightEnabled}
          available={lightAvailable ?? false}
          unavailableNote={
            Platform.OS === "ios"
              ? "Not available on iOS"
              : "Sensor unavailable on this device"
          }
          primary={light !== null ? `${light.toFixed(0)} lx` : "—"}
          detail={
            baselineLight.current !== null
              ? `baseline ${baselineLight.current.toFixed(0)} lx`
              : "calibrating…"
          }
          progress={
            light !== null && baselineLight.current !== null
              ? Math.min(
                  1,
                  Math.max(0, 1 - light / Math.max(1, baselineLight.current)) /
                    Math.max(0.01, 1 - thresholds.lightRatio),
                )
              : 0
          }
          threshold={`triggers below ${Math.round(thresholds.lightRatio * 100)}% of baseline`}
        />
      </View>

      <View style={styles.armedFooter}>
        <Pressable
          onPress={cancelCountdown}
          style={({ pressed }) => [
            styles.cancelBtn,
            {
              backgroundColor: pressed ? colors.surface2 : colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.cancelLabel, { color: colors.text }]}>
            {phase === "countdown" ? "Cancel" : "Disarm (return)"}
          </Text>
        </Pressable>
        <Text style={[styles.footerHint, { color: colors.textMuted }]}>
          {phase === "countdown"
            ? "Set the phone down. The alarm arms when the countdown ends."
            : "Move the phone, rotate it, or cover it to test the alarm."}
        </Text>
      </View>
    </SafeAreaView>
  );
}

function Reading({
  label,
  enabled,
  available,
  primary,
  detail,
  progress,
  threshold,
  unavailableNote,
}: {
  label: string;
  enabled: boolean;
  available: boolean;
  primary: string;
  detail: string;
  progress: number;
  threshold: string;
  unavailableNote?: string;
}) {
  const { colors } = useTheme();
  const inactive = !enabled || !available;
  const fillColor =
    progress > 0.85
      ? colors.danger
      : progress > 0.6
        ? colors.text
        : colors.textMuted;

  return (
    <View
      style={[
        styles.reading,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={styles.readingHead}>
        <Text style={[styles.readingLabel, { color: colors.text }]}>
          {label}
        </Text>
        <Text
          style={[
            styles.readingState,
            {
              color: inactive ? colors.textMuted : colors.success,
            },
          ]}
        >
          {!enabled ? "OFF" : !available ? "N/A" : "ON"}
        </Text>
      </View>

      {inactive ? (
        <Text style={[styles.readingDetail, { color: colors.textMuted }]}>
          {!enabled
            ? "Disabled in settings"
            : (unavailableNote ?? "Unavailable")}
        </Text>
      ) : (
        <>
          <Text style={[styles.readingPrimary, { color: colors.text }]}>
            {primary}
          </Text>
          <Text style={[styles.readingDetail, { color: colors.textMuted }]}>
            {detail}
          </Text>
          <View style={[styles.bar, { backgroundColor: colors.surface2 }]}>
            <View
              style={[
                styles.barFill,
                {
                  width: `${Math.min(100, progress * 100)}%`,
                  backgroundColor: fillColor,
                },
              ]}
            />
          </View>
          <Text style={[styles.readingThreshold, { color: colors.textMuted }]}>
            {threshold}
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  armedHeader: {
    alignItems: "center",
    paddingTop: 32,
    paddingBottom: 16,
  },
  armedKicker: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
  },
  countdownNumber: {
    fontSize: 120,
    fontWeight: "800",
    letterSpacing: -4,
    marginTop: 4,
    fontVariant: ["tabular-nums"],
  },
  armedStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 10,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  armedTitle: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: 4,
  },
  readingsWrap: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 10,
  },
  reading: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  readingHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  readingLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  readingState: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  readingPrimary: {
    fontSize: 22,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    marginBottom: 2,
  },
  readingDetail: {
    fontSize: 12,
    fontVariant: ["tabular-nums"],
  },
  bar: {
    height: 4,
    borderRadius: 2,
    marginTop: 10,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 2,
  },
  readingThreshold: {
    fontSize: 11,
    marginTop: 6,
  },
  armedFooter: {
    padding: 20,
    paddingBottom: 28,
  },
  cancelBtn: {
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  footerHint: {
    textAlign: "center",
    fontSize: 12,
    marginTop: 10,
  },

  // Alarm view
  alarmRoot: {
    flex: 1,
  },
  alarmTop: {
    paddingTop: 48,
    paddingBottom: 24,
    alignItems: "center",
  },
  alarmHeading: {
    fontSize: 72,
    fontWeight: "900",
    letterSpacing: 8,
  },
  alarmReason: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 3,
  },
  alarmPinWrap: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
});
