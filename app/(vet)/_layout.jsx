import { Tabs, Redirect } from "expo-router";
import { useColorScheme } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useAuth } from "../../providers/AuthProvider";

export default function VetLayout() {
  const { user, loading } = useAuth();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  if (loading) return null;

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false, // Removes text labels
        tabBarActiveTintColor: isDarkMode ? "#fff" : "#000",
        tabBarInactiveTintColor: isDarkMode ? "#6B7280" : "#9CA3AF", // Gray shades
        tabBarStyle: {
          backgroundColor: isDarkMode ? "#111827" : "#FFFFFF", // Very dark gray (almost black)
          borderTopColor: isDarkMode ? "#1F2937" : "#E5E7EB",   // Slightly lighter for border
          height: 75,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="home" color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="camera" color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="comment" color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="user" color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          href: null,
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="user" color={color} size={24} />
          ),
        }}
      />
    </Tabs>
  );
}
