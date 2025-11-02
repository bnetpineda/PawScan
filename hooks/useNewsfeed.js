/**
 * Custom hook for newsfeed functionality
 * Manages posts state, pagination, search, and interactions
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { Alert } from "react-native";
import { useAuth } from "../providers/AuthProvider";
import * as newsfeedService from "../services/newsfeedService";
import { createCacheWithTTL } from "../utils/performance";

const POSTS_PER_PAGE = 20;
const CACHE_TTL = 300000; // 5 minutes

// Create a singleton cache
const postsCache = createCacheWithTTL(CACHE_TTL);

export const useNewsfeed = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState(null);

  // Refs for cleanup
  const mountedRef = useRef(true);
  const loadingRef = useRef(false);

  // Debounced search query
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  /**
   * Load posts with pagination support
   */
  const loadPosts = useCallback(
    async (pageNum = 0, isRefresh = false) => {
      if (loadingRef.current && !isRefresh) return;
      if (!hasMore && pageNum > 0 && !isRefresh) return;

      loadingRef.current = true;

      try {
        // Set appropriate loading state
        if (isRefresh) {
          setRefreshing(true);
        } else if (pageNum === 0) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        setError(null);

        // Check cache for first page without search
        const cacheKey = `posts_${debouncedQuery}_${pageNum}`;
        if (!isRefresh && !debouncedQuery && pageNum === 0) {
          const cachedData = postsCache.get(cacheKey);
          if (cachedData && mountedRef.current) {
            setPosts(cachedData.posts);
            setHasMore(cachedData.hasMore);
            setLoading(false);
            loadingRef.current = false;
            return;
          }
        }

        // Fetch posts
        const result = await newsfeedService.fetchPosts({
          page: pageNum,
          limit: POSTS_PER_PAGE,
          userId: user?.id,
          searchQuery: debouncedQuery,
        });

        if (!mountedRef.current) return;

        // Update state based on page
        if (pageNum === 0 || isRefresh) {
          setPosts(result.posts);
          setPage(0);
        } else {
          setPosts((prev) => [...prev, ...result.posts]);
        }

        setHasMore(result.hasMore);

        // Cache first page results
        if (pageNum === 0 && !debouncedQuery) {
          postsCache.set(cacheKey, result);
        }
      } catch (err) {
        console.error("Error loading posts:", err);
        if (mountedRef.current) {
          setError(err.message || "Failed to load posts");
          Alert.alert("Error", "Failed to load posts. Please try again.");
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
          setRefreshing(false);
          setLoadingMore(false);
          loadingRef.current = false;
        }
      }
    },
    [user?.id, debouncedQuery, hasMore]
  );

  /**
   * Load initial posts
   */
  useEffect(() => {
    if (user?.id) {
      loadPosts(0);
    }
  }, [user?.id, debouncedQuery]);

  /**
   * Refresh posts
   */
  const refresh = useCallback(() => {
    postsCache.clear();
    setHasMore(true);
    loadPosts(0, true);
  }, [loadPosts]);

  /**
   * Load more posts (pagination)
   */
  const loadMore = useCallback(() => {
    if (!loadingRef.current && hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadPosts(nextPage);
    }
  }, [hasMore, loading, page, loadPosts]);

  /**
   * Toggle like on a post
   */
  const toggleLike = useCallback(
    async (postId) => {
      if (!user?.id) return;

      // Optimistic update
      const post = posts.find((p) => p.id === postId);
      if (!post) return;

      const currentlyLiked = post.has_liked;
      const newLikeState = !currentlyLiked;
      const likeDelta = newLikeState ? 1 : -1;

      // Update UI immediately
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                has_liked: newLikeState,
                likes_count: p.likes_count + likeDelta,
              }
            : p
        )
      );

      try {
        await newsfeedService.togglePostLike(postId, user.id, currentlyLiked);
      } catch (err) {
        // Revert on error
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  has_liked: currentlyLiked,
                  likes_count: p.likes_count - likeDelta,
                }
              : p
          )
        );
        Alert.alert("Error", "Failed to update like. Please try again.");
      }
    },
    [posts, user?.id]
  );

  /**
   * Update comment count for a post
   */
  const updateCommentCount = useCallback((postId, delta) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, comments_count: Math.max(0, p.comments_count + delta) }
          : p
      )
    );
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    posts,
    loading,
    refreshing,
    loadingMore,
    hasMore,
    error,
    searchQuery,
    setSearchQuery,
    refresh,
    loadMore,
    toggleLike,
    updateCommentCount,
  };
};

export default useNewsfeed;
