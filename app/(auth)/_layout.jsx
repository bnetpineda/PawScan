import { Slot } from "expo-router";
import { useAuth } from "../../providers/AuthProvider";
import { router } from "expo-router";
import { useEffect } from "react";

export default function AuthLayout() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (user && !loading) {
      const role = user.user_metadata?.role;
      if (role === "veterinarian") {
        router.replace("/(vet)/home");
      } else {
        router.replace("/(user)/home");
      }
    }
  }, [user, loading]);

  if (loading) return null; // Or a loading spinner

  return <Slot />;
}
