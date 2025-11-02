/**
 * Custom hook for managing comments on posts
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { Alert } from "react-native";
import { useAuth } from "../providers/AuthProvider";
import * as newsfeedService from "../services/newsfeedService";

export const useComments = (postId, onCommentCountChange) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [newComment, setNewComment] = useState("");
  const mountedRef = useRef(true);

  /**
   * Load comments for the post
   */
  const loadComments = useCallback(async () => {
    if (!postId || !mountedRef.current) return;

    setLoading(true);
    try {
      const data = await newsfeedService.fetchComments(postId);
      if (mountedRef.current) {
        setComments(data);
      }
    } catch (err) {
      console.error("Error loading comments:", err);
      if (mountedRef.current) {
        Alert.alert("Error", "Failed to load comments. Please try again.");
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [postId]);

  /**
   * Post a new comment
   */
  const postNewComment = useCallback(async () => {
    if (!newComment.trim() || !user?.id || !postId) return;

    setPosting(true);
    try {
      const comment = await newsfeedService.postComment(
        postId,
        user.id,
        user.email || "Anonymous",
        newComment
      );

      if (mountedRef.current) {
        setComments((prev) => [...prev, comment]);
        setNewComment("");
        
        // Update comment count in parent
        if (onCommentCountChange) {
          onCommentCountChange(postId, 1);
        }
      }
    } catch (err) {
      console.error("Error posting comment:", err);
      if (mountedRef.current) {
        Alert.alert("Error", "Failed to post comment. Please try again.");
      }
    } finally {
      if (mountedRef.current) {
        setPosting(false);
      }
    }
  }, [newComment, user, postId, onCommentCountChange]);

  /**
   * Delete a comment
   */
  const deleteCommentById = useCallback(
    async (commentId) => {
      if (!user?.id) return;

      try {
        await newsfeedService.deleteComment(commentId, user.id);

        if (mountedRef.current) {
          setComments((prev) => prev.filter((c) => c.id !== commentId));
          
          // Update comment count in parent
          if (onCommentCountChange) {
            onCommentCountChange(postId, -1);
          }
        }
      } catch (err) {
        console.error("Error deleting comment:", err);
        Alert.alert("Error", "Failed to delete comment. Please try again.");
      }
    },
    [user?.id, postId, onCommentCountChange]
  );

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    comments,
    loading,
    posting,
    newComment,
    setNewComment,
    loadComments,
    postComment: postNewComment,
    deleteComment: deleteCommentById,
  };
};

export default useComments;
