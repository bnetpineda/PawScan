import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  StatusBar,
  useColorScheme,
  Modal,
  Dimensions,
  Share,
  Platform,
  TextInput,
  KeyboardAvoidingView,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../providers/AuthProvider";
import { router } from "expo-router";
import TutorialModal, {
  useTutorial,
} from "../../assets/components/TutorialHomeModal"; // Adjust path as needed
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const NewsFeedScreen = () => {
  const isDark = useColorScheme() === "dark";

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [commentsModalVisible, setCommentsModalVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [postingComment, setPostingComment] = useState(false);
  const [numLines, setNumLines] = useState(4); // Default number of lines for analysis text
  const { user } = useAuth();
  const { showTutorial, startTutorial, closeTutorial } = useTutorial();
  const [tutorialVisible, setTutorialVisible] = useState(false);

  useEffect(() => {
    setCurrentUser(user || null);
    loadPosts();
    checkFirstTimeUser();
  }, []);

  const checkFirstTimeUser = async () => {
    try {
      const hasSeenTutorial = await AsyncStorage.getItem(
        "hasSeenNewsfeedTutorial"
      );
      if (!hasSeenTutorial) {
        // Show tutorial after a brief delay to let the screen load
        setTimeout(() => {
          setTutorialVisible(true);
        }, 1000);
      }
    } catch (error) {
      console.error("Error checking tutorial status:", error);
    }
  };

  // Function to handle tutorial completion
  const handleTutorialClose = async () => {
    try {
      await AsyncStorage.setItem("hasSeenNewsfeedTutorial", "true");
      setTutorialVisible(false);
    } catch (error) {
      console.error("Error saving tutorial status:", error);
    }
  };

  // Function to manually start tutorial (for help button)
  const handleShowTutorial = () => {
    setTutorialVisible(true);
  };

  const loadPosts = async () => {
    try {
      // Get posts first
      const { data: postsData, error: postsError } = await supabase
        .from("newsfeed_posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (postsError) throw postsError;

      // Get likes count and user's like status for each post
      const processedPosts = await Promise.all(
        (postsData || []).map(async (post) => {
          // Get total likes count for this post
          const { count: likesCount } = await supabase
            .from("newsfeed_likes")
            .select("*", { count: "exact", head: true })
            .eq("post_id", post.id);

          // Check if current user has liked this post
          let userHasLiked = false;
          if (currentUser) {
            const { data: userLike } = await supabase
              .from("newsfeed_likes")
              .select("id")
              .eq("post_id", post.id)
              .eq("user_id", currentUser.id)
              .single();

            userHasLiked = !!userLike;
          }

          return {
            ...post,
            likes_count: likesCount || 0,
            user_has_liked: userHasLiked,
            comments_count: 0, // You can implement this similarly if needed
          };
        })
      );

      setPosts(processedPosts);
    } catch (err) {
      console.error("Failed to load posts:", err);
      Alert.alert("Error", "Could not fetch posts.");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  }, []);

  const toggleLike = async (postId, isLiked) => {
    if (!currentUser) {
      Alert.alert("Sign In Required", "Please sign in to like posts.");
      return;
    }

    // Optimistic update
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              likes_count: post.likes_count + (isLiked ? -1 : 1),
              user_has_liked: !isLiked,
            }
          : post
      )
    );

    try {
      if (isLiked) {
        const { error } = await supabase
          .from("newsfeed_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", currentUser.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("newsfeed_likes").insert([
          {
            post_id: postId,
            user_id: currentUser.id,
            created_at: new Date().toISOString(),
          },
        ]);

        if (error) throw error;
      }
    } catch (err) {
      console.error("Error updating like:", err);

      // Revert optimistic update on error
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                likes_count: post.likes_count + (isLiked ? 1 : -1),
                user_has_liked: isLiked,
              }
            : post
        )
      );

      Alert.alert("Error", "Could not update like. Please try again.");
    }
  };

  const handleShare = async (post) => {
    try {
      const shareContent = {
        message: `Check out this pet health analysis: ${post.analysis_result}`,
        url: post.image_url, // You might want to create a proper sharing URL
        title: "Pet Health Analysis from Pet Community",
      };

      if (Platform.OS === "ios") {
        await Share.share({
          message: shareContent.message,
          url: shareContent.url,
          title: shareContent.title,
        });
      } else {
        await Share.share({
          message: `${shareContent.message}\n${shareContent.url}`,
          title: shareContent.title,
        });
      }
    } catch (error) {
      console.error("Error sharing:", error);
      Alert.alert("Error", "Could not share post.");
    }
  };

  const loadComments = async (postId) => {
    setLoadingComments(true);
    try {
      const { data, error } = await supabase
        .from("newsfeed_comments")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (err) {
      console.error("Failed to load comments:", err);
      Alert.alert("Error", "Could not fetch comments.");
    } finally {
      setLoadingComments(false);
    }
  };

  const openCommentsModal = (postId) => {
    setSelectedPostId(postId);
    setCommentsModalVisible(true);
    loadComments(postId);
  };

  const closeCommentsModal = () => {
    setCommentsModalVisible(false);
    setSelectedPostId(null);
    setComments([]);
    setNewComment("");
  };

  const postComment = async () => {
    if (!currentUser) {
      Alert.alert("Sign In Required", "Please sign in to comment.");
      return;
    }

    if (!newComment.trim()) {
      Alert.alert("Empty Comment", "Please write a comment before posting.");
      return;
    }

    setPostingComment(true);
    try {
      const { data, error } = await supabase
        .from("newsfeed_comments")
        .insert([
          {
            post_id: selectedPostId,
            user_id: currentUser.id,
            comment_text: newComment.trim(),
            display_name:
              currentUser.user_metadata?.options?.data?.display_name ||
              "Pet Owner", // Use email prefix as display name
            created_at: new Date().toISOString(),
            role: currentUser.user_metadata?.options?.data?.role || "User",
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Add the new comment to the list
      setComments((prev) => [...prev, data]);

      // Update the comments count in posts
      setPosts((prev) =>
        prev.map((post) =>
          post.id === selectedPostId
            ? { ...post, comments_count: post.comments_count + 1 }
            : post
        )
      );

      setNewComment("");
    } catch (err) {
      console.error("Error posting comment:", err);
      Alert.alert("Error", "Could not post comment. Please try again.");
    } finally {
      setPostingComment(false);
    }
  };

  const openImageModal = (imageUrl) => {
    setSelectedImage(imageUrl);
    setImageModalVisible(true);
  };

  const closeImageModal = () => {
    setImageModalVisible(false);
    setSelectedImage(null);
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const postTime = new Date(timestamp);
    const secondsAgo = Math.floor((now - postTime) / 1000);

    if (secondsAgo < 60) return "Just now";
    if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)}m ago`;
    if (secondsAgo < 86400) return `${Math.floor(secondsAgo / 3600)}h ago`;
    if (secondsAgo < 604800) return `${Math.floor(secondsAgo / 86400)}d ago`;

    return postTime.toLocaleDateString();
  };

  const PostCard = ({ post }) => {
    const isAnonymous = post.is_anonymous;
    const userDisplayName = isAnonymous
      ? "Anonymous User"
      : post.display_name || "Pet Owner";

    // Track expanded state per post
    const [expanded, setExpanded] = useState(false);

    return (
      <View
        key={post.id}
        className="mx-4 my-2 rounded-2xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 3,
        }}
      >
        {/* Header */}
        <View className="flex-row justify-between items-center p-4">
          <View className="flex-row items-center flex-1">
            <View className="w-10 h-10 rounded-full bg-gray-100 dark:bg-neutral-800 justify-center items-center mr-3">
              <FontAwesome
                name={isAnonymous ? "user" : "user-circle"}
                size={isAnonymous ? 20 : 32}
                color={
                  isAnonymous ? (isDark ? "#8E8E93" : "#6C757D") : "#007AFF"
                }
              />
            </View>
            <View className="flex-1">
              <Text className="text-base font-inter-semibold text-black dark:text-white">
                {userDisplayName}
              </Text>
              {post.pet_name && (
                <Text className="text-sm font-inter text-gray-500 dark:text-gray-400">
                  Pet: {post.pet_name}
                </Text>
              )}
              <Text className="text-xs font-inter text-gray-400 dark:text-gray-500">
                {formatTimeAgo(post.created_at)}
              </Text>
            </View>
          </View>
          <TouchableOpacity className="p-2">
            <FontAwesome
              name="ellipsis-h"
              size={16}
              color={isDark ? "#8E8E93" : "#6C757D"}
            />
          </TouchableOpacity>
        </View>

        {/* Image - Now clickable */}
        <TouchableOpacity
          onPress={() => openImageModal(post.image_url)}
          activeOpacity={0.9}
        >
          <Image
            source={{ uri: post.image_url }}
            className="w-full h-72"
            resizeMode="cover"
          />
        </TouchableOpacity>

        {/* Action Buttons */}
        <View className="flex-row items-center px-4 py-3">
          <TouchableOpacity
            className="flex-row items-center mr-6"
            onPress={() => toggleLike(post.id, post.user_has_liked)}
            activeOpacity={0.7}
          >
            <FontAwesome
              name={post.user_has_liked ? "heart" : "heart-o"}
              size={20}
              color={
                post.user_has_liked ? "#FF3B30" : isDark ? "#8E8E93" : "#6C757D"
              }
            />
            <Text className="ml-2 text-sm font-inter text-gray-600 dark:text-gray-400">
              {post.likes_count || 0}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center mr-6"
            onPress={() => openCommentsModal(post.id)}
            activeOpacity={0.7}
          >
            <FontAwesome
              name="comment-o"
              size={20}
              color={isDark ? "#8E8E93" : "#6C757D"}
            />
            <Text className="ml-2 text-sm font-inter text-gray-600 dark:text-gray-400">
              {post.comments_count || 0}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center"
            onPress={() => handleShare(post)}
            activeOpacity={0.7}
          >
            <FontAwesome
              name="share"
              size={20}
              color={isDark ? "#8E8E93" : "#6C757D"}
            />
          </TouchableOpacity>
        </View>

        {/* Analysis */}
        <View className="px-4 pb-4">
          <Text className="text-base font-inter-semibold text-black dark:text-white mb-2">
            Pet Health Analysis
          </Text>
          <Text
            className="text-sm text-gray-600 font-inter dark:text-gray-400 mb-2"
            numberOfLines={expanded ? undefined : 4}
          >
            {post.analysis_result}
          </Text>
          {!expanded && (
            <TouchableOpacity onPress={() => setExpanded(true)}>
              <Text className="text-sm font-inter-semibold text-blue-600 dark:text-white">
                Read More
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white dark:bg-black">
        <ActivityIndicator size="large" color="#007AFF" />
        <Text className="mt-4 text-base font-inter-bold text-gray-400 dark:text-gray-500">
          Loading newsfeed...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black">
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={isDark ? "#000" : "#fff"}
      />

      <ScrollView
        className="flex-1 mt-2"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#007AFF"
          />
        }
      >
        {/* Top Header */}
        <View className="flex-row items-center px-5 py-4 border-b border-gray-200 dark:border-neutral-800">
          <Image
            source={require("../../assets/images/home-logo.png")}
            className="w-8 h-9"
            resizeMode="cover"
          />
          <Text className="text-2xl font-inter-bold text-black dark:text-white ml-2">
            PawScan
          </Text>
          <View className="flex-1" />
          <TouchableOpacity
            className="px-3 py-1"
            onPress={handleShowTutorial}
            activeOpacity={0.7}
          >
            <Text className="text-base font-inter-bold text-blue-600 dark:text-blue-400">
              Help
            </Text>
          </TouchableOpacity>
        </View>
        {/* Top Header */}
        <View className="flex-row justify-center items-center px-5 py-4 border-b border-gray-200 dark:border-neutral-800 divide-x divide-gray-200 dark:divide-neutral-800">
          <TouchableOpacity
            className="flex-1 items-center"
            onPress={() => console.log("Search pressed")}
          >
            <FontAwesome
              name="search"
              size={20}
              color={isDark ? "#fff" : "#6C757D"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 items-center"
            onPress={() => router.push("info")}
          >
            <FontAwesome
              name="info"
              size={20}
              color={isDark ? "#fff" : "#6C757D"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 items-center"
            onPress={() => router.push("history")}
          >
            <FontAwesome
              name="history"
              size={20}
              color={isDark ? "#fff" : "#6C757D"}
            />
          </TouchableOpacity>
        </View>
        {posts.length === 0 ? (
          <View className="flex-1 justify-center items-center py-20">
            <FontAwesome
              name="heart-o"
              size={48}
              color={isDark ? "#8E8E93" : "#6C757D"}
            />
            <Text className="text-xl font-inter-semibold text-black dark:text-white mt-4">
              No posts yet
            </Text>
            <Text className="text-base font-inter text-gray-500 dark:text-gray-400 text-center px-8">
              Share your pet's health analysis to be the first!
            </Text>
          </View>
        ) : (
          posts.map((post) => <PostCard key={post.id} post={post} />)
        )}
      </ScrollView>

      {/* Image Modal */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeImageModal}
      >
        <View className="flex-1 bg-black bg-opacity-90 justify-center items-center">
          <TouchableOpacity
            className="absolute top-12 right-4 z-10 w-10 h-10 rounded-full bg-black bg-opacity-50 justify-center items-center"
            onPress={closeImageModal}
          >
            <FontAwesome name="times" size={20} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 justify-center items-center w-full"
            onPress={closeImageModal}
            activeOpacity={1}
          >
            {selectedImage && (
              <Image
                source={{ uri: selectedImage }}
                style={{
                  width: screenWidth,
                  height: screenHeight * 0.8,
                }}
                resizeMode="contain"
              />
            )}
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Comments Modal */}
      <Modal
        visible={commentsModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeCommentsModal}
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
              <TouchableOpacity onPress={closeCommentsModal} className="p-2">
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
                        <View className="w-8 h-8 rounded-full bg-gray-200 dark:bg-neutral-700 justify-center items-center mr-3 mt-1">
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
                              {formatTimeAgo(item.created_at)}
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
            {(() => {
              const selectedPost = posts.find((p) => p.id === selectedPostId);
              if (!selectedPost) return null;

              const isOwner = currentUser?.id === selectedPost.user_id;
              const isVet =
                currentUser?.user_metadata?.options?.data?.role ===
                "Veterinarian";

              if (isOwner || isVet) {
                return (
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
                          className="border border-gray-300 dark:border-neutral-600 rounded-2xl px-4 py-3 text-black dark:text-white font-inter bg-gray-50 dark:bg-neutral-800 max-h-24"
                          style={{ textAlignVertical: "top" }}
                        />
                      </View>
                      <TouchableOpacity
                        onPress={postComment}
                        disabled={postingComment || !newComment.trim()}
                        className={`w-12 h-12 rounded-full justify-center items-center ${
                          postingComment || !newComment.trim()
                            ? "bg-gray-200 dark:bg-neutral-700"
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
                );
              } else {
                return (
                  <View className="border-t border-gray-200 dark:border-neutral-800 px-4 py-3">
                    <Text className="text-center text-gray-500 dark:text-gray-400 font-inter">
                      Only the post owner and veterinarians can comment.
                    </Text>
                  </View>
                );
              }
            })()}
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
      <TutorialModal
        visible={tutorialVisible}
        onClose={handleTutorialClose}
        isDark={isDark}
      />
    </SafeAreaView>
  );
};

export default NewsFeedScreen;
