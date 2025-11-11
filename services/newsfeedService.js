/**
 * Newsfeed Service
 * Handles all newsfeed-related data operations with optimized queries
 */

import { supabase } from "../lib/supabase";

/**
 * Batch fetch post engagement data (likes, comments, user interactions)
 * Optimized to reduce database queries
 */
const fetchPostEngagementBatch = async (postIds, userId) => {
  if (!postIds.length) return {};

  try {
    // Single query for all likes data
    const { data: likesData } = await supabase
      .from("newsfeed_likes")
      .select("post_id, user_id")
      .in("post_id", postIds);

    // Single query for all comments data
    const { data: commentsData } = await supabase
      .from("newsfeed_comments")
      .select("post_id")
      .in("post_id", postIds);

    // Build engagement map
    const engagementMap = {};
    postIds.forEach((id) => {
      const postLikes = likesData?.filter((l) => l.post_id === id) || [];
      const postComments = commentsData?.filter((c) => c.post_id === id) || [];

      engagementMap[id] = {
        likes_count: postLikes.length,
        comments_count: postComments.length,
        has_liked: postLikes.some((l) => l.user_id === userId),
      };
    });

    return engagementMap;
  } catch (error) {
    console.error("Error fetching engagement data:", error);
    return {};
  }
};

/**
 * Fetch posts with pagination and engagement data
 */
export const fetchPosts = async ({
  page = 0,
  limit = 20,
  userId,
  searchQuery = "",
}) => {
  try {
    const offset = page * limit;

    // Build query
    let query = supabase
      .from("newsfeed_posts")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Add search filter if provided (server-side search)
    if (searchQuery.trim()) {
      query = query.or(
        `analysis_result.ilike.%${searchQuery}%,pet_name.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`
      );
    }

    const { data: postsData, error: postsError } = await query;

    if (postsError) throw postsError;

    if (!postsData || postsData.length === 0) {
      return { posts: [], hasMore: false };
    }

    // Batch fetch engagement data
    const postIds = postsData.map((p) => p.id);
    const engagementMap = await fetchPostEngagementBatch(postIds, userId);

    // Merge engagement data with posts
    const enrichedPosts = postsData.map((post) => ({
      ...post,
      ...(engagementMap[post.id] || {
        likes_count: 0,
        comments_count: 0,
        has_liked: false,
      }),
    }));

    // Check if there are more posts
    let countQuery = supabase
      .from("newsfeed_posts")
      .select("*", { count: "exact", head: true });

    if (searchQuery.trim()) {
      countQuery = countQuery.or(
        `analysis_result.ilike.%${searchQuery}%,pet_name.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`
      );
    }
    
    const { count } = await countQuery;

    const hasMore = offset + limit < (count || 0);

    return { posts: enrichedPosts, hasMore };
  } catch (error) {
    console.error("Error fetching posts:", error);
    throw error;
  }
};

/**
 * Toggle like on a post
 */
export const togglePostLike = async (postId, userId, currentlyLiked) => {
  try {
    if (currentlyLiked) {
      // Unlike
      const { error } = await supabase
        .from("newsfeed_likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", userId);

      if (error) throw error;
      return { liked: false };
    } else {
      // Like
      const { error } = await supabase.from("newsfeed_likes").insert({
        post_id: postId,
        user_id: userId,
      });

      if (error) throw error;
      return { liked: true };
    }
  } catch (error) {
    console.error("Error toggling like:", error);
    throw error;
  }
};

/**
 * Fetch comments for a post with user details
 */
export const fetchComments = async (postId) => {
  try {
    const { data, error } = await supabase
      .from("newsfeed_comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    // Enrich comments with user information
    if (data && data.length > 0) {
      const enrichedComments = await Promise.all(
        data.map(async (comment) => {
          try {
            // Try to get user info from vet_profiles first
            const { data: vetProfile } = await supabase
              .from("vet_profiles")
              .select("name")
              .eq("id", comment.user_id)
              .single();

            if (vetProfile) {
              return {
                ...comment,
                display_name: vetProfile.name,
                role: "veterinarian",
              };
            }

            // If not a vet, try user_profiles
            const { data: userProfile } = await supabase
              .from("user_profiles")
              .select("name")
              .eq("id", comment.user_id)
              .single();

            if (userProfile) {
              return {
                ...comment,
                display_name: userProfile.name,
                role: "user",
              };
            }

            // Fallback if no profile found
            return {
              ...comment,
              display_name: null,
              role: "user",
            };
          } catch (err) {
            console.error("Error fetching user info for comment:", err);
            return {
              ...comment,
              display_name: null,
              role: "user",
            };
          }
        })
      );

      return enrichedComments;
    }

    return data || [];
  } catch (error) {
    console.error("Error fetching comments:", error);
    throw error;
  }
};

/**
 * Post a new comment with user details
 */
export const postComment = async (postId, userId, userEmail, commentText) => {
  try {
    const { data, error } = await supabase
      .from("newsfeed_comments")
      .insert({
        post_id: postId,
        user_id: userId,
        comment_text: commentText.trim(),
      })
      .select()
      .single();

    if (error) throw error;

    // Enrich the comment with user information
    try {
      // Try to get user info from vet_profiles first
      const { data: vetProfile } = await supabase
        .from("vet_profiles")
        .select("name")
        .eq("id", userId)
        .single();

      if (vetProfile) {
        return {
          ...data,
          display_name: vetProfile.name,
          role: "veterinarian",
        };
      }

      // If not a vet, try user_profiles
      const { data: userProfile } = await supabase
        .from("user_profiles")
        .select("name")
        .eq("id", userId)
        .single();

      if (userProfile) {
        return {
          ...data,
          display_name: userProfile.name,
          role: "user",
        };
      }

      // Fallback if no profile found
      return {
        ...data,
        display_name: null,
        role: "user",
      };
    } catch (err) {
      console.error("Error fetching user info for new comment:", err);
      return {
        ...data,
        display_name: null,
        role: "user",
      };
    }
  } catch (error) {
    console.error("Error posting comment:", error);
    throw error;
  }
};

/**
 * Delete a comment
 */
export const deleteComment = async (commentId, userId) => {
  try {
    const { error } = await supabase
      .from("newsfeed_comments")
      .delete()
      .eq("id", commentId)
      .eq("user_id", userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error deleting comment:", error);
    throw error;
  }
};

export default {
  fetchPosts,
  togglePostLike,
  fetchComments,
  postComment,
  deleteComment,
};
