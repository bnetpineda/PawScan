import { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAvoidingView } from "react-native";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";

const CommentsModal = ({
  visible,
  onClose,
  isDark,
  loadingComments,
  comments,
  newComment,
  setNewComment,
  postingComment,
  postComment,
  currentUser,
  selectedPost,
  formatFullDateTime,
}) => {
  const isOwner = currentUser?.id === selectedPost?.user_id;
  const isVet =
    currentUser?.user_metadata?.options?.data?.role === "Veterinarian";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-white dark:bg-black">
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          {/* Comments Header */}
          <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-200 dark:border-neutral-800">
            <Text className="text-lg font-inter-semibold text-black dark:text-white">
              Comments
            </Text>
            <TouchableOpacity onPress={onClose} className="p-2">
              <FontAwesome
                name="times"
                size={20}
                color={isDark ? "#8E8E93" : "#6C757D"}
              />
            </TouchableOpacity>
          </View>

          {/* Comments List */}
          <View className="flex-1">
            {loadingComments ? (
              <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color="#007AFF" />
                <Text className="mt-2 font-inter-bold text-gray-500 dark:text-gray-400">
                  Loading comments...
                </Text>
              </View>
            ) : comments.length === 0 ? (
              <View className="flex-1 justify-center items-center px-8">
                <FontAwesome
                  name="comment-o"
                  size={48}
                  color={isDark ? "#8E8E93" : "#6C757D"}
                />
                <Text className="text-lg font-inter-semibold text-black dark:text-white mt-4 text-center">
                  No comments yet
                </Text>
                <Text className="text-gray-500 font-inter dark:text-gray-400 text-center mt-2">
                  Be the first to share your thoughts!
                </Text>
              </View>
            ) : (
              <FlatList
                data={comments}
                keyExtractor={(item) => item.id}
                className="flex-1 px-4"
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <View className="py-3 border-b border-gray-100 dark:border-neutral-800">
                    <View className="flex-row items-start">
                      <View className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700 justify-center items-center mr-3 mt-1">
                        <FontAwesome
                          name="user"
                          size={14}
                          color={isDark ? "#8E8E93" : "#6C757D"}
                        />
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-center mb-1">
                          <Text className="font-inter-bold text-black dark:text-white mr-2">
                            {item.display_name || "Pet Owner"}
                          </Text>
                          {item.role === "Veterinarian" && (
                            <MaterialIcons
                              name="verified"
                              size={16}
                              color="#007AFF"
                              style={{ marginRight: 4 }}
                            />
                          )}
                          <Text className="text-xs font-inter text-gray-400 dark:text-gray-500">
                            {formatFullDateTime(item.created_at)}
                          </Text>
                        </View>
                        <Text className="text-gray-800 font-inter dark:text-gray-200 leading-5">
                          {item.comment_text}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              />
            )}
          </View>

          {/* Comment Input */}
          {selectedPost && (isOwner || isVet) ? (
            <View className="border-t border-gray-200 dark:border-neutral-800 px-4 py-3">
              <View className="flex-row items-end">
                <View className="flex-1 mr-3">
                  <TextInput
                    value={newComment}
                    onChangeText={setNewComment}
                    placeholder="Write a comment..."
                    placeholderTextColor={
                      isDark ? "#8E8E93" : "#6C757D"
                    }
                    multiline
                    maxLength={500}
                    className="border border-gray-300 dark:border-neutral-600 rounded-2xl px-4 py-3 text-black dark:text-white font-inter bg-neutral-50 dark:bg-neutral-800 max-h-24"
                    style={{ textAlignVertical: "top" }}
                  />
                </View>
                <TouchableOpacity
                  onPress={postComment}
                  disabled={postingComment || !newComment.trim()}
                  className={`w-12 h-12 rounded-full justify-center items-center ${postingComment || !newComment.trim()
                      ? "bg-neutral-200 dark:bg-neutral-700"
                      : "bg-blue-500"
                    }`}
                >
                  {postingComment ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <FontAwesome
                      name="send"
                      size={16}
                      color={
                        !newComment.trim()
                          ? isDark
                            ? "#8E8E93"
                            : "#6C757D"
                          : "white"
                      }
                    />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : selectedPost ? (
            <View className="border-t border-gray-200 dark:border-neutral-800 px-4 py-3">
              <Text className="text-center text-gray-500 dark:text-gray-400 font-inter">
                Only the post owner and veterinarians can comment.
              </Text>
            </View>
          ) : null}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

export default CommentsModal;