import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState, useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  RefreshControl,
  ScrollView,
  Share,
  StatusBar,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../providers/AuthProvider";
import { useTutorial } from "../../providers/TutorialProvider";
import PostCard from "../../components/home/PostCard";
import Header from "../../components/home/Header";
import EmptyState from "../../components/home/EmptyState";
import ImageModal from "../../components/home/ImageModal";
import CommentsModal from "../../components/home/CommentsModal";
import NotificationsModal from "../../components/notifications/NotificationsModal";
import { createLoadingManager, debounce, createCacheWithTTL } from "../../utils/performance";
import WelcomeTutorialPrompt from "../../components/tutorial/WelcomeTutorialPrompt";
import TutorialOverlay from "../../components/tutorial/TutorialOverlay";
import { userTutorialSteps, homeFeedTutorialSteps } from "../../components/tutorial/tutorialSteps";

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
  const { user } = useAuth();
  const { startTutorial } = useTutorial();
  const [searchQuery, setSearchQuery] = useState(""); // Search query state
  const [isSearching, setIsSearching] = useState(false); // Search mode state
  const [notificationsVisible, setNotificationsVisible] = useState(false); // Notifications modal state
  const [showWelcomePrompt, setShowWelcomePrompt] = useState(false); // Tutorial prompt state
  
  // Create loading manager for better loading state handling
  const loadingManager = useMemo(() => createLoadingManager(setLoading), []);
  const refreshLoadingManager = useMemo(() => createLoadingManager(setRefreshing), []);
  
  // Create cache for posts
  const postsCache = useMemo(() => createCacheWithTTL(300000), []); // 5 minutes cache
  
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  useEffect(() => {
    setCurrentUser(user || null);
    loadPosts();
    // Show welcome prompt after a short delay
    const timer = setTimeout(() => {
      setShowWelcomePrompt(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Update filtered posts when debounced query changes
  useEffect(() => {
    if (debouncedQuery) {
      const filtered = filterPosts(debouncedQuery);
      setPosts(filtered);
    } else {
      setPosts(allPosts);
    }
  }, [allPosts, debouncedQuery, filterPosts]);

  const loadPosts = async () => {
    // Use loading manager instead of direct setLoading
    loadingManager.start(200); // Shorter delay for better UX
    
    try {
      // Check cache first
      const cachedPosts = postsCache.get('newsfeed_posts');
      if (cachedPosts && !refreshing) {
        setAllPosts(cachedPosts);
        setPosts(cachedPosts);
        loadingManager.stop();
        return;
      }

      // Get current user
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      setCurrentUser(currentUser);

      // Fetch posts with pagination
      const { data: postsData, error: postsError } = await supabase
        .from("newsfeed_posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30); // Limit to 30 posts for better performance

      if (postsError) throw postsError;

      // Get likes count and user's like status for each post with optimized queries
      const processedPosts = await Promise.all(
        (postsData || []).map(async (post) => {
          // Use batch queries for better performance
          const [likesResult, commentsResult, userLikeResult] = await Promise.all([
            // Likes count
            supabase
              .from("newsfeed_likes")
              .select("*", { count: "exact", head: true })
              .eq("post_id", post.id),
            
            // Comments count
            supabase
              .from("newsfeed_comments")
              .select("*", { count: "exact", head: true })
              .eq("post_id", post.id),
              
            // User like status (only if user is logged in)
            currentUser 
              ? supabase
                  .from("newsfeed_likes")
                  .select("id")
                  .eq("post_id", post.id)
                  .eq("user_id", currentUser.id)
                  .maybeSingle()
              : Promise.resolve({ data: null, error: null })
          ]);

          const [likesData, commentsData, userLikeData] = [likesResult, commentsResult, userLikeResult];
          
          // Handle errors gracefully
          if (likesData.error) console.error("likesError:", likesData.error);
          if (commentsData.error) console.error("commentsError:", commentsData.error);
          if (userLikeData?.error) console.error("userLikeError:", userLikeData.error);

          return {
            ...post,
            likes_count: likesData.count || 0,
            user_has_liked: !!userLikeData?.data,
            comments_count: commentsData.count || 0,
          };
        })
      );

      // Cache the results
      postsCache.set('newsfeed_posts', processedPosts);
      
      setAllPosts(processedPosts); // Store all posts
      setPosts(processedPosts); // Set initial posts
    } catch (err) {
      console.error("Failed to load posts:", err);
      Alert.alert("Error", "Could not fetch posts.");
    } finally {
      loadingManager.stop();
    }
  };

  const onRefresh = useCallback(async () => {
    refreshLoadingManager.start(100);
    await loadPosts();
    refreshLoadingManager.stop();
  }, [loadPosts]);

  // Filter posts based on search query
  const filterPosts = useCallback(
    (query) => {
      if (!query.trim()) {
        return allPosts;
      }

      const normalizedQuery = query.toLowerCase().trim();
      return allPosts.filter((post) => {
        // Check pet name
        if (
          post.pet_name &&
          post.pet_name.toLowerCase().includes(normalizedQuery)
        ) {
          return true;
        }

        // Check display name
        if (
          post.display_name &&
          post.display_name.toLowerCase().includes(normalizedQuery)
        ) {
          return true;
        }

        // Check analysis result
        if (
          post.analysis_result &&
          post.analysis_result.toLowerCase().includes(normalizedQuery)
        ) {
          return true;
        }

        // Check if anonymous and query matches "anonymous"
        if (post.is_anonymous && normalizedQuery === "anonymous") {
          return true;
        }

        return false;
      });
    },
    [allPosts]
  );

  const handleSearch = (query) => {
    setSearchQuery(query);
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
      // Check if user is a veterinarian and get their profile info
        let commentDisplayName = currentUser.user_metadata?.options?.data?.display_name || "Pet Owner";
        let commentRole = currentUser.user_metadata?.options?.data?.role || "User";
        
        if (commentRole === 'veterinarian') {
          // If the user is a veterinarian, get their name from vet_profiles
          const { data: vetProfile, error: profileError } = await supabase
            .from('vet_profiles')
            .select('name')
            .eq('id', currentUser.id)
            .single();

          if (!profileError && vetProfile?.name) {
            commentDisplayName = vetProfile.name;
          }
        } else {
          // If the user is a regular user, get their name from user_profiles
          const { data: userProfile, error: profileError } = await supabase
            .from('user_profiles')
            .select('name')
            .eq('id', currentUser.id)
            .single();

          if (!profileError && userProfile?.name) {
            commentDisplayName = userProfile.name;
          }
        }

        const { data, error } = await supabase
        .from("newsfeed_comments")
        .insert([
          {
            post_id: selectedPostId,
            user_id: currentUser.id,
            comment_text: newComment.trim(),
            display_name: commentDisplayName,
            created_at: new Date().toISOString(),
            role: commentRole,
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
    else if (secondsAgo < 86400)
      timeAgo = `${Math.floor(secondsAgo / 3600)}h ago`;
    else if (secondsAgo < 604800)
      timeAgo = `${Math.floor(secondsAgo / 86400)}d ago`;
    else timeAgo = postTime.toLocaleDateString();

    return timeAgo;
  };

  const formatFullDateTime = (timestamp) => {
    const postTime = new Date(timestamp);
    const dateOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    const timeOptions = {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    };

    const date = postTime.toLocaleDateString("en-US", dateOptions);
    const time = postTime.toLocaleTimeString("en-US", timeOptions);
    const timeAgo = formatTimeAgo(timestamp);

    return `${date}   ${time}  ${timeAgo}`;
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white dark:bg-black">
        <ActivityIndicator size="large" color="#007AFF" />
        <Text className="mt-4 text-base font-inter-bold text-neutral-400 dark:text-neutral-500">
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
        <Header
          isDark={isDark}
          onSearch={handleSearch}
          isSearching={isSearching}
          searchQuery={searchQuery}
          onClearSearch={clearSearch}
          setIsSearching={setIsSearching}
          onNotificationPress={() => setNotificationsVisible(true)}
          onShowTutorial={() => startTutorial('homeFeed')}
        />

        {showWelcomePrompt && (
          <WelcomeTutorialPrompt
            tutorialType="user"
            onDismiss={() => setShowWelcomePrompt(false)}
          />
        )}

        <EmptyState isDark={isDark} isEmpty={posts.length === 0} />

        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            isDark={isDark}
            currentUser={currentUser}
            onToggleLike={toggleLike}
            onOpenComments={openCommentsModal}
            onShare={handleShare}
            onOpenImageModal={openImageModal}
            onViewProfile={(userId) => router.push(`/(user)/vet-profile?vetId=${userId}`)}
          />
        ))}
      </ScrollView>

      <TutorialOverlay steps={homeFeedTutorialSteps} tutorialId="homeFeed" />

      <ImageModal
        visible={imageModalVisible}
        onClose={closeImageModal}
        imageUrl={selectedImage}
      />

      <CommentsModal
        visible={commentsModalVisible}
        onClose={closeCommentsModal}
        isDark={isDark}
        loadingComments={loadingComments}
        comments={comments}
        newComment={newComment}
        setNewComment={setNewComment}
        postingComment={postingComment}
        postComment={postComment}
        currentUser={currentUser}
        selectedPost={posts.find((p) => p.id === selectedPostId)}
        formatFullDateTime={formatFullDateTime}
        onViewProfile={(userId) => router.push(`/(user)/vet-profile?vetId=${userId}`)}
      />

      <NotificationsModal
        visible={notificationsVisible}
        onClose={() => setNotificationsVisible(false)}
      />
    </SafeAreaView>
  );
};

export default NewsFeedScreen;
