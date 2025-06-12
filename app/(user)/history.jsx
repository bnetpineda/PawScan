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
  Modal,
  StatusBar,
  useColorScheme,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";

const AnalysisHistoryScreen = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Color themes
  const colors = {
    background: isDark ? "bg-black" : "bg-white",
    card: isDark ? "bg-gray-800" : "bg-white",
    border: isDark ? "border-gray-700" : "border-gray-200",
    text: isDark ? "text-white" : "text-black",
    textSecondary: isDark ? "text-gray-400" : "text-gray-500",
    primary: "text-blue-600",
    danger: "text-red-600",
    badgeHigh: "bg-red-600",
    badgeMedium: "bg-orange-400",
    badgeLow: "bg-green-600",
    modalBg: isDark ? "bg-black/80" : "bg-black/50",
  };

  useEffect(() => {
    fetchAnalyses();
  }, []);

  const fetchAnalyses = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("analysis_history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAnalyses(data || []);
    } catch (error) {
      console.error("Error fetching analyses:", error);
      Alert.alert("Error", "Failed to load analysis history");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAnalyses();
    setRefreshing(false);
  }, []);

  const handleDelete = async (analysisId) => {
    Alert.alert(
      "Delete Analysis",
      "Are you sure you want to delete this analysis? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from("analysis_history")
                .delete()
                .eq("id", analysisId);

              if (error) throw error;

              setAnalyses((prev) =>
                prev.filter((analysis) => analysis.id !== analysisId)
              );
              Alert.alert("Success", "Analysis deleted successfully");
            } catch (error) {
              console.error("Error deleting analysis:", error);
              Alert.alert("Error", "Failed to delete analysis");
            }
          },
        },
      ]
    );
  };

  const handleShare = async (analysis) => {
    try {
      await Share.share({
        message: `Check out my pet's health analysis!\n\n${analysis.analysis_result.substring(
          0,
          200
        )}...`,
        title: "Pet Health Analysis",
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const openAnalysisModal = (analysis) => {
    setSelectedAnalysis(analysis);
    setModalVisible(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getUrgencyColor = (analysisText) => {
    const lowerText = analysisText.toLowerCase();
    if (lowerText.includes("emergency") || lowerText.includes("urgent")) {
      return colors.badgeHigh;
    } else if (lowerText.includes("medium") || lowerText.includes("moderate")) {
      return colors.badgeMedium;
    }
    return colors.badgeLow;
  };

  const getUrgencyLevel = (analysisText) => {
    const lowerText = analysisText.toLowerCase();
    if (lowerText.includes("emergency") || lowerText.includes("urgent")) {
      return "High Priority";
    } else if (lowerText.includes("medium") || lowerText.includes("moderate")) {
      return "Medium Priority";
    }
    return "Low Priority";
  };

  const renderAnalysisCard = (analysis) => {
    const urgencyColor = getUrgencyColor(analysis.analysis_result);
    const urgencyLevel = getUrgencyLevel(analysis.analysis_result);

    return (
      <TouchableOpacity
        key={analysis.id}
        className={`rounded-2xl border mb-4 overflow-hidden shadow-md ${colors.card} ${colors.border}`}
        onPress={() => openAnalysisModal(analysis)}
        activeOpacity={0.7}
      >
        {/* Header */}
        <View className="flex-row justify-between items-center px-4 pt-4 pb-3">
          <View className="flex-row items-center">
            <FontAwesome
              name="calendar"
              size={14}
              color={isDark ? "#8E8E93" : "#6C757D"}
            />
            <Text className={`ml-2 text-xs font-inter ${colors.textSecondary}`}>
              {formatDate(analysis.created_at)}
            </Text>
          </View>
          <View className="flex-row space-x-3">
            <TouchableOpacity
              onPress={() => handleShare(analysis)}
              className="p-2"
            >
              <FontAwesome
                name="share"
                size={16}
                color={isDark ? "#8E8E93" : "#6C757D"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDelete(analysis.id)}
              className="p-2"
            >
              <FontAwesome name="trash" size={16} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Image and Content */}
        <View className="flex-row px-4 pb-4">
          <Image
            source={{ uri: analysis.image_url }}
            className="w-20 h-20 rounded-xl mr-4"
            resizeMode="cover"
          />
          <View className="flex-1">
            <View
              className={`self-start px-2 py-1 rounded-xl mb-2 ${urgencyColor}`}
            >
              <Text className="text-xs font-inter-semibold text-white">
                {urgencyLevel}
              </Text>
            </View>
            <Text
              className={`text-sm font-inter ${colors.text}`}
              numberOfLines={3}
            >
              {analysis.analysis_result}
            </Text>
            <TouchableOpacity>
              <Text className="text-sm font-inter-semibold text-blue-600 dark:text-blue-400">
                View Full Analysis →
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const AnalysisModal = () => (
    <Modal
      visible={modalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setModalVisible(false)}
    >
      <View
        className={`flex-1 justify-center items-center px-4 ${colors.modalBg}`}
      >
        <View
          className={`w-full max-h-[90%] rounded-2xl overflow-hidden ${colors.card}`}
        >
          {/* Modal Header */}
          <View className="flex-row justify-between items-center px-5 py-4 border-b border-gray-200 dark:border-gray-700">
            <Text className="text-lg font-inter-bold text-black dark:text-white">
              Analysis Details
            </Text>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              className="p-2"
            >
              <FontAwesome
                name="times"
                size={20}
                color={isDark ? "#8E8E93" : "#6C757D"}
              />
            </TouchableOpacity>
          </View>
          {selectedAnalysis && (
            <ScrollView>
              <Image
                source={{ uri: selectedAnalysis.image_url }}
                className="w-full h-64"
                resizeMode="cover"
              />
              <View className="flex-row justify-between items-center px-5 py-4">
                <Text className="text-xs font-inter text-gray-500 dark:text-gray-400">
                  {formatDate(selectedAnalysis.created_at)}
                </Text>
                <View
                  className={`self-start px-2 py-1 rounded-xl ${getUrgencyColor(
                    selectedAnalysis.analysis_result
                  )}`}
                >
                  <Text className="text-xs font-inter-semibold text-white">
                    {getUrgencyLevel(selectedAnalysis.analysis_result)}
                  </Text>
                </View>
              </View>
              <View className="px-5 pb-4">
                <Text className="text-base font-inter text-black dark:text-white mb-4">
                  {selectedAnalysis.analysis_result}
                </Text>
                <View className="flex-row space-x-3">
                  <TouchableOpacity
                    className="flex-row items-center px-4 py-2 rounded-lg bg-blue-600"
                    onPress={() => {
                      handleShare(selectedAnalysis);
                      setModalVisible(false);
                    }}
                  >
                    <FontAwesome name="share" size={16} color="#fff" />
                    <Text className="ml-2 text-white font-inter-semibold">
                      Share
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-row items-center px-4 py-2 rounded-lg bg-red-600"
                    onPress={() => {
                      setModalVisible(false);
                      handleDelete(selectedAnalysis.id);
                    }}
                  >
                    <FontAwesome name="trash" size={16} color="#fff" />
                    <Text className="ml-2 text-white font-inter-semibold">
                      Delete
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View
        className={`flex-1 justify-center items-center ${colors.background}`}
      >
        <ActivityIndicator size="large" color="#007AFF" />
        <Text className="mt-4 text-base font-inter text-gray-500 dark:text-gray-400">
          Loading your analyses...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${colors.background}`}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={isDark ? "#000" : "#fff"}
      />

      {/* Header */}
      <View className="flex-row justify-between items-center px-5 py-4 border-b border-gray-200 dark:border-gray-700">
        <Text className="text-2xl font-inter-bold text-black dark:text-white">
          Analysis History
        </Text>
        <View>
          <Text className="text-sm font-inter text-gray-500 dark:text-gray-400">
            {analyses.length} analyses
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#007AFF"
          />
        }
      >
        {analyses.length === 0 ? (
          <View className="flex-1 justify-center items-center py-24">
            <FontAwesome
              name="history"
              size={48}
              color={isDark ? "#8E8E93" : "#6C757D"}
            />
            <Text className="mt-4 text-xl font-inter-bold text-black dark:text-white">
              No analyses yet
            </Text>
            <Text className="mt-2 text-base font-inter text-gray-500 dark:text-gray-400 text-center">
              Start by taking a photo of your pet to create your first health
              analysis!
            </Text>
          </View>
        ) : (
          <View className="p-4">{analyses.map(renderAnalysisCard)}</View>
        )}
      </ScrollView>

      <AnalysisModal />
    </SafeAreaView>
  );
};

export default AnalysisHistoryScreen;
