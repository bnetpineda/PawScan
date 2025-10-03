import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Alert,
  StatusBar,
  useColorScheme,
  Share,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";
import AnalysisCard from "../../components/history/AnalysisCard";
import AnalysisModal from "../../components/history/AnalysisModal";
import EmptyState from "../../components/history/EmptyState";
import LoadingState from "../../components/history/LoadingState";
import { useTutorial } from "../../providers/TutorialProvider";
import TutorialOverlay from "../../components/tutorial/TutorialOverlay";
import { historyTutorialSteps } from "../../components/tutorial/tutorialSteps";

const AnalysisHistoryScreen = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { startTutorial, isTutorialCompleted } = useTutorial();

  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Color themes for urgency badges
  const colors = {
    badgeHigh: "bg-red-600",
    badgeMedium: "bg-orange-400",
    badgeLow: "bg-green-600",
  };

  useEffect(() => {
    fetchAnalyses();
    // Show tutorial on first visit
    if (!isTutorialCompleted('history')) {
      const timer = setTimeout(() => {
        startTutorial('history');
      }, 1000);
      return () => clearTimeout(timer);
    }
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
        message: `Check out my pet's health analysis!

${analysis.analysis_result.substring(
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

  if (loading) {
    return <LoadingState isDark={isDark} />;
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black">
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={isDark ? "#000" : "#fff"}
      />

      {/* Header */}
      <View className="flex-row justify-between items-center px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
        <View>
          <Text className="text-2xl font-inter-bold text-black dark:text-white">
            Analysis History
          </Text>
          <Text className="text-sm font-inter text-neutral-500 dark:text-neutral-400">
            {analyses.length} analyses
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => startTutorial('history')}
          className="p-2"
        >
          <MaterialIcons 
            name="help-outline" 
            size={24} 
            color={isDark ? "#d4d4d4" : "#525252"} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 px-4"
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
          <EmptyState isDark={isDark} />
        ) : (
          <View className="py-4">
            {analyses.map((analysis) => (
              <AnalysisCard
                key={analysis.id}
                analysis={analysis}
                isDark={isDark}
                onOpenModal={openAnalysisModal}
                onShare={handleShare}
                onDelete={handleDelete}
                formatDate={formatDate}
                getUrgencyColor={getUrgencyColor}
                getUrgencyLevel={getUrgencyLevel}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <AnalysisModal
        visible={modalVisible}
        isDark={isDark}
        selectedAnalysis={selectedAnalysis}
        onClose={() => setModalVisible(false)}
        onShare={handleShare}
        onDelete={handleDelete}
        formatDate={formatDate}
        getUrgencyColor={getUrgencyColor}
        getUrgencyLevel={getUrgencyLevel}
      />
      <TutorialOverlay steps={historyTutorialSteps} tutorialId="history" />
    </SafeAreaView>
  );
};

export default AnalysisHistoryScreen;