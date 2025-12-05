import { useEffect } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { useRouter } from "expo-router";
import * as Linking from "expo-linking";
import { useAuth } from "../../providers/AuthProvider";

export default function AuthCallback() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // Add a small delay to ensure session is fully propagated and persisted
      const timer = setTimeout(() => {
        router.replace("/");
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  useEffect(() => {
    const handleUrl = async (url) => {
      if (!url) return;
      console.log("Processing auth URL:", url);
      // We rely on AuthProvider to handle the session via WebBrowser.openAuthSessionAsync
      // This component just acts as a waiting screen until the user state is updated.
    };

    // Check the current URL (for when app is opened via deep link)
    const checkUrl = async () => {
      const url = await Linking.getInitialURL();
      if (url && url.includes("access_token")) {
        handleUrl(url);
      }
    };

    // Listen for URL changes
    const subscription = Linking.addEventListener("url", (event) => {
      handleUrl(event.url);
    });

    checkUrl();

    // Timeout fallback - if no token received, go back to login
    const timeout = setTimeout(() => {
      if (!user) {
        console.log("Auth callback timeout");
        router.replace("/(auth)/login");
      }
    }, 10000); // Increased timeout to 10s to give AuthProvider time

    return () => {
      subscription.remove();
      clearTimeout(timeout);
    };
  }, [user]);

  return (
    <View className="flex-1 items-center justify-center bg-white dark:bg-black">
      <ActivityIndicator size="large" color="#000" />
      <Text className="mt-4 text-neutral-500">Signing you in...</Text>
    </View>
  );
}
