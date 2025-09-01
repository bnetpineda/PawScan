import { Text, TouchableOpacity, View } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { router } from "expo-router";

const ChatWithVetsButton = ({ isDark }) => {
  return (
    <View className="px-4 py-6">
      <TouchableOpacity
        className="bg-blue-500 rounded-full py-3 px-6 flex-row items-center justify-center"
        onPress={() => router.push('/(user)/chat')}
      >
        <FontAwesome name="comment" size={20} color="white" />
        <Text className="text-white font-inter-bold text-lg ml-2">
          Chat with Vets
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default ChatWithVetsButton;