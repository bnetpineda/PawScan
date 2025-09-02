import { FontAwesome } from "@expo/vector-icons";
import {
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const ChangePasswordModal = ({
  visible,
  onClose,
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
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
            Change Password
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

      <ScrollView className="flex-1 px-6 py-6">
        <View className="space-y-4">
          <View>
            <Text
              className={`text-base font-inter mb-2 ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Current Password
            </Text>
            <TextInput
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Enter current password"
              placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
              className={`p-4 rounded-lg border text-base font-inter ${
                isDark
                  ? "bg-gray-800 border-gray-700 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              }`}
              secureTextEntry
              autoFocus
            />
          </View>

          <View>
            <Text
              className={`text-base font-inter mb-2 ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}
            >
              New Password
            </Text>
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Enter new password"
              placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
              className={`p-4 rounded-lg border text-base font-inter ${
                isDark
                  ? "bg-gray-800 border-gray-700 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              }`}
              secureTextEntry
            />
          </View>

          <View>
            <Text
              className={`text-base font-inter mb-2 ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Confirm New Password
            </Text>
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm new password"
              placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
              className={`p-4 rounded-lg border text-base font-inter ${
                isDark
                  ? "bg-gray-800 border-gray-700 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              }`}
              secureTextEntry
            />
          </View>
        </View>

        <View
          className={`mt-4 p-4 rounded-lg ${
            isDark ? "bg-gray-800" : "bg-yellow-50"
          }`}
        >
          <Text
            className={`text-sm font-inter ${
              isDark ? "text-gray-400" : "text-yellow-700"
            }`}
          >
            Password must be at least 6 characters long.
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
              {updating ? "Updating..." : "Update Password"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  </Modal>
);

export default ChangePasswordModal;