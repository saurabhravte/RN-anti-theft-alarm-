import { Accelerometer } from "expo-sensors";
import { useEffect, useState } from "react";

export function useAccelerometer() {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [z, setZ] = useState(0);

  useEffect(() => {
    let subsciption: { remove: () => void } | undefined;

    (async () => {
      const isAvailable = await Accelerometer.isAvailableAsync();
      setAvailable(isAvailable);

      if (!isAvailable) return;

      Accelerometer.setUpdateInterval(100);

      subsciption = Accelerometer.addListener((data) => {
        setX(data.x);
        setY(data.y);
        setZ(data.z);
      });
    })();

    return () => subsciption?.remove();
  }, []);

  return { available, x, y, z };
}
