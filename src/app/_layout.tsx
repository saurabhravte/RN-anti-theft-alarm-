import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import { useColorScheme } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AppProvider } from "../lib/store";
import { ColorScheme, ThemeContext, palette } from "../lib/theme";

export default function RootLayout() {
  const deviceScheme = useColorScheme();
  const [scheme, setScheme] = useState<ColorScheme>(
    deviceScheme === "dark" ? "dark" : "light",
  );
  const colors = palette[scheme];

  const themeValue = useMemo(
    () => ({
      scheme,
      colors,
      toggle: () => setScheme((s) => (s === "light" ? "dark" : "light")),
    }),
    [scheme, colors],
  );

  return (
    <ThemeContext.Provider value={themeValue}>
      <AppProvider>
        <SafeAreaProvider>
          <StatusBar style={scheme === "dark" ? "light" : "dark"} />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.bg },
              animation: "fade",
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="armed" options={{ gestureEnabled: false }} />
          </Stack>
        </SafeAreaProvider>
      </AppProvider>
    </ThemeContext.Provider>
  );
}
