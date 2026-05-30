import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../lib/theme";

interface PinPadProps {
  length?: number;
  onComplete: (pin: string) => void;
  title?: string;
  subtitle?: string;
  errorShake?: number; // increment to trigger an error reset
}

export function PinPad({
  length = 4,
  onComplete,
  title,
  subtitle,
  errorShake = 0,
}: PinPadProps) {
  const { colors } = useTheme();
  const [pin, setPin] = useState("");

  // Reset entry on external error signal
  useEffect(() => {
    if (errorShake > 0) setPin("");
  }, [errorShake]);

  // Auto-submit when filled
  useEffect(() => {
    if (pin.length === length) {
      onComplete(pin);
    }
  }, [pin, length, onComplete]);

  function press(d: string) {
    if (pin.length < length) setPin((p) => p + d);
  }
  function back() {
    setPin((p) => p.slice(0, -1));
  }

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

  return (
    <View style={styles.wrap}>
      {title ? (
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      ) : null}
      {subtitle ? (
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          {subtitle}
        </Text>
      ) : null}

      <View style={styles.dots}>
        {Array.from({ length }).map((_, i) => {
          const filled = i < pin.length;
          return (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  borderColor: colors.border,
                  backgroundColor: filled ? colors.accent : "transparent",
                },
              ]}
            />
          );
        })}
      </View>

      <View style={styles.grid}>
        {keys.map((k) => (
          <Key key={k} label={k} onPress={() => press(k)} />
        ))}
        <View style={styles.key} />
        <Key label="0" onPress={() => press("0")} />
        <Key label="⌫" onPress={back} muted />
      </View>
    </View>
  );
}

function Key({
  label,
  onPress,
  muted,
}: {
  label: string;
  onPress: () => void;
  muted?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.key,
        {
          backgroundColor: pressed ? colors.surface2 : colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      <Text
        style={{
          color: muted ? colors.textMuted : colors.text,
          fontSize: 24,
          fontWeight: "500",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    width: "100%",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    marginBottom: 20,
  },
  dots: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 28,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  grid: {
    width: 264,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
  },
  key: {
    width: 80,
    height: 60,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
