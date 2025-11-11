import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  Share,
  StatusBar,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../providers/AuthProvider";
import { useTutorial } from "../../providers/TutorialProvider";
import PostCard from "../../components/home/PostCard";
import Header from "../../components/home/Header";
import EmptyState from "../../components/home/EmptyState";
import ImageModal from "../../components/home/ImageModal";
import CommentsModal from "../../components/home/CommentsModal";
import NotificationsModal from "../../components/notifications/NotificationsModal";
import WelcomeTutorialPrompt from "../../components/tutorial/WelcomeTutorialPrompt";
import TutorialOverlay from "../../components/tutorial/TutorialOverlay";
import { homeFeedTutorialSteps, vetTutorialSteps } from "../../components/tutorial/tutorialSteps";
import { useNewsfeed } from "../../hooks/useNewsfeed";
import { useComments } from "../../hooks/useComments";
import { formatFullDateTime } from "../../utils/dateFormat";

const VetNewsFeedScreen = () => {
  const isDark = useColorScheme() === "dark";
  const { user } = useAuth();
  const { startTutorial } = useTutorial();
  const [searchQuery, setSearchQuery] = useState("");
  const { openComments } = useLocalSearchParams();

  // Use custom hooks for newsfeed and comments
  const {
    posts,
    loading,
    refreshing,
    loadingMore,
    hasMore,
    refresh,
    loadMore,
    toggleLike,
    updateCommentCount,
  } = useNewsfeed(searchQuery);

  // Modal states
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [commentsModalVisible, setCommentsModalVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [showWelcomePrompt, setShowWelcomePrompt] = useState(false);

  // Comments hook
  const {
    comments,
    loading: loadingComments,
    posting: postingComment,
    newComment,
    setNewComment,
    loadComments,
    postComment,
  } = useComments(selectedPostId, updateCommentCount);

  // Show welcome prompt on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcomePrompt(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Search handlers
  const handleSearch = useCallback(
    (query) => {
      setSearchQuery(query);
      setIsSearching(query.length > 0); // Also updates isSearching state
    },
    []
  );

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setIsSearching(false);
  }, []);

  // Image modal handlers
  const openImageModal = useCallback((imageUrl) => {
    setSelectedImage(imageUrl);
    setImageModalVisible(true);
  }, []);

  const closeImageModal = useCallback(() => {
    setImageModalVisible(false);
    setSelectedImage(null);
  }, []);

  // Comments modal handlers
  const openCommentsModal = useCallback((postId) => {
    setSelectedPostId(postId);
    setCommentsModalVisible(true);
  }, []);

  const closeCommentsModal = useCallback(() => {
    setCommentsModalVisible(false);
    setSelectedPostId(null);
    setNewComment("");
  }, [setNewComment]);

  // Load comments when modal opens
  useEffect(() => {
    if (commentsModalVisible && selectedPostId) {
      loadComments();
    }
  }, [commentsModalVisible, selectedPostId, loadComments]);

  // Handle openComments query parameter from notifications
  useEffect(() => {
    if (openComments) {
      // Open comments modal for the specified post
      setSelectedPostId(openComments);
      setCommentsModalVisible(true);
      // Clear the query parameter
      router.replace('/(vet)/home');
    }
  }, [openComments]);

  // Share handler
  const handleShare = useCallback(async (post) => {
    try {
      const message = post.analysis_result
        ? `Check out this post: ${post.analysis_result}`
        : "Check out this post!";

      await Share.share({
        message,
        url: post.image_url || "",
      });
    } catch (error) {
      if (error.message !== "User did not share") {
        Alert.alert("Error", "Failed to share post");
      }
    }
  }, []);

  // Render post item for FlatList
  const renderPost = useCallback(
    ({ item: post }) => (
      <PostCard
        key={post.id}
        post={post}
        isDark={isDark}
        currentUser={user}
        onToggleLike={toggleLike}
        onOpenComments={openCommentsModal}
        onShare={handleShare}
        onOpenImageModal={openImageModal}
        onViewProfile={(userId) =>
          router.push(`/(user)/vet-profile?vetId=${userId}`)
        }
      />
    ),
    [isDark, user, toggleLike, openCommentsModal, handleShare, openImageModal]
  );

  // List header element (memoized to prevent remounts while typing)
  const listHeader = useMemo(
    () => (
      <>
        <Header
          isDark={isDark}
          onSearch={handleSearch}
          isSearching={isSearching}
          searchQuery={searchQuery}
          onClearSearch={clearSearch}
          setIsSearching={setIsSearching}
          onNotificationPress={() => setNotificationsVisible(true)}
          onShowTutorial={() => startTutorial("homeFeed")}
        />

        {showWelcomePrompt && (
          <WelcomeTutorialPrompt
            tutorialType="vet"
            onDismiss={() => setShowWelcomePrompt(false)}
          />
        )}
      </>
    ),
    [
      isDark,
      handleSearch,
      isSearching,
      searchQuery,
      clearSearch,
      showWelcomePrompt,
      startTutorial,
    ]
  );

  // List empty component
  const ListEmptyComponent = useCallback(
    () => !loading && <EmptyState isDark={isDark} isEmpty={true} />,
    [loading, isDark]
  );

  // List footer component (loading more indicator)
  const ListFooterComponent = useCallback(() => {
    if (!loadingMore) return null;
    return (
      <View className="py-4">
        <ActivityIndicator size="small" color="#007AFF" />
      </View>
    );
  }, [loadingMore]);

  // Key extractor for FlatList
  const keyExtractor = useCallback((item) => item.id.toString(), []);

  // Handle load more (infinite scroll)
  const handleEndReached = useCallback(() => {
    if (hasMore && !loadingMore && !loading) {
      loadMore();
    }
  }, [hasMore, loadingMore, loading, loadMore]);

  // Loading state
  if (loading && posts.length === 0) {
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

      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={keyExtractor}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={ListEmptyComponent}
        ListFooterComponent={ListFooterComponent}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor="#007AFF"
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 8 }}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={10}
        windowSize={10}
      />

      <TutorialOverlay steps={vetTutorialSteps} tutorialId="vet" />
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
        currentUser={user}
        selectedPost={posts.find((p) => p.id === selectedPostId)}
        formatFullDateTime={formatFullDateTime}
        onViewProfile={(userId) =>
          router.push(`/(user)/vet-profile?vetId=${userId}`)
        }
      />

      <NotificationsModal
        visible={notificationsVisible}
        onClose={() => setNotificationsVisible(false)}
      />
    </SafeAreaView>
  );
};

export default VetNewsFeedScreen;
