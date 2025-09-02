import { FontAwesome } from "@expo/vector-icons";
import {
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const ChangeEmailModal = ({
  visible,
  onClose,
  newEmail,
  setNewEmail,
  onSubmit,
  updating,
  isDark,
}) => (
  <Modal
    visible={visible}
    animationType="slide"
    presentationStyle="pageSheet"
    onRequestClose={onClose}
  >
    <View className={`flex-1 ${isDark ? "bg-gray-900" : "bg-white"}`}>
      <View
        className={`pt-16 pb-4 px-6 border-b ${
          isDark ? "border-gray-800 bg-gray-900" : "border-gray-200 bg-gray-50"
        }`}
      >
        <View className="flex-row justify-between items-center">
          <Text
            className={`text-2xl font-inter-bold ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Change Email
          </Text>
          <TouchableOpacity
            onPress={onClose}
            className={`p-2 rounded-full ${
              isDark ? "bg-gray-800" : "bg-gray-200"
            }`}
          >
            <FontAwesome
              name="close"
              size={24}
              color={isDark ? "white" : "black"}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View className="flex-1 px-6 py-6">
        <Text
          className={`text-base font-inter mb-2 ${
            isDark ? "text-gray-300" : "text-gray-700"
          }`}
        >
          New Email Address
        </Text>
        <TextInput
          value={newEmail}
          onChangeText={setNewEmail}
          placeholder="Enter new email address"
          placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
          className={`p-4 rounded-lg border text-base font-inter ${
            isDark
              ? "bg-gray-800 border-gray-700 text-white"
              : "bg-white border-gray-300 text-gray-900"
          }`}
          keyboardType="email-address"
          autoCapitalize="none"
          autoFocus
        />

        <View
          className={`mt-4 p-4 rounded-lg ${
            isDark ? "bg-gray-800" : "bg-blue-50"
          }`}
        >
          <Text
            className={`text-sm font-inter ${
              isDark ? "text-gray-400" : "text-blue-700"
            }`}
          >
            A verification email will be sent to your new email address. You'll
            need to verify it before the change takes effect.
          </Text>
        </View>

        <View className="flex-row space-x-3 mt-6">
          <TouchableOpacity
            onPress={onClose}
            className={`flex-1 p-4 rounded-lg border ${
              isDark
                ? "border-gray-700 bg-gray-800"
                : "border-gray-300 bg-gray-100"
            }`}
            disabled={updating}
          >
            <Text
              className={`text-center text-base font-inter-semibold ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Cancel
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onSubmit}
            className="flex-1 p-4 rounded-lg bg-blue-600"
            disabled={updating}
          >
            <Text className="text-center text-base font-inter-bold text-white">
              {updating ? "Updating..." : "Update Email"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

export default ChangeEmailModal;