import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  RefreshControl,
  Alert,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
} from "react-native";
import { supabase } from "../../lib/supabase"; // Adjust path to your supabase config
import { SafeAreaView } from "react-native-safe-area-context";

const REACTION_EMOJIS = ["❤️", "👍", "😂", "😮", "😢", "😡"];

const PetNewsfeed = () => {
  const [analysisData, setAnalysisData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [comments, setComments] = useState({});
  const [reactions, setReactions] = useState({});
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [expandedComments, setExpandedComments] = useState({});
  const [showReactionPicker, setShowReactionPicker] = useState(null);
  const [currentUser] = useState("1b4cf268-51b6-4a48-9705-d41b10c7917f"); // Replace with actual user auth

  // Parse analysis result text into structured data
  const parseAnalysisResult = (analysisText) => {
    const lines = analysisText.split("\n").filter((line) => line.trim());
    const result = {};

    lines.forEach((line) => {
      if (line.includes("Breed of the pet:")) {
        result.breed = line.split(":")[1]?.trim();
      } else if (line.includes("Diseases detected")) {
        result.diseases = line.split(":")[1]?.trim();
      } else if (line.includes("Confidence score:")) {
        result.confidence = line.split(":")[1]?.trim();
      } else if (line.includes("Urgency level:")) {
        result.urgency = line.split(":")[1]?.trim();
      } else if (line.includes("Three suggested treatments:")) {
        result.treatments = line.split(":")[1]?.trim();
      }
    });

    return result;
  };

  // Fetch analysis history from Supabase
  const fetchAnalysisHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("analysis_history")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setAnalysisData(data || []);

      // Fetch comments and reactions for each post
      if (data && data.length > 0) {
        await fetchCommentsAndReactions(data.map((item) => item.id));
      }
    } catch (error) {
      console.error("Error fetching analysis history:", error);
      Alert.alert("Error", "Failed to load analysis history");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch comments and reactions for posts
  const fetchCommentsAndReactions = async (postIds) => {
    try {
      // Fetch comments
      const { data: commentsData, error: commentsError } = await supabase
        .from("post_comments")
        .select("*")
        .in("post_id", postIds)
        .order("created_at", { ascending: true });

      if (commentsError) throw commentsError;

      // Group comments by post_id
      const commentsByPost = {};
      commentsData?.forEach((comment) => {
        if (!commentsByPost[comment.post_id]) {
          commentsByPost[comment.post_id] = [];
        }
        commentsByPost[comment.post_id].push(comment);
      });
      setComments(commentsByPost);

      // Fetch reactions
      const { data: reactionsData, error: reactionsError } = await supabase
        .from("post_reactions")
        .select("*")
        .in("post_id", postIds);

      if (reactionsError) throw reactionsError;

      // Group reactions by post_id and emoji
      const reactionsByPost = {};
      reactionsData?.forEach((reaction) => {
        if (!reactionsByPost[reaction.post_id]) {
          reactionsByPost[reaction.post_id] = {};
        }
        if (!reactionsByPost[reaction.post_id][reaction.emoji]) {
          reactionsByPost[reaction.post_id][reaction.emoji] = [];
        }
        reactionsByPost[reaction.post_id][reaction.emoji].push(reaction);
      });
      setReactions(reactionsByPost);
    } catch (error) {
      console.error("Error fetching comments and reactions:", error);
    }
  };

  // Add a comment
  const addComment = async () => {
    if (!commentText.trim() || !selectedPostId) return;

    try {
      const { data, error } = await supabase
        .from("post_comments")
        .insert([
          {
            post_id: selectedPostId,
            user_id: currentUser,
            comment_text: commentText.trim(),
          },
        ])
        .select();

      if (error) throw error;

      // Update local state
      setComments((prev) => ({
        ...prev,
        [selectedPostId]: [...(prev[selectedPostId] || []), data[0]],
      }));

      setCommentText("");
      setShowCommentModal(false);
    } catch (error) {
      console.error("Error adding comment:", error);
      Alert.alert("Error", "Failed to add comment");
    }
  };

  // Add or remove reaction (only 1 reaction per user per post)
  const toggleReaction = async (postId, emoji) => {
    try {
      // Find any existing reaction by this user on this post
      let existingUserReaction = null;
      let existingEmoji = null;

      if (reactions[postId]) {
        for (const [emojiKey, reactionList] of Object.entries(
          reactions[postId]
        )) {
          const userReaction = reactionList.find(
            (r) => r.user_id === currentUser
          );
          if (userReaction) {
            existingUserReaction = userReaction;
            existingEmoji = emojiKey;
            break;
          }
        }
      }

      // If clicking the same emoji they already reacted with, remove it
      if (existingUserReaction && existingEmoji === emoji) {
        const { error } = await supabase
          .from("post_reactions")
          .delete()
          .eq("id", existingUserReaction.id);

        if (error) throw error;

        // Update local state - remove reaction
        setReactions((prev) => {
          const newReactions = { ...prev };
          if (newReactions[postId] && newReactions[postId][emoji]) {
            newReactions[postId][emoji] = newReactions[postId][emoji].filter(
              (r) => r.id !== existingUserReaction.id
            );
            if (newReactions[postId][emoji].length === 0) {
              delete newReactions[postId][emoji];
            }
          }
          return newReactions;
        });
      } else {
        // Replace existing reaction or add new one
        if (existingUserReaction) {
          // Update existing reaction to new emoji
          const { data, error } = await supabase
            .from("post_reactions")
            .update({ emoji: emoji })
            .eq("id", existingUserReaction.id)
            .select();

          if (error) throw error;

          // Create updated reaction object with all necessary fields
          const updatedReaction = {
            ...existingUserReaction,
            emoji: emoji,
            ...(data && data[0] ? data[0] : {}),
          };

          // Update local state - move reaction from old emoji to new emoji
          setReactions((prev) => {
            const newReactions = { ...prev };

            // Remove from old emoji
            if (newReactions[postId] && newReactions[postId][existingEmoji]) {
              newReactions[postId][existingEmoji] = newReactions[postId][
                existingEmoji
              ].filter((r) => r.id !== existingUserReaction.id);
              if (newReactions[postId][existingEmoji].length === 0) {
                delete newReactions[postId][existingEmoji];
              }
            }

            // Add to new emoji
            if (!newReactions[postId]) newReactions[postId] = {};
            if (!newReactions[postId][emoji]) newReactions[postId][emoji] = [];
            newReactions[postId][emoji].push(updatedReaction);

            return newReactions;
          });
        } else {
          // Add new reaction
          const { data, error } = await supabase
            .from("post_reactions")
            .insert([
              {
                post_id: postId,
                user_id: currentUser,
                emoji: emoji,
              },
            ])
            .select();

          if (error) throw error;

          // Update local state - add new reaction
          setReactions((prev) => {
            const newReactions = { ...prev };
            if (!newReactions[postId]) newReactions[postId] = {};
            if (!newReactions[postId][emoji]) newReactions[postId][emoji] = [];
            newReactions[postId][emoji].push(data[0]);
            return newReactions;
          });
        }
      }
    } catch (error) {
      console.error("Error toggling reaction:", error);
      Alert.alert("Error", "Failed to update reaction");
    }
    setShowReactionPicker(null);
  };

  useEffect(() => {
    fetchAnalysisHistory();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAnalysisHistory();
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency?.toLowerCase()) {
      case "high":
        return "#FF4444";
      case "medium":
        return "#FFA500";
      case "low":
        return "#4CAF50";
      default:
        return "#757575";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderComments = (postId) => {
    const postComments = comments[postId] || [];
    const isExpanded = expandedComments[postId];
    const displayComments = isExpanded
      ? postComments
      : postComments.slice(0, 2);

    return (
      <View className="px-4 pb-4">
        {displayComments.map((comment) => (
          <View
            key={comment.id}
            className="bg-gray-100 dark:bg-neutral-800 p-3 rounded-lg mb-2"
          >
            <Text className="text-base text-black dark:text-white mb-1">
              {comment.comment_text}
            </Text>
            <Text className="text-xs text-gray-500 dark:text-gray-400">
              {formatDate(comment.created_at)}
            </Text>
          </View>
        ))}
        {postComments.length > 2 && (
          <TouchableOpacity
            onPress={() =>
              setExpandedComments((prev) => ({
                ...prev,
                [postId]: !prev[postId],
              }))
            }
            className="items-center py-2"
          >
            <Text className="text-green-600 font-medium">
              {isExpanded
                ? "Show Less"
                : `View ${postComments.length - 2} more comments`}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderReactions = (postId) => {
    const postReactions = reactions[postId] || {};
    const hasReactions = Object.keys(postReactions).length > 0;

    return (
      <View className="px-4 pb-2">
        {hasReactions && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="flex-row"
          >
            {Object.entries(postReactions).map(([emoji, reactionList]) => (
              <TouchableOpacity
                key={emoji}
                className={`flex-row items-center bg-gray-100 px-2 py-1 rounded-2xl mr-2 ${
                  reactionList.some((r) => r.user_id === currentUser)
                    ? "bg-blue-100"
                    : ""
                }`}
                onPress={() => toggleReaction(postId, emoji)}
              >
                <Text className="text-lg mr-1">{emoji}</Text>
                <Text className="text-xs text-gray-600 font-medium">
                  {reactionList.length}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    );
  };

  const renderReactionPicker = (postId) => {
    if (showReactionPicker !== postId) return null;

    return (
      <View className="px-4 pb-2">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {REACTION_EMOJIS.map((emoji) => (
            <TouchableOpacity
              key={emoji}
              className="px-3 py-2 mr-2 bg-gray-100 rounded-full"
              onPress={() => toggleReaction(postId, emoji)}
            >
              <Text className="text-2xl">{emoji}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderAnalysisItem = ({ item }) => {
    const parsedResult = parseAnalysisResult(item.analysis_result);
    const postComments = comments[item.id] || [];

    return (
      <View className="bg-white rounded-xl mb-4 shadow dark:bg-neutral-900">
        <View className="flex-row justify-between items-center px-4 pt-4 pb-2">
          <Text className="text-sm text-gray-500 font-medium">
            {formatDate(item.created_at)}
          </Text>
          {parsedResult.urgency && (
            <View
              className={`px-2 py-1 rounded-xl ${
                parsedResult.urgency.toLowerCase() === "high"
                  ? "bg-red-500"
                  : parsedResult.urgency.toLowerCase() === "medium"
                  ? "bg-yellow-500"
                  : parsedResult.urgency.toLowerCase() === "low"
                  ? "bg-green-600"
                  : "bg-gray-400"
              }`}
            >
              <Text className="text-white text-xs font-bold uppercase">
                {parsedResult.urgency}
              </Text>
            </View>
          )}
        </View>

        <Image
          source={{ uri: item.image_url }}
          className="w-full h-52 rounded-b-none rounded-t-xl"
          resizeMode="cover"
        />

        <View className="px-4 py-4">
          {parsedResult.breed && (
            <View className="flex-row mb-2">
              <Text className="font-semibold text-gray-800 dark:text-white w-20">
                Breed:
              </Text>
              <Text className="text-gray-700 dark:text-gray-200 flex-1">
                {parsedResult.breed}
              </Text>
            </View>
          )}
          {parsedResult.diseases && (
            <View className="flex-row mb-2">
              <Text className="font-semibold text-gray-800 dark:text-white w-20">
                Condition:
              </Text>
              <Text className="text-gray-700 dark:text-gray-200 flex-1">
                {parsedResult.diseases}
              </Text>
            </View>
          )}
          {parsedResult.confidence && (
            <View className="flex-row mb-2">
              <Text className="font-semibold text-gray-800 dark:text-white w-20">
                Confidence:
              </Text>
              <Text className="text-green-600 font-semibold flex-1">
                {parsedResult.confidence}
              </Text>
            </View>
          )}
          {parsedResult.treatments && (
            <View className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <Text className="font-semibold text-gray-800 dark:text-white">
                Suggested Treatments:
              </Text>
              <Text className="text-gray-700 dark:text-gray-200 mt-1 leading-5">
                {parsedResult.treatments}
              </Text>
            </View>
          )}
        </View>

        {/* Reactions */}
        {renderReactions(item.id)}
        {renderReactionPicker(item.id)}

        {/* Action Buttons */}
        <View className="flex-row px-4 py-2 border-t border-gray-200 dark:border-gray-700">
          <TouchableOpacity
            className="flex-1 items-center py-2"
            onPress={() =>
              setShowReactionPicker(
                showReactionPicker === item.id ? null : item.id
              )
            }
          >
            <Text className="text-gray-600 font-medium">😊 React</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 items-center py-2"
            onPress={() => {
              setSelectedPostId(item.id);
              setShowCommentModal(true);
            }}
          >
            <Text className="text-gray-600 font-medium">
              💬 Comment ({postComments.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Comments */}
        {renderComments(item.id)}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View className="items-center justify-center py-16">
      <Text className="text-lg text-gray-600 font-medium mb-2">
        No pet analysis records found
      </Text>
      <Text className="text-base text-gray-400">Pull down to refresh</Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-100 dark:bg-black">
      <View className="bg-white dark:bg-neutral-900 px-5 py-4 border-b border-gray-200 dark:border-gray-800">
        <Text className="text-2xl font-bold text-gray-900 dark:text-white">
          Pet Analysis History
        </Text>
      </View>

      <FlatList
        data={analysisData}
        renderItem={renderAnalysisItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#4CAF50"]}
          />
        }
        ListEmptyComponent={!loading ? renderEmptyState : null}
        contentContainerStyle={
          analysisData.length === 0
            ? { flex: 1, justifyContent: "center", alignItems: "center" }
            : { padding: 16 }
        }
      />

      {/* Comment Modal */}
      <Modal
        visible={showCommentModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCommentModal(false)}
      >
        <View className="flex-1 bg-white dark:bg-black">
          <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <TouchableOpacity onPress={() => setShowCommentModal(false)}>
              <Text className="text-base text-gray-600">Cancel</Text>
            </TouchableOpacity>
            <Text className="text-lg font-semibold text-gray-900 dark:text-white">
              Add Comment
            </Text>
            <TouchableOpacity onPress={addComment}>
              <Text className="text-base text-green-600 font-semibold">
                Post
              </Text>
            </TouchableOpacity>
          </View>
          <View className="flex-1 p-4">
            <TextInput
              className="flex-1 text-base text-gray-900 dark:text-white"
              placeholder="Write a comment..."
              value={commentText}
              onChangeText={setCommentText}
              multiline
              textAlignVertical="top"
              autoFocus
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default PetNewsfeed;
