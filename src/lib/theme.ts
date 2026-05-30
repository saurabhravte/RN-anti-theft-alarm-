import { createContext, useContext } from "react";

export type ColorScheme = "light" | "dark";

export const palette = {
  light: {
    bg: "#FFFFFF",
    surface: "#F5F5F5",
    surface2: "#E8E8E8",
    text: "#0A0A0A",
    textMuted: "#6B6B6B",
    border: "#D4D4D4",
    accent: "#0A0A0A",
    accentText: "#FFFFFF",
    danger: "#B91C1C",
    success: "#15803D",
  },
  dark: {
    bg: "#000000",
    surface: "#0E0E0E",
    surface2: "#1A1A1A",
    text: "#FAFAFA",
    textMuted: "#A1A1A1",
    border: "#262626",
    accent: "#FAFAFA",
    accentText: "#000000",
    danger: "#F87171",
    success: "#4ADE80",
  },
};

export type Theme = typeof palette.light;

interface ThemeContextValue {
  scheme: ColorScheme;
  colors: Theme;
  toggle: () => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used inside a ThemeContext.Provider");
  }
  return ctx;
}
