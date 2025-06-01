/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,tsx,jsx}", "./components/**/*.{js,ts,tsx,jsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        inter: ["Inter_400Regular", "sans-serif"], // Default Inter weight
        "inter-thin": ["Inter_100Thin", "sans-serif"],
        "inter-extralight": ["Inter_200ExtraLight", "sans-serif"],
        "inter-light": ["Inter_300Light", "sans-serif"],
        "inter-medium": ["Inter_500Medium", "sans-serif"],
        "inter-semibold": ["Inter_600SemiBold", "sans-serif"],
        "inter-bold": ["Inter_700Bold", "sans-serif"],
        "inter-extrabold": ["Inter_800ExtraBold", "sans-serif"],
        "inter-black": ["Inter_900Black", "sans-serif"],
        "inter-regular": ["Inter_400Regular", "sans-serif"], // Added for clarity
        "inter-italic": ["Inter_400Italic", "sans-serif"],
        "inter-thin-italic": ["Inter_100Thin_Italic", "sans-serif"], // Assuming you loaded this
        "inter-extralight-italic": ["Inter_200ExtraLight_Italic", "sans-serif"], // Assuming you loaded this
        "inter-light-italic": ["Inter_300Light_Italic", "sans-serif"], // Assuming you loaded this
        "inter-medium-italic": ["Inter_500Medium_Italic", "sans-serif"], // Assuming you loaded this
        "inter-semibold-italic": ["Inter_600SemiBold_Italic", "sans-serif"], // Assuming you loaded this
        "inter-bold-italic": ["Inter_700Bold_Italic", "sans-serif"], // Assuming you loaded this
        "inter-extrabold-italic": ["Inter_800ExtraBold_Italic", "sans-serif"], // Assuming you loaded this
        "inter-black-italic": ["Inter_900Black_Italic", "sans-serif"], // Assuming you loaded this
      },
      colors: {
        primary: "black",
      },
    },
    future: {
      hoverOnlyWhenSupported: true,
    },
    plugins: [],
  },
};
