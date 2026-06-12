import { useContext } from "react";
import { AppContext } from "@/context/AppContext";
import colors from "@/constants/colors";

export function useAppColors() {
  const ctx = useContext(AppContext);
  const isDark = ctx?.isDarkMode ?? true;
  const palette = isDark ? colors.dark : colors.light;
  return { ...palette, radius: colors.radius };
}
