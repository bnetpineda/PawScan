export const getThemeColors = (isDark) => ({
  background: isDark ? "bg-black" : "bg-white",
  text: isDark ? "text-white" : "text-black",
  textSecondary: isDark ? "text-neutral-300" : "text-neutral-600",
  textTertiary: isDark ? "text-neutral-400" : "text-neutral-500",
  border: isDark ? "border-neutral-700" : "border-neutral-300",
  cardBg: isDark ? "bg-neutral-800" : "bg-white",
  inputBg: isDark ? "bg-neutral-800" : "bg-neutral-100",
  iconActive: "#3B82F6",
  iconInactive: isDark ? "white" : "black",
});

export const getTextColor = (isDark, variant = "primary") => {
  const variants = {
    primary: isDark ? "text-white" : "text-black",
    secondary: isDark ? "text-neutral-300" : "text-neutral-600",
    tertiary: isDark ? "text-neutral-400" : "text-neutral-500",
  };
  return variants[variant] || variants.primary;
};

export const getBgColor = (isDark, variant = "primary") => {
  const variants = {
    primary: isDark ? "bg-black" : "bg-white",
    secondary: isDark ? "bg-neutral-800" : "bg-neutral-100",
    card: isDark ? "bg-neutral-800" : "bg-white",
  };
  return variants[variant] || variants.primary;
};

export const getBorderColor = (isDark) => {
  return isDark ? "border-neutral-700" : "border-neutral-300";
};
