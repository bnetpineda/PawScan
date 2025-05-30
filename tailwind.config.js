/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,tsx,jsx}", "./components/**/*.{js,ts,tsx,jsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: "hsl(var(--card))",
        cardForeground: "hsl(var(--card-foreground))",
        popover: "hsl(var(--popover))",
        popoverForeground: "hsl(var(--popover-foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart1: "hsl(var(--chart-1))",
        chart2: "hsl(var(--chart-2))",
        chart3: "hsl(var(--chart-3))",
        chart4: "hsl(var(--chart-4))",
        chart5: "hsl(var(--chart-5))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
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
    },
  },
  future: {
    hoverOnlyWhenSupported: true,
  },
  plugins: [],

  darkMode: "class",
};
