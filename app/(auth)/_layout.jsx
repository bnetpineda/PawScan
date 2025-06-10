import { Stack, Redirect } from "expo-router";
import { useAuth } from "../../providers/AuthProvider";
import { View, ActivityIndicator } from "react-native";

export default function AuthLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (user) {
    // Correctly access the role and display_name from the nested structure
    const role = user.user_metadata?.options?.data?.role;
    const displayName = user.user_metadata?.options?.data?.display_name; // You might want this too!

    console.log("User role:", role);
    console.log("User Display Name:", displayName); // Log display name for verification

    const redirectPath =
      role === "veterinarian" ? "/(vet)/home" : "/(user)/home";
    return <Redirect href={redirectPath} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
