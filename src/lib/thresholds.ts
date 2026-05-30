// Maps sensitivity (1..10) to per-sensor trigger thresholds.
// Higher sensitivity => lower threshold => easier to trigger.

export interface Thresholds {
  /** Allowable deviation of accelerometer magnitude from 1g (in g units). */
  accel: number;
  /** Maximum gyroscope magnitude in rad/s before triggering. */
  gyro: number;
  /** Light reading must drop below `baseline * lightRatio` to trigger. */
  lightRatio: number;
}

export function getThresholds(sensitivity: number): Thresholds {
  const s = Math.max(1, Math.min(10, sensitivity));
  return {
    accel: 0.8 - s * 0.06, // 0.74g (loose) … 0.20g (tight)
    gyro: 3.5 - s * 0.25, // 3.25 rad/s … 1.00 rad/s
    lightRatio: 0.7 - s * 0.05, // ratio: 0.65 … 0.20
  };
}
