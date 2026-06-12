import { useContext } from "react";
import { AppContext } from "@/context/AppContext";
import colors from "@/constants/colors";

/**
 * Returns the design tokens for the current color scheme.
 *
 * Reads `isDarkMode` from AppContext (the in-app toggle) so that
 * tapping the sun/moon icon instantly switches every screen's palette,
 * independent of the device system appearance setting.
 */
export function useColors() {
  const ctx = useContext(AppContext);
  const isDark = ctx?.isDarkMode ?? false;
  const palette = isDark ? colors.dark : colors.light;
  return { ...palette, radius: colors.radius };
}
