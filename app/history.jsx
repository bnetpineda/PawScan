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
  Dimensions,
  StatusBar,
  useColorScheme,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";

const { width } = Dimensions.get("window");

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
    background: isDark ? "#000000" : "#FFFFFF",
    surface: isDark ? "#1C1C1E" : "#F8F9FA",
    card: isDark ? "#2C2C2E" : "#FFFFFF",
    text: isDark ? "#FFFFFF" : "#000000",
    textSecondary: isDark ? "#8E8E93" : "#6C757D",
    border: isDark ? "#38383A" : "#E5E5EA",
    primary: "#007AFF",
    danger: "#FF3B30",
    success: "#34C759",
    warning: "#FF9500",
    modalBackground: isDark ? "rgba(0,0,0,0.8)" : "rgba(0,0,0,0.5)",
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
      const result = await Share.share({
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
      return colors.danger;
    } else if (lowerText.includes("medium") || lowerText.includes("moderate")) {
      return colors.warning;
    }
    return colors.success;
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
        style={[
          styles.analysisCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
        onPress={() => openAnalysisModal(analysis)}
        activeOpacity={0.7}
      >
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.dateContainer}>
            <FontAwesome
              name="calendar"
              size={14}
              color={colors.textSecondary}
            />
            <Text style={[styles.dateText, { color: colors.textSecondary }]}>
              {formatDate(analysis.created_at)}
            </Text>
          </View>
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleShare(analysis)}
            >
              <FontAwesome
                name="share"
                size={16}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDelete(analysis.id)}
            >
              <FontAwesome name="trash" size={16} color={colors.danger} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Image and Content */}
        <View style={styles.cardContent}>
          <Image
            source={{ uri: analysis.image_url }}
            style={styles.analysisImage}
            resizeMode="cover"
          />
          <View style={styles.contentDetails}>
            <View
              style={[styles.urgencyBadge, { backgroundColor: urgencyColor }]}
            >
              <Text style={styles.urgencyText}>{urgencyLevel}</Text>
            </View>
            <Text
              style={[styles.analysisPreview, { color: colors.text }]}
              numberOfLines={3}
            >
              {analysis.analysis_result}
            </Text>
            <TouchableOpacity style={styles.viewMoreButton}>
              <Text style={[styles.viewMoreText, { color: colors.primary }]}>
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
        style={[
          styles.modalContainer,
          { backgroundColor: colors.modalBackground },
        ]}
      >
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          {/* Modal Header */}
          <View
            style={[styles.modalHeader, { borderBottomColor: colors.border }]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Analysis Details
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <FontAwesome
                name="times"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {selectedAnalysis && (
            <ScrollView
              style={styles.modalBody}
              showsVerticalScrollIndicator={false}
            >
              {/* Image */}
              <Image
                source={{ uri: selectedAnalysis.image_url }}
                style={styles.modalImage}
                resizeMode="cover"
              />

              {/* Date and Urgency */}
              <View style={styles.modalInfo}>
                <Text
                  style={[styles.modalDate, { color: colors.textSecondary }]}
                >
                  {formatDate(selectedAnalysis.created_at)}
                </Text>
                <View
                  style={[
                    styles.urgencyBadge,
                    {
                      backgroundColor: getUrgencyColor(
                        selectedAnalysis.analysis_result
                      ),
                    },
                  ]}
                >
                  <Text style={styles.urgencyText}>
                    {getUrgencyLevel(selectedAnalysis.analysis_result)}
                  </Text>
                </View>
              </View>

              {/* Full Analysis */}
              <View style={styles.analysisContent}>
                <Text style={[styles.analysisFullText, { color: colors.text }]}>
                  {selectedAnalysis.analysis_result}
                </Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[
                    styles.modalActionButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={() => {
                    handleShare(selectedAnalysis);
                    setModalVisible(false);
                  }}
                >
                  <FontAwesome name="share" size={16} color="#FFFFFF" />
                  <Text style={styles.modalActionText}>Share</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalActionButton,
                    { backgroundColor: colors.danger },
                  ]}
                  onPress={() => {
                    setModalVisible(false);
                    handleDelete(selectedAnalysis.id);
                  }}
                >
                  <FontAwesome name="trash" size={16} color="#FFFFFF" />
                  <Text style={styles.modalActionText}>Delete</Text>
                </TouchableOpacity>
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
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading your analyses...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
      />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Analysis History
        </Text>
        <View style={styles.headerStats}>
          <Text style={[styles.statsText, { color: colors.textSecondary }]}>
            {analyses.length} analyses
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {analyses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FontAwesome
              name="history"
              size={48}
              color={colors.textSecondary}
            />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No analyses yet
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Start by taking a photo of your pet to create your first health
              analysis!
            </Text>
          </View>
        ) : (
          <View style={styles.analysesContainer}>
            {analyses.map(renderAnalysisCard)}
          </View>
        )}
      </ScrollView>

      <AnalysisModal />
    </SafeAreaView>
  );
};

export default AnalysisHistoryScreen;

const styles = {
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  headerStats: {
    alignItems: "flex-end",
  },
  statsText: {
    fontSize: 14,
    fontWeight: "500",
  },
  scrollView: {
    flex: 1,
  },
  analysesContainer: {
    padding: 16,
  },
  analysisCard: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingBottom: 12,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "500",
  },
  cardActions: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    padding: 8,
  },
  cardContent: {
    flexDirection: "row",
    padding: 16,
    paddingTop: 0,
  },
  analysisImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 16,
  },
  contentDetails: {
    flex: 1,
  },
  urgencyBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  urgencyText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  analysisPreview: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  viewMoreButton: {
    alignSelf: "flex-start",
  },
  viewMoreText: {
    fontSize: 14,
    fontWeight: "500",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxHeight: "90%",
    borderRadius: 20,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 8,
  },
  modalBody: {
    flex: 1,
  },
  modalImage: {
    width: "100%",
    height: 250,
  },
  modalInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingBottom: 12,
  },
  modalDate: {
    fontSize: 14,
    fontWeight: "500",
  },
};
