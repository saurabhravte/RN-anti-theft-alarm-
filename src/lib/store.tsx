import { ReactNode, createContext, useContext, useState } from "react";

export interface AppState {
  pin: string;
  setPin: (pin: string) => void;
  sensitivity: number; // 1..10
  setSensitivity: (n: number) => void;
  accelEnabled: boolean;
  setAccelEnabled: (v: boolean) => void;
  gyroEnabled: boolean;
  setGyroEnabled: (v: boolean) => void;
  lightEnabled: boolean;
  setLightEnabled: (v: boolean) => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [pin, setPin] = useState("0000");
  const [sensitivity, setSensitivity] = useState(5);
  const [accelEnabled, setAccelEnabled] = useState(true);
  const [gyroEnabled, setGyroEnabled] = useState(true);
  const [lightEnabled, setLightEnabled] = useState(true);

  return (
    <AppContext.Provider
      value={{
        pin,
        setPin,
        sensitivity,
        setSensitivity,
        accelEnabled,
        setAccelEnabled,
        gyroEnabled,
        setGyroEnabled,
        lightEnabled,
        setLightEnabled,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppState(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useAppState must be used inside <AppProvider>");
  }
  return ctx;
}
