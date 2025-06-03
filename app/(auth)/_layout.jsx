import { Slot } from "expo-router";
import { useAuth } from "../../providers/AuthProvider";
import { router } from "expo-router";
import { useEffect } from "react";

export default function AuthLayout() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (user && !loading) {
      router.replace("/(tabs)/home");
    }
  }, [user, loading]);

  if (loading) return null; // Or a loading spinner

  // Don't block rendering if user is present, just let the effect handle navigation
  return <Slot />;
}
