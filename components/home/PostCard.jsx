import { useState, useEffect } from "react";
import { View, Text, Image, TouchableOpacity, Alert } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";
import { submitPostReport } from "../../services/reportService";

const PostCard = ({ post, isDark, currentUser, onToggleLike, onOpenComments, onShare, onOpenImageModal }) => {
  const isAnonymous = post.is_anonymous;
  const userDisplayName = isAnonymous
    ? "Anonymous User"
    : post.display_name || "Pet Owner";

  // Track expanded state per post
  const [expanded, setExpanded] = useState(false);
  // Track dropdown visibility
  const [showDropdown, setShowDropdown] = useState(false);
  // Track user avatar URL
  const [userAvatarUrl, setUserAvatarUrl] = useState(null);

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

  // Check if current user is the post owner
  const isPostOwner = currentUser && post.user_id === currentUser.id;

  // Handle delete post
  const handleDeletePost = () => {
    Alert.alert(
      "Delete Post",
      "Are you sure you want to delete this post? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // Delete associated likes
              await supabase
                .from("newsfeed_likes")
                .delete()
                .eq("post_id", post.id);

              // Delete associated comments
              await supabase
                .from("newsfeed_comments")
                .delete()
                .eq("post_id", post.id);

              // Delete the post
              const { error } = await supabase
                .from("newsfeed_posts")
                .delete()
                .eq("id", post.id);

              if (error) {
                throw error;
              }

              // Refresh the feed (this would need to be handled by the parent component)
              Alert.alert("Success", "Post deleted successfully");
            } catch (error) {
              console.error("Error deleting post:", error);
              Alert.alert("Error", "Failed to delete post. Please try again.");
            }
          }
        }
      ]
    );
  };

  // Handle report post
  const handleReportPost = () => {
    if (!currentUser) {
      Alert.alert("Error", "You must be logged in to report a post");
      return;
    }

    // Define report reasons
    const reportReasons = [
      "Inappropriate content",
      "Spam",
      "Harassment",
      "False information",
      "Other"
    ];

    // Create alert with report options
    const alertButtons = reportReasons.map(reason => ({
      text: reason,
      onPress: () => {
        if (reason === "Other") {
          // For "Other" reason, show a text input for description
          Alert.prompt(
            "Report Post",
            "Please provide additional details about why you're reporting this post:",
            [
              {
                text: "Cancel",
                style: "cancel"
              },
              {
                text: "Report",
                onPress: async (description) => {
                  const result = await submitPostReport(
                    post.id,
                    currentUser.id,
                    reason,
                    description || ""
                  );
                  
                  if (result.success) {
                    Alert.alert(
                      "Post Reported",
                      "Thank you for reporting this post. Our team will review it."
                    );
                  } else {
                    Alert.alert("Error", result.error || "Failed to submit report");
                  }
                }
              }
            ],
            "plain-text"
          );
        } else {
          // For other reasons, show a text input for description as well
          Alert.prompt(
            "Report Post",
            `Please explain why you're reporting this post for "${reason}":`,
            [
              {
                text: "Cancel",
                style: "cancel"
              },
              {
                text: "Report",
                onPress: async (description) => {
                  // Confirm before submitting
                  Alert.alert(
                    "Confirm Report",
                    `Are you sure you want to report this post for "${reason}"?\n\nDescription: ${description || "No description provided"}`,
                    [
                      {
                        text: "Cancel",
                        style: "cancel"
                      },
                      {
                        text: "Report",
                        onPress: async () => {
                          const result = await submitPostReport(
                            post.id,
                            currentUser.id,
                            reason,
                            description || ""
                          );
                          
                          if (result.success) {
                            Alert.alert(
                              "Post Reported",
                              "Thank you for reporting this post. Our team will review it."
                            );
                          } else {
                            Alert.alert("Error", result.error || "Failed to submit report");
                          }
                        }
                      }
                    ]
                  );
                }
              }
            ],
            "plain-text"
          );
        }
      }
    }));

    alertButtons.unshift({
      text: "Cancel",
      style: "cancel"
    });

    Alert.alert(
      "Report Post",
      "Why are you reporting this post?",
      alertButtons
    );
  };

  // Get urgency level for this post
  const urgencyInfo = getUrgencyLevel(post.analysis_result);

  // Fetch user avatar when component mounts
  useEffect(() => {
    const fetchUserAvatar = async () => {
      if (isAnonymous || !post.user_id) return;

      try {
        // Check if avatar exists in storage
        const { data: avatarData } = await supabase.storage
          .from('avatars')
          .list(`${post.user_id}/`, {
            limit: 1,
            offset: 0,
            sortBy: { column: 'name', order: 'asc' }
          });

        if (avatarData && avatarData.length > 0) {
          // Get public URL for the avatar
          const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(`${post.user_id}/avatar.jpg`);

          setUserAvatarUrl(publicUrl);
        }
      } catch (error) {
        console.error('Error fetching user avatar:', error);
      }
    };

    fetchUserAvatar();
  }, [post.user_id, isAnonymous]);

  return (
    <View
      key={post.id}
      className="mx-4 my-2 rounded-2xl border border-neutral-200 dark:border-neutral-900 bg-white dark:bg-neutral-900 shadow-sm"
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
          {/* Anonymous User Avatar */}
          {isAnonymous ? (
            <View className="w-10 h-10 rounded-full border-2 border-black dark:border-white justify-center items-center mr-3 bg-white dark:bg-black">
              <FontAwesome
                name="user"
                size={20}
                color={isDark ? "#ffffff" : "#000000"}
              />
            </View>
          ) : (
            /* Non-Anonymous User Avatar */
            userAvatarUrl ? (
              <Image
                source={{ uri: userAvatarUrl }}
                className="w-10 h-10 rounded-full mr-3"
                resizeMode="cover"
                onError={() => setUserAvatarUrl(null)} // Fallback to icon if image fails to load
              />
            ) : (
              <View className="w-10 h-10 rounded-full border-2 border-black dark:border-white justify-center items-center mr-3 bg-white dark:bg-black">
                <FontAwesome
                  name="user-circle"
                  size={32}
                  color={isDark ? "#ffffff" : "#000000"}
                />
              </View>
            )
          )}
          <View className="flex-1">
            <Text className="text-base font-inter-semibold text-black dark:text-white">
              {userDisplayName}
            </Text>
            {post.pet_name && (
              <Text className="text-sm font-inter text-neutral-500 dark:text-neutral-400">
                Pet: {post.pet_name}
              </Text>
            )}
            <Text className="text-xs font-inter text-neutral-400 dark:text-neutral-500">
              {formatFullDateTime(post.created_at)}
            </Text>
          </View>
        </View>
        <View className="relative">
          <TouchableOpacity 
            className="p-2"
            onPress={() => setShowDropdown(!showDropdown)}
          >
            <FontAwesome
              name="ellipsis-h"
              size={16}
              color={isDark ? "#8E8E93" : "#6C757D"}
            />
          </TouchableOpacity>
          
          {/* Simple Dropdown */}
          {showDropdown && (
            <View className="absolute right-0 top-8 bg-white dark:bg-neutral-800 rounded-lg shadow-lg w-40 z-10">
              <TouchableOpacity
                className="flex-row items-center p-3 border-b border-neutral-200 dark:border-neutral-700"
                onPress={() => {
                  handleReportPost();
                  setShowDropdown(false);
                }}
              >
                <FontAwesome
                  name="flag"
                  size={16}
                  color={isDark ? "#8E8E93" : "#6C757D"}
                />
                <Text className="ml-3 text-base font-inter text-black dark:text-white">
                  Report
                </Text>
              </TouchableOpacity>
              
              {isPostOwner && (
                <TouchableOpacity
                  className="flex-row items-center p-3"
                  onPress={() => {
                    handleDeletePost();
                    setShowDropdown(false);
                  }}
                >
                  <FontAwesome
                    name="trash"
                    size={16}
                    color="#EF4444"
                  />
                  <Text className="ml-3 text-base font-inter text-red-500">
                    Delete
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>

      {/* Image - Now clickable */}
      <TouchableOpacity
        onPress={() => onOpenImageModal(post.image_url)}
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
          onPress={() => onToggleLike(post.id, post.user_has_liked)}
          activeOpacity={0.7}
        >
          <FontAwesome
            name={post.user_has_liked ? "heart" : "heart-o"}
            size={20}
            color={
              post.user_has_liked ? "#FF3B30" : isDark ? "#8E8E93" : "#6C757D"
            }
          />
          <Text className="ml-2 text-sm font-inter text-neutral-600 dark:text-neutral-400">
            {post.likes_count || 0}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row items-center mr-6"
          onPress={() => onOpenComments(post.id)}
          activeOpacity={0.7}
        >
          <FontAwesome
            name="comment-o"
            size={20}
            color={isDark ? "#8E8E93" : "#6C757D"}
          />
          <Text className="ml-2 text-sm font-inter text-neutral-600 dark:text-neutral-400">
            {post.comments_count || 0}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row items-center mr-6"
          onPress={() => onShare(post)}
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
          className="text-sm text-neutral-600 font-inter dark:text-neutral-400 mb-2"
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
      
      {/* Touchable overlay to close dropdown when tapping elsewhere */}
      {showDropdown && (
        <TouchableOpacity
          className="absolute top-0 left-0 right-0 bottom-0"
          onPress={() => setShowDropdown(false)}
          activeOpacity={1}
        />
      )}
    </View>
  );
};

export default PostCard;