import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { submitPostReport } from "../../services/reportService";

const ReportModal = ({
  visible,
  onClose,
  post,
  currentUser,
  onSuccess,
  onError,
  isDark,
}) => {
  const [selectedReason, setSelectedReason] = useState("");
  const [description, setDescription] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);

  const reportReasons = [
    "Inappropriate content",
    "Spam",
    "Harassment",
    "False information",
    "Other",
  ];

  const handleReportSubmit = async () => {
    if (!selectedReason) {
      onError("Please select a reason for reporting.");
      return;
    }

    try {
      const result = await submitPostReport(
        post.id,
        currentUser.id,
        selectedReason,
        description
      );

      if (result.success) {
        onSuccess(
          "Thank you for reporting this post. Our team will review it."
        );
        resetModal();
      } else {
        onError(result.error || "Failed to submit report");
      }
    } catch (error) {
      onError(
        error.message || "An error occurred while submitting the report."
      );
    }
  };

  const resetModal = () => {
    setSelectedReason("");
    setDescription("");
    setIsConfirming(false);
  };

  const handleConfirmSubmit = () => {
    setIsConfirming(true);
  };

  const handleCancel = () => {
    if (isConfirming) {
      setIsConfirming(false);
    } else {
      resetModal();
      onClose();
    }
  };

  const handleConfirm = () => {
    handleReportSubmit();
    onClose();
  };

  const renderReasonItem = ({ item }) => (
    <TouchableOpacity
      className={`flex-row justify-between items-center px-4 py-4 ${
        selectedReason === item
          ? isDark
            ? "bg-neutral-800"
            : "bg-neutral-200"
          : isDark
          ? "bg-neutral-900"
          : "bg-neutral-50"
      }`}
      onPress={() => setSelectedReason(item)}
    >
      <Text
        className={`text-base ${
          selectedReason === item
            ? isDark
              ? "text-white font-semibold"
              : "text-black font-semibold"
            : isDark
            ? "text-neutral-300"
            : "text-neutral-700"
        }`}
      >
        {item}
      </Text>
      {selectedReason === item && (
        <MaterialIcons
          name="check"
          size={20}
          color={isDark ? "#ffffff" : "#000000"}
        />
      )}
    </TouchableOpacity>
  );

  if (!visible) return null;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-neutral-950/50">
        <View
          className={`w-full max-w-md ${
            isDark ? "bg-neutral-900" : "bg-neutral-50"
          } rounded-2xl`}
        >
          {/* Header */}
          <View
            className={`flex-row justify-between items-center p-4 ${
              isDark
                ? "border-b border-neutral-800"
                : "border-b border-neutral-200"
            }`}
          >
            <TouchableOpacity onPress={handleCancel} className="p-2">
              <MaterialIcons
                name="close"
                size={24}
                color={isDark ? "#E5E7EB" : "#000"}
              />
            </TouchableOpacity>
            <Text
              className={`text-base font-semibold ${
                isDark ? "text-white" : "text-black"
              }`}
            >
              Report
            </Text>
            <View className="w-10"></View>
          </View>

          {isConfirming ? (
            // Confirmation View
            <View className="p-4">
              <Text
                className={`text-lg font-bold mb-4 text-center ${
                  isDark ? "text-white" : "text-black"
                }`}
              >
                Confirm Report
              </Text>
              
              {/* FIXED: Combined text into single Text component */}
              <Text
                className={`text-base text-center mb-4 ${
                  isDark ? "text-neutral-300" : "text-neutral-600"
                }`}
              >
                {`Are you sure you want to report this post for "${selectedReason}"?`}
              </Text>
              
              {/* FIXED: Combined description text */}
              <Text
                className={`text-base text-center mb-8 ${
                  isDark ? "text-neutral-300" : "text-neutral-600"
                }`}
              >
                {`Description: ${description || "No description provided"}`}
              </Text>
              
              <View className="flex-row">
                <TouchableOpacity
                  className={`flex-1 items-center justify-center rounded-2xl py-4 mr-2 ${
                    isDark ? "bg-neutral-800" : "bg-neutral-200"
                  }`}
                  onPress={handleCancel}
                >
                  <Text
                    className={`font-inter-bold text-base ${
                      isDark ? "text-white" : "text-black"
                    }`}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`flex-1 items-center justify-center rounded-2xl py-4 ml-2 ${
                    isDark ? "bg-white" : "bg-black"
                  }`}
                  onPress={handleConfirm}
                >
                  <Text
                    className={`font-inter-bold text-base ${
                      isDark ? "text-black" : "text-white"
                    }`}
                  >
                    Report
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            // Report Options View
            <>
              <Text
                className={`text-center py-4 ${
                  isDark ? "text-neutral-400" : "text-neutral-500"
                }`}
              >
                Why are you reporting this post?
              </Text>

              <FlatList
                data={reportReasons}
                renderItem={renderReasonItem}
                keyExtractor={(item) => item}
                showsVerticalScrollIndicator={false}
                className="max-h-80"
              />

              {selectedReason && (
                <View
                  className={`p-4 ${
                    isDark ? "bg-neutral-800" : "bg-neutral-100"
                  }`}
                >
                  <TextInput
                    className={`rounded-lg p-3 text-base h-32 ${
                      isDark
                        ? "bg-neutral-700 text-white placeholder:text-neutral-400"
                        : "bg-neutral-50 text-black placeholder:text-neutral-500"
                    }`}
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Add optional details..."
                    multiline
                    textAlignVertical="top"
                  />
                </View>
              )}

              <View
                className={`p-4 ${
                  isDark ? "bg-neutral-800" : "bg-neutral-100"
                }`}
              >
                <TouchableOpacity
                  className={`mb-4 items-center justify-center rounded-2xl py-4 ${
                    selectedReason
                      ? isDark
                        ? "bg-white"
                        : "bg-black"
                      : isDark
                      ? "bg-neutral-700"
                      : "bg-neutral-300"
                  }`}
                  onPress={handleConfirmSubmit}
                  disabled={!selectedReason}
                >
                  <Text
                    className={`font-inter-bold text-base ${
                      selectedReason
                        ? isDark
                          ? "text-black"
                          : "text-white"
                        : isDark
                        ? "text-neutral-400"
                        : "text-neutral-600"
                    }`}
                  >
                    Report Post
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default ReportModal;