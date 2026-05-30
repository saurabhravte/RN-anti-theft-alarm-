import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PinPad } from "../components/PinPad";
import { SensorRow } from "../components/SensorRow";
import { Slider } from "../components/Slider";
import { useAppState } from "../lib/store";
import { useTheme } from "../lib/theme";

export default function HomeScreen() {
  const router = useRouter();
  const { colors, scheme, toggle } = useTheme();
  const state = useAppState();

  const [pinModal, setPinModal] = useState<"set" | "confirm" | null>(null);
  const [firstPin, setFirstPin] = useState("");
  const [pinError, setPinError] = useState(0);

  function startSetPin() {
    setFirstPin("");
    setPinModal("set");
  }

  function handlePinComplete(entered: string) {
    if (pinModal === "set") {
      setFirstPin(entered);
      setPinModal("confirm");
    } else if (pinModal === "confirm") {
      if (entered === firstPin) {
        state.setPin(entered);
        setPinModal(null);
      } else {
        setPinError((n) => n + 1);
      }
    }
  }

  function arm() {
    const anyOn = state.accelEnabled || state.gyroEnabled || state.lightEnabled;
    if (!anyOn) return;
    router.push("./armed");
  }

  const anySensorOn =
    state.accelEnabled || state.gyroEnabled || state.lightEnabled;

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.bg }]}
      edges={["top", "left", "right"]}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.appTitle, { color: colors.text }]}>
              Theft Alert
            </Text>
            <Text style={[styles.appSubtitle, { color: colors.textMuted }]}>
              Anti-theft alarm
            </Text>
          </View>
          <Pressable
            onPress={toggle}
            style={({ pressed }) => [
              styles.themeBtn,
              {
                backgroundColor: pressed ? colors.surface2 : colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={{ fontSize: 18 }}>
              {scheme === "dark" ? "☾" : "☀"}
            </Text>
          </Pressable>
        </View>

        <Section title="Sensitivity">
          <Text style={[styles.sectionHint, { color: colors.textMuted }]}>
            Lower = needs strong movement. Higher = triggers on a small nudge.
          </Text>
          <Slider
            value={state.sensitivity}
            onChange={state.setSensitivity}
            min={1}
            max={10}
          />
          <View style={styles.sensRowEnd}>
            <Text style={[styles.sensValue, { color: colors.text }]}>
              {state.sensitivity} / 10
            </Text>
          </View>
        </Section>

        <Section title="Sensors">
          <SensorRow
            label="Accelerometer"
            description="Triggers when the phone is picked up, moved, or shaken."
            value={state.accelEnabled}
            onChange={state.setAccelEnabled}
          />
          <SensorRow
            label="Gyroscope"
            description="Triggers when the phone is rotated or flipped over."
            value={state.gyroEnabled}
            onChange={state.setGyroEnabled}
          />
          <SensorRow
            label="Light sensor"
            description="Triggers on sudden darkness (pocketed or covered). Android only."
            value={state.lightEnabled}
            onChange={state.setLightEnabled}
          />
        </Section>

        <Section title="PIN">
          <View
            style={[
              styles.pinRow,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.pinLabel, { color: colors.text }]}>
                Disarm PIN
              </Text>
              <Text style={[styles.pinValue, { color: colors.textMuted }]}>
                {"•".repeat(state.pin.length)} ({state.pin.length} digits)
              </Text>
            </View>
            <Pressable
              onPress={startSetPin}
              style={({ pressed }) => [
                styles.changeBtn,
                {
                  backgroundColor: pressed ? colors.surface2 : colors.surface2,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={{ color: colors.text, fontWeight: "600" }}>
                Change
              </Text>
            </Pressable>
          </View>
        </Section>
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <Pressable
          disabled={!anySensorOn}
          onPress={arm}
          style={({ pressed }) => [
            styles.armBtn,
            {
              backgroundColor: !anySensorOn
                ? colors.surface2
                : pressed
                  ? colors.textMuted
                  : colors.accent,
              opacity: !anySensorOn ? 0.6 : 1,
            },
          ]}
        >
          <Text
            style={[
              styles.armLabel,
              {
                color: !anySensorOn ? colors.textMuted : colors.accentText,
              },
            ]}
          >
            ARM
          </Text>
        </Pressable>
        {!anySensorOn ? (
          <Text style={[styles.footerHint, { color: colors.danger }]}>
            Turn on at least one sensor to arm.
          </Text>
        ) : (
          <Text style={[styles.footerHint, { color: colors.textMuted }]}>
            3-second countdown begins after you tap arm.
          </Text>
        )}
      </View>

      <Modal
        visible={pinModal !== null}
        animationType="fade"
        transparent
        onRequestClose={() => setPinModal(null)}
      >
        <View
          style={[
            styles.modalOverlay,
            {
              backgroundColor:
                scheme === "dark"
                  ? "rgba(0,0,0,0.85)"
                  : "rgba(255,255,255,0.92)",
            },
          ]}
        >
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.bg,
                borderColor: colors.border,
              },
            ]}
          >
            <PinPad
              title={pinModal === "set" ? "Set a new PIN" : "Confirm PIN"}
              subtitle={
                pinModal === "set"
                  ? "Choose 4 digits — you'll use these to disarm."
                  : pinError > 0
                    ? "Didn't match. Try again."
                    : "Re-enter the same 4 digits."
              }
              onComplete={handlePinComplete}
              errorShake={pinError}
            />
            <Pressable
              onPress={() => setPinModal(null)}
              style={{ marginTop: 18 }}
            >
              <Text style={{ color: colors.textMuted, fontSize: 14 }}>
                Cancel
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
        {title.toUpperCase()}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 32 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 28,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  themeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  sectionHint: {
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 18,
  },
  sensRowEnd: {
    alignItems: "flex-end",
    marginTop: 6,
  },
  sensValue: {
    fontSize: 14,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  pinRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  pinLabel: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  pinValue: {
    fontSize: 13,
    letterSpacing: 2,
  },
  changeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  footer: {
    padding: 20,
    paddingBottom: 28,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  armBtn: {
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  armLabel: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 6,
  },
  footerHint: {
    textAlign: "center",
    fontSize: 12,
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 360,
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: "center",
  },
});
