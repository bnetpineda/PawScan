import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  Share,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import TutorialModal, {
  useTutorial,
} from "../../assets/components/TutorialHomeModal"; // Adjust path as needed
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../providers/AuthProvider";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const NewsFeedScreen = () => {
  const isDark = useColorScheme() === "dark";

  const [posts, setPosts] = useState([]);
  const [allPosts, setAllPosts] = useState([]); // Store all posts for filtering
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
  const [searchQuery, setSearchQuery] = useState(""); // Search query state
  const [isSearching, setIsSearching] = useState(false); // Search mode state

  useEffect(() => {
    setCurrentUser(user || null);
    loadPosts();
    checkFirstTimeUser();
  }, []);

  // Update filtered posts when allPosts or searchQuery changes
  useEffect(() => {
    if (searchQuery) {
      const filtered = filterPosts(searchQuery);
      setPosts(filtered);
    }
  }, [allPosts, searchQuery, filterPosts]);

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

  // Function to determine urgency level from analysis text
  const getUrgencyLevel = (analysisText) => {
    if (!analysisText) return { level: "none", color: "#10B981", text: "No Analysis" };

    const text = analysisText.toLowerCase();

    // Check for high urgency keywords
    if (text.includes("urgent") || text.includes("emergency") ||
      text.includes("immediate") || text.includes("severe") ||
      text.includes("critical") || text.includes("serious condition") ||
      text.includes("high urgency") || text.includes("life-threatening")) {
      return { level: "high", color: "#EF4444", text: "High Urgency" };
    }

    // Check for high urgency keywords
    if (text.includes("urgent") || text.includes("immediate") || text.includes("emergency") ||
      text.includes("severe") || text.includes("critical") || text.includes("serious") ||
      text.includes("high risk") || text.includes("dangerous")) {
      return { level: "high", color: "#F44336", text: "High Urgency" };
    }

    // Check for medium urgency keywords
    if (text.includes("moderate") || text.includes("concerning") ||
      text.includes("veterinarian") || text.includes("vet") || text.includes("medical attention") ||
      text.includes("medium") || text.includes("caution")) {
      return { level: "medium", color: "#FF9800", text: "Medium Urgency" };
    }

    // Check for low urgency keywords
    if (text.includes("mild") || text.includes("minor") ||
      text.includes("slight") || text.includes("observe") || text.includes("watch")) {
      return { level: "low", color: "#FFC107", text: "Low Urgency" };
    }

    // Check for no disease keywords
    if (text.includes("no skin disease detected") ||
      text.includes("no specific skin disease detected") || text.includes("low")) {
      return { level: "none", color: "#4CAF50", text: "No Disease" };
    }

    // Default to low if no specific keywords found but has analysis
    return { level: "low", color: "#FFFFFF", text: "Not a Dog or Cat" };
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

          // Get total comments count for this post
          const { count: commentsCount } = await supabase
            .from("newsfeed_comments")
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
            comments_count: commentsCount || 0, // You can implement this similarly if needed
          };
        })
      );

      setAllPosts(processedPosts); // Store all posts
      setPosts(processedPosts); // Set initial posts
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

  // Filter posts based on search query
  const filterPosts = useCallback((query) => {
    if (!query.trim()) {
      return allPosts;
    }
    
    const normalizedQuery = query.toLowerCase().trim();
    return allPosts.filter(post => {
      // Check pet name
      if (post.pet_name && post.pet_name.toLowerCase().includes(normalizedQuery)) {
        return true;
      }
      
      // Check display name
      if (post.display_name && post.display_name.toLowerCase().includes(normalizedQuery)) {
        return true;
      }
      
      // Check analysis result
      if (post.analysis_result && post.analysis_result.toLowerCase().includes(normalizedQuery)) {
        return true;
      }
      
      // Check if anonymous and query matches "anonymous"
      if (post.is_anonymous && normalizedQuery === "anonymous") {
        return true;
      }
      
      return false;
    });
  }, [allPosts]);

  // Handle search input changes
  const handleSearch = (query) => {
    setSearchQuery(query);
    const filtered = filterPosts(query);
    setPosts(filtered);
  };

  // Clear search and show all posts
  const clearSearch = () => {
    setSearchQuery("");
    setPosts(allPosts);
    setIsSearching(false);
  };

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

    let timeAgo;
    if (secondsAgo < 60) timeAgo = "Just now";
    else if (secondsAgo < 3600) timeAgo = `${Math.floor(secondsAgo / 60)}m ago`;
    else if (secondsAgo < 86400) timeAgo = `${Math.floor(secondsAgo / 3600)}h ago`;
    else if (secondsAgo < 604800) timeAgo = `${Math.floor(secondsAgo / 86400)}d ago`;
    else timeAgo = postTime.toLocaleDateString();

    return timeAgo;
  };

  const formatFullDateTime = (timestamp) => {
    const postTime = new Date(timestamp);
    const dateOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    const timeOptions = {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    };

    const date = postTime.toLocaleDateString('en-US', dateOptions);
    const time = postTime.toLocaleTimeString('en-US', timeOptions);
    const timeAgo = formatTimeAgo(timestamp);

    return `${date}   ${time}  ${timeAgo}`;
  };

  const PostCard = ({ post }) => {
    const isAnonymous = post.is_anonymous;
    const userDisplayName = isAnonymous
      ? "Anonymous User"
      : post.display_name || "Pet Owner";

    // Track expanded state per post
    const [expanded, setExpanded] = useState(false);

    // Get urgency level for this post
    const urgencyInfo = getUrgencyLevel(post.analysis_result);

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
                {formatFullDateTime(post.created_at)}
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
            className="flex-row items-center mr-6"
            onPress={() => handleShare(post)}
            activeOpacity={0.7}
          >
            <FontAwesome
              name="share"
              size={20}
              color={isDark ? "#8E8E93" : "#6C757D"}
            />
          </TouchableOpacity>

          {/* Urgency Level Indicator */}
          <View className="flex-row items-center">
            <FontAwesome
              name="flag"
              size={18}
              color={urgencyInfo.color}
            />
            <Text
              className="ml-2 text-sm font-inter-semibold"
              style={{ color: urgencyInfo.color }}
            >
              {urgencyInfo.text}
            </Text>
          </View>
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
        
        {/* Search Bar */}
        {isSearching ? (
          <View className="px-4 py-3 border-b border-gray-200 dark:border-neutral-800">
            <View className="flex-row items-center bg-gray-100 dark:bg-neutral-800 rounded-full px-4 py-2">
              <FontAwesome
                name="search"
                size={18}
                color={isDark ? "#8E8E93" : "#6C757D"}
              />
              <TextInput
                value={searchQuery}
                onChangeText={handleSearch}
                placeholder="Search posts..."
                placeholderTextColor={isDark ? "#8E8E93" : "#6C757D"}
                className="flex-1 mx-2 font-inter text-black dark:text-white"
                autoFocus
              />
              <TouchableOpacity onPress={clearSearch}>
                <FontAwesome
                  name="times"
                  size={18}
                  color={isDark ? "#8E8E93" : "#6C757D"}
                />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* Top Header with Icons */
          <View className="flex-row justify-center items-center px-5 py-4 border-b border-gray-200 dark:border-neutral-800 divide-x divide-gray-200 dark:divide-neutral-800">
            <TouchableOpacity
              className="flex-1 items-center"
              onPress={() => setIsSearching(true)}
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
        )}
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
        
        {/* Chat with Users Button */}
        <View className="px-4 py-6">
          <TouchableOpacity
            className="bg-blue-500 rounded-full py-3 px-6 flex-row items-center justify-center"
            onPress={() => router.push('/(vet)/chat')}
          >
            <FontAwesome name="comment" size={20} color="white" />
            <Text className="text-white font-inter-bold text-lg ml-2">
              Chat with Users
            </Text>
          </TouchableOpacity>
        </View>
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
            <View className="border-t border-gray-200 dark:border-neutral-800 px-4 py-3">
              <View className="flex-row items-end">
                <View className="flex-1 mr-3">
                  <TextInput
                    value={newComment}
                    onChangeText={setNewComment}
                    placeholder="Write a comment..."
                    placeholderTextColor={isDark ? "#8E8E93" : "#6C757D"}
                    multiline
                    maxLength={500}
                    className="border border-gray-300 dark:border-neutral-600 rounded-2xl px-4 py-3 text-black dark:text-white font-inter bg-gray-50 dark:bg-neutral-800 max-h-24"
                    style={{ textAlignVertical: "top" }}
                  />
                </View>
                <TouchableOpacity
                  onPress={postComment}
                  disabled={postingComment || !newComment.trim()}
                  className={`w-12 h-12 rounded-full justify-center items-center ${postingComment || !newComment.trim()
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