import { StyleSheet, Switch, Text, View } from "react-native";
import { useTheme } from "../lib/theme";

interface SensorRowProps {
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
}

export function SensorRow({
  label,
  description,
  value,
  onChange,
}: SensorRowProps) {
  const { colors, scheme } = useTheme();
  return (
    <View
      style={[
        styles.row,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={styles.text}>
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.desc, { color: colors.textMuted }]}>
          {description}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{
          false: scheme === "dark" ? "#2A2A2A" : "#D4D4D4",
          true: colors.accent,
        }}
        thumbColor={
          value
            ? scheme === "dark"
              ? "#000000"
              : "#FFFFFF"
            : scheme === "dark"
              ? "#737373"
              : "#FAFAFA"
        }
        ios_backgroundColor={scheme === "dark" ? "#2A2A2A" : "#D4D4D4"}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  text: {
    flex: 1,
    paddingRight: 12,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  desc: {
    fontSize: 12,
    lineHeight: 16,
  },
});
