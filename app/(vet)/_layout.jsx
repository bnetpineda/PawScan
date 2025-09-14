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
        tabBarActiveTintColor: isDarkMode ? "#f5f5f5" : "#171717",
        tabBarInactiveTintColor: isDarkMode ? "#737373" : "#a3a3a3", 
        tabBarStyle: {
          backgroundColor: isDarkMode ? "#0A0A0A" : "#FFFFFF", 
          borderTopColor: isDarkMode ? "#FFFFFF" : "#0A0A0A" ,
          borderTopWidth: 1,
          height: 75,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="home" color={color} size={20} />
          ),
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="camera" color={color} size={20} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="comment" color={color} size={20} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="user" color={color} size={20} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          href: null,
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="user" color={color} size={20} />
          ),
        }}
      />
    </Tabs>
  );
}
