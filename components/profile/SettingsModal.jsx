import { FontAwesome } from "@expo/vector-icons";
import {
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const SettingsModal = ({
  visible,
  onClose,
  onPasswordPress,
  onSignOut,
  onTutorialPress,
  isDark,
}) => {

  return (
  <Modal
    visible={visible}
    animationType="slide"
    presentationStyle="pageSheet"
    onRequestClose={onClose}
  >
    <View className={`flex-1 ${isDark ? "bg-black" : "bg-white"}`}>
      <View
        className={`pt-8 pb-4 px-6 border-b ${
          isDark ? "border-neutral-600 bg-neutral" : "border-neutral-400 bg-neutral-50"
        }`}
      >
        <View className="flex-row justify-between items-center">
          <Text
            className={`text-2xl font-inter-bold ${
              isDark ? "text-white" : "text-black"
            }`}
          >
            Settings
          </Text>
          <TouchableOpacity
            onPress={onClose}
            className="p-2"
          >
            <FontAwesome
              name="close"
              size={20}
              color={isDark ? "white" : "black"}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 py-4">
        <View>
          <TouchableOpacity
            className={`p-4 rounded-lg border ${
              isDark ? "bg-neutral border-neutral-700" : "bg-white border-neutral-400"
            }`}
            onPress={onPasswordPress}
          >
            <View className="flex-row items-center">
              <FontAwesome
                name="lock"
                size={20}
                color={isDark ? "white" : "black"}
              />
              <View className="ml-3 flex-1">
                <Text
                  className={`text-base font-inter-semibold ${
                    isDark ? "text-white" : "text-black"
                  }`}
                >
                  Change Password
                </Text>
                <Text
                  className={`text-sm font-inter mt-1 ${
                    isDark ? "text-neutral-400" : "text-neutral-600"
                  }`}
                >
                  Update your account password
                </Text>
              </View>
              <FontAwesome
                name="angle-right"
                size={20}
                color={isDark ? "#9CA3AF" : "#6B7280"}
              />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className={`p-4 rounded-lg border mt-4 ${
              isDark ? "bg-neutral border-neutral-700" : "bg-white border-neutral-400"
            }`}
            onPress={onTutorialPress}
          >
            <View className="flex-row items-center">
              <FontAwesome
                name="question-circle"
                size={20}
                color={isDark ? "white" : "black"}
              />
              <View className="ml-3 flex-1">
                <Text
                  className={`text-base font-inter-semibold ${
                    isDark ? "text-white" : "text-black"
                  }`}
                >
                  Tutorial
                </Text>
                <Text
                  className={`text-sm font-inter mt-1 ${
                    isDark ? "text-neutral-400" : "text-neutral-600"
                  }`}
                >
                  Learn how to Profile on PawScan
                </Text>
              </View>
              <FontAwesome
                name="angle-right"
                size={20}
                color={isDark ? "#9CA3AF" : "#6B7280"}
              />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className={`p-4 rounded-lg border mt-8 ${
              isDark ? "bg-neutral border-neutral-700" : "bg-white border-neutral-400"
            }`}
            onPress={onSignOut}
          >
            <View className="flex-row items-center">
              <FontAwesome
                name="sign-out"
                size={20}
                color={isDark ? "white" : "black"}
              />
              <View className="ml-3 flex-1">
                <Text
                  className={`text-base font-inter-semibold ${
                    isDark ? "text-white" : "text-black"
                  }`}
                >
                  Sign Out
                </Text>
                <Text
                  className={`text-sm font-inter mt-1 ${
                    isDark ? "text-neutral-400" : "text-neutral-600"
                  }`}
                >
                  Log out of your account
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  </Modal>
  );
};

export default SettingsModal;
