import { Stack } from "expo-router";

export default function ChatLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: "Chats",
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="[vetId]" 
        options={{ 
          title: "Chat",
          headerShown: true 
        }} 
      />
      <Stack.Screen 
        name="vets" 
        options={{ 
          title: "Select Veterinarian",
          headerShown: true 
        }} 
      />
    </Stack>
  );
}