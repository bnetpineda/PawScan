import "../global.css";
import { Stack } from "expo-router";
import React, { useEffect, useCallback } from "react";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { AuthProvider, useAuth } from "../providers/AuthProvider";
import { NotificationProvider } from "../providers/NotificationProvider";
import { TutorialProvider } from "../providers/TutorialProvider";
import TutorialOverlay from "../components/tutorial/TutorialOverlay";
import { profileTutorialSteps, userTutorialSteps, vetTutorialSteps } from "../components/tutorial/tutorialSteps";
import { useIdleTimeout } from "../hooks/useIdleTimeout";
import { ActivityTracker } from "../components/ActivityTracker";
import { IdleTimeoutWarning } from "../components/IdleTimeoutWarning";

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
      <NotificationProvider>
        <TutorialProvider>
          <AppContent />
        </TutorialProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

function AppContent() {
  const { user, logout } = useAuth();
  const isAuthenticated = !!user;

  const handleIdleTimeout = useCallback(async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Idle logout error:', error);
    }
  }, [logout]);

  const { resetTimer, showWarning, remainingTime, extendSession } = useIdleTimeout(
    handleIdleTimeout,
    isAuthenticated
  );

  return (
    <ActivityTracker onActivity={resetTimer} enabled={isAuthenticated}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(user)" options={{ headerShown: false }} />
        <Stack.Screen name="info" options={{ headerShown: false }} />
      </Stack>
      <AppTutorialOverlays />
      <IdleTimeoutWarning
        visible={showWarning}
        remainingTime={remainingTime}
        onExtend={extendSession}
      />
    </ActivityTracker>
  );
}

function AppTutorialOverlays() {
  const { user } = useAuth();
  const isVet = user?.user_metadata?.options?.data?.role === "vet";

  return (
    <>
      <TutorialOverlay 
        steps={profileTutorialSteps} 
        tutorialId="profile" 
        onComplete={() => {}}
      />
      <TutorialOverlay 
        steps={isVet ? vetTutorialSteps : userTutorialSteps} 
        tutorialId={isVet ? "vet" : "user"} 
        onComplete={() => {}}
      />
    </>
  );
}
