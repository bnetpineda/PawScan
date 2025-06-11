import "../global.css";
import { Stack } from "expo-router";
import React, { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { AuthProvider } from "../providers/AuthProvider";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_100Thin: require("../assets/fonts/Inter_28pt-Thin.ttf"),
    Inter_100Thin_Italic: require("../assets/fonts/Inter_28pt-ThinItalic.ttf"), // Assuming this file exists
    Inter_200ExtraLight: require("../assets/fonts/Inter_28pt-ExtraLight.ttf"),
    Inter_200ExtraLight_Italic: require("../assets/fonts/Inter_28pt-ExtraLightItalic.ttf"),
    Inter_300Light: require("../assets/fonts/Inter_28pt-Light.ttf"),
    Inter_300Light_Italic: require("../assets/fonts/Inter_28pt-LightItalic.ttf"),
    Inter_400Regular: require("../assets/fonts/Inter_28pt-Regular.ttf"),
    Inter_400Italic: require("../assets/fonts/Inter_28pt-Italic.ttf"),
    Inter_500Medium: require("../assets/fonts/Inter_28pt-Medium.ttf"),
    Inter_500Medium_Italic: require("../assets/fonts/Inter_28pt-MediumItalic.ttf"),
    Inter_600SemiBold: require("../assets/fonts/Inter_28pt-SemiBold.ttf"),
    Inter_600SemiBold_Italic: require("../assets/fonts/Inter_28pt-SemiBoldItalic.ttf"),
    Inter_700Bold: require("../assets/fonts/Inter_28pt-Bold.ttf"),
    Inter_700Bold_Italic: require("../assets/fonts/Inter_28pt-BoldItalic.ttf"),
    Inter_800ExtraBold: require("../assets/fonts/Inter_28pt-ExtraBold.ttf"),
    Inter_800ExtraBold_Italic: require("../assets/fonts/Inter_28pt-ExtraBoldItalic.ttf"),
    Inter_900Black: require("../assets/fonts/Inter_28pt-Black.ttf"),
    Inter_900Black_Italic: require("../assets/fonts/Inter_28pt-BlackItalic.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(user)" options={{ headerShown: false }} />
        <Stack.Screen name="(vet)" options={{ headerShown: false }} />
      </Stack>
    </AuthProvider>
  );
}
