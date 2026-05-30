import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../lib/theme";

interface SliderProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export function Slider({
  value,
  onChange,
  min = 1,
  max = 10,
  step = 1,
}: SliderProps) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);

  const ratio = (value - min) / (max - min);

  function handleEvent(locationX: number) {
    if (width <= 0) return;
    const r = Math.max(0, Math.min(1, locationX / width));
    const raw = min + r * (max - min);
    const stepped = Math.round(raw / step) * step;
    const clamped = Math.max(min, Math.min(max, stepped));
    if (clamped !== value) onChange(clamped);
  }

  return (
    <View>
      <View
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(e) => handleEvent(e.nativeEvent.locationX)}
        onResponderMove={(e) => handleEvent(e.nativeEvent.locationX)}
        style={[styles.track, { backgroundColor: colors.surface2 }]}
      >
        <View
          style={[
            styles.fill,
            {
              width: `${ratio * 100}%`,
              backgroundColor: colors.accent,
            },
          ]}
        />
        <View
          pointerEvents="none"
          style={[
            styles.thumb,
            {
              left: `${ratio * 100}%`,
              backgroundColor: colors.bg,
              borderColor: colors.accent,
            },
          ]}
        />
      </View>
      <View style={styles.scale}>
        {Array.from({ length: max - min + 1 }).map((_, i) => (
          <Text
            key={i}
            style={[
              styles.tick,
              {
                color: i + min === value ? colors.text : colors.textMuted,
                fontWeight: i + min === value ? "700" : "400",
              },
            ]}
          >
            {i + min}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 12,
    borderRadius: 6,
    justifyContent: "center",
  },
  fill: {
    height: 12,
    borderRadius: 6,
  },
  thumb: {
    position: "absolute",
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    marginLeft: -12,
    top: -6,
  },
  scale: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingHorizontal: 2,
  },
  tick: {
    fontSize: 11,
    fontVariant: ["tabular-nums"],
  },
});
