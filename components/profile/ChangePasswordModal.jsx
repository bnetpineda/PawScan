import React, { useState, useEffect } from "react";
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
}) => {
  const [newPasswordError, setNewPasswordError] = useState("");

  useEffect(() => {
    validateNewPassword(newPassword);
  }, [newPassword]);

  const validateNewPassword = (password) => {
    let error = "";
    if (!password || password.length < 6) {
      error = "Password must be at least 6 characters long.";
    } else if (!/[A-Z]/.test(password)) {
      error = "Password must contain at least one capital letter.";
    } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      error = "Password must contain at least one special character.";
    }
    setNewPasswordError(error);
    return error;
  };

  const handleSubmit = () => {
    const passwordValidationError = validateNewPassword(newPassword);
    if (
      !passwordValidationError &&
      newPassword === confirmPassword &&
      newPassword && newPassword.length >= 6
    ) {
      onSubmit();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className={`flex-1 ${isDark ? "bg-black" : "bg-white"}`}>
        <View
          className={`pt-16 pb-4 px-6 border-b ${
            isDark
              ? "border-neutral-700 bg-neutral-800"
              : "border-neutral-200 bg-neutral-100"
          }`}
        >
          <View className="flex-row justify-between items-center">
            <Text
              className={`text-2xl font-inter-bold ${
                isDark ? "text-white" : "text-black"
              }`}
            >
              Change Password
            </Text>
            <TouchableOpacity
              onPress={onClose}
              className={`p-2 rounded-full ${
                isDark ? "bg-neutral-800" : "bg-neutral-200"
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
          <View>
            <View>
              <Text
                className={`text-base font-inter mb-2 ${
                  isDark ? "text-neutral-300" : "text-neutral-700"
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
                    ? "bg-neutral border-neutral-700 text-white"
                    : "bg-white border-neutral-300 text-black"
                }`}
                secureTextEntry
                autoFocus
              />
            </View>

            <View className="mt-4">
              <Text
                className={`text-base font-inter mb-2 ${
                  isDark ? "text-neutral-300" : "text-neutral-700"
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
                    ? "bg-neutral border-neutral-700 text-white"
                    : "bg-white border-neutral-300 text-black"
                }`}
                secureTextEntry
              />
              {newPasswordError ? (
                <Text className="text-red-500 text-sm mt-1">
                  {newPasswordError}
                </Text>
              ) : null}
            </View>

            <View className="mt-4">
              <Text
                className={`text-base font-inter mb-2 ${
                  isDark ? "text-neutral-300" : "text-neutral-700"
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
                    ? "bg-neutral border-neutral-700 text-white"
                    : "bg-white border-neutral-300 text-black"
                }`}
                secureTextEntry
              />
              {newPassword !== confirmPassword &&
              confirmPassword?.length > 0 &&
              newPassword?.length > 0 ? (
                <Text className="text-red-500 text-sm mt-1">
                  Passwords do not match.
                </Text>
              ) : null}
            </View>
          </View>

          <View
            className={`mt-4 p-4 rounded-lg ${
              isDark ? "bg-neutral-800" : "bg-neutral-100"
            }`}
          >
            <Text
              className={`text-sm font-inter ${
                isDark ? "text-neutral-400" : "text-neutral-700"
              }`}
            >
              Password must be at least 6 characters long, contain at least one
              capital letter and one special character.
            </Text>
          </View>

          <View className="flex-row mt-6">
            <TouchableOpacity
              onPress={onClose}
              className={`flex-1 p-4 rounded-lg border mr-3 ${
                isDark
                  ? "border-neutral-700 bg-neutral-700"
                  : "border-neutral-300 bg-neutral-100"
              }`}
              disabled={updating}
            >
              <Text
                className={`text-center text-base font-inter-semibold ${
                  isDark ? "text-neutral-300" : "text-neutral-700"
                }`}
              >
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSubmit}
              className={`flex-1 p-4 rounded-lg border ${
                isDark
                  ? "border-neutral-700 bg-white"
                  : "border-neutral-300 bg-neutral-100"
              }`}
              disabled={
                updating ||
                !!newPasswordError ||
                newPassword !== confirmPassword ||
                !newPassword ||
                !confirmPassword
              }
            >
              <Text
                className={`text-center text-base font-inter-bold ${
                  isDark ? "text-black" : "text-black"
                }`}
              >
                {updating ? "Updating..." : "Update Password"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

export default ChangePasswordModal;
