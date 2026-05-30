import { Gyroscope } from "expo-sensors";
import { useEffect, useState } from "react";

export function useGyroscope() {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [z, setZ] = useState(0);

  useEffect(() => {
    let subsciption: { remove: () => void } | undefined;

    void (async () => {
      const isAvailable = await Gyroscope.isAvailableAsync();
      setAvailable(isAvailable);
      if (!isAvailable) return;

      Gyroscope.setUpdateInterval(16);

      subsciption = Gyroscope.addListener((data) => {
        setX(data.x);
        setY(data.y);
        setZ(data.z);
      });
    })();

    return () => subsciption?.remove();
  }, []);

  return {
    available,
    x,
    y,
    z,
  };
}
