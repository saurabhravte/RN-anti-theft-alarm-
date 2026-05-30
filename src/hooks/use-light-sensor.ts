import { LightSensor } from "expo-sensors";
import { useEffect, useState } from "react";
import { Platform } from "react-native";

/**
 * Reads ambient light level in lux (lx).
 * LightSensor is Android-only in Expo.
 */
export function useLightSensor() {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [lux, setLux] = useState(0);

  useEffect(() => {
    if (Platform.OS !== "android") {
      setAvailable(false);
      return;
    }

    let subscription: { remove: () => void } | undefined;

    void (async () => {
      const isAvailable = await LightSensor.isAvailableAsync();
      setAvailable(isAvailable);
      if (!isAvailable) return;

      LightSensor.setUpdateInterval(100);

      subscription = LightSensor.addListener((data) => {
        setLux(data.illuminance);
      });
    })();

    return () => subscription?.remove();
  }, []);

  return { available, lux };
}
