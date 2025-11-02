import { View, Text, TouchableOpacity, useColorScheme } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const EmptyConversations = () => {
  const isDark = useColorScheme() === "dark";
  const router = useRouter();

  return (
    <View className="flex-1 justify-center items-center p-8">
      <FontAwesome
        name="commenting-o"
        size={64}
        color={isDark ? "#fff" : "#000"}
      />
      <Text className="text-2xl font-inter-bold mt-4 mb-2 text-black dark:text-white">
        No conversations yet
      </Text>
      <Text className="text-base text-center text-neutral-600 dark:text-neutral-300 mb-6">
        Start a chat with a veterinarian to get expert advice for your pets
      </Text>
      <TouchableOpacity
        className="bg-black dark:bg-white rounded-full px-6 py-3"
        onPress={() => router.push("/(user)/chat/vets")}
        activeOpacity={0.8}
      >
        <Text className="text-white dark:text-black text-base font-inter-semibold">
          Find a Veterinarian
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default EmptyConversations;
