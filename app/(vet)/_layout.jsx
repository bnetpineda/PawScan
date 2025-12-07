import { Tabs, Redirect } from "expo-router";
import { useColorScheme, View, Platform } from "react-native";
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

  const activeColor = isDarkMode ? "#ffffff" : "#000000";
  const inactiveColor = isDarkMode ? "#525252" : "#a3a3a3";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarStyle: {
          backgroundColor: isDarkMode ? "#000000" : "#ffffff",
          borderTopWidth: 0,
          height: Platform.OS === "ios" ? 88 : 70,
          paddingBottom: Platform.OS === "ios" ? 28 : 12,
          paddingTop: 12,
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: isDarkMode ? 0.3 : 0.08,
          shadowRadius: 8,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: "center" }}>
              <FontAwesome name="home" color={color} size={24} />
              {focused && (
                <View
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: activeColor,
                    marginTop: 4,
                  }}
                />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: "center" }}>
              <FontAwesome name="history" color={color} size={22} />
              {focused && (
                <View
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: activeColor,
                    marginTop: 4,
                  }}
                />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          tabBarIcon: () => (
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: isDarkMode ? "#ffffff" : "#000000",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: Platform.OS === "ios" ? 28 : 20,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 6,
                elevation: 6,
              }}
            >
              <FontAwesome name="camera" color={isDarkMode ? "#000000" : "#ffffff"} size={24} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: "center" }}>
              <FontAwesome name="comments" color={color} size={24} />
              {focused && (
                <View
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: activeColor,
                    marginTop: 4,
                  }}
                />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: "center" }}>
              <FontAwesome name="user" color={color} size={24} />
              {focused && (
                <View
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: activeColor,
                    marginTop: 4,
                  }}
                />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="vet-profile"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
