import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  StatusBar,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome } from "@expo/vector-icons";
import diseasesData from "../assets/diseases_information.json";

const ICONS = {
  search: "search",
  close: "close",
  chevronRight: "chevron-right",
  alert: "exclamation-circle",
  shield: "shield",
  stethoscope: "stethoscope",
  info: "info-circle",
};

const DiseasesInformationScreen = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDisease, setSelectedDisease] = useState(null);
  const isDarkMode = useColorScheme() === "dark";

  // Filter diseases based on search query
  const filteredDiseases = useMemo(() => {
    if (!searchQuery.trim()) return diseasesData.filter((d) => d.Disease);

    return diseasesData.filter(
      (disease) =>
        disease.Disease &&
        (disease.Disease.toLowerCase().includes(searchQuery.toLowerCase()) ||
          disease.Overview?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          disease.Symptoms?.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [searchQuery]);

  const DiseaseCard = ({ disease }) => (
    <TouchableOpacity
      className={`mb-4 p-4 rounded-2xl border ${
        isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"
      } shadow-sm`}
      onPress={() => setSelectedDisease(disease)}
      activeOpacity={0.7}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1 mr-3">
          <Text
            className={`text-lg font-inter-semibold mb-2 ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            {disease.Disease}
          </Text>
          <Text
            className={`text-sm font-inter leading-5 ${
              isDarkMode ? "text-gray-300" : "text-gray-600"
            }`}
            numberOfLines={2}
          >
            {disease.Overview}
          </Text>
          {disease["Feline vs Canine"] && (
            <View
              className={`mt-2 px-2 py-1 rounded-full self-start ${
                isDarkMode ? "bg-blue-900" : "bg-blue-50"
              }`}
            >
              <Text
                className={`text-xs font-inter-semibold ${
                  isDarkMode ? "text-blue-300" : "text-blue-700"
                }`}
              >
                Species Specific
              </Text>
            </View>
          )}
        </View>
        <FontAwesome
          name={ICONS.chevronRight}
          size={20}
          color={isDarkMode ? "#9CA3AF" : "#6B7280"}
        />
      </View>
    </TouchableOpacity>
  );

  const DetailSection = ({ title, content, icon, color = "blue" }) => {
    if (!content) return null;

    const colorMap = {
      blue: isDarkMode ? "#60A5FA" : "#2563EB",
      green: isDarkMode ? "#34D399" : "#059669",
      orange: isDarkMode ? "#FBBF24" : "#EA580C",
      purple: isDarkMode ? "#A78BFA" : "#7C3AED",
    };

    return (
      <View className="mb-6">
        <View className="flex-row items-center mb-3">
          <FontAwesome name={icon} size={20} color={colorMap[color]} />
          <Text
            className={`ml-2 text-lg font-inter-semibold ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            {title}
          </Text>
        </View>
        <Text
          className={`text-base font-inter leading-6 ${
            isDarkMode ? "text-gray-300" : "text-gray-700"
          }`}
        >
          {content}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView
      className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}
    >
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor={isDarkMode ? "#111827" : "#F9FAFB"}
      />

      {/* Header */}
      <View
        className={`px-6 py-4 border-b ${
          isDarkMode ? "border-gray-800" : "border-gray-200"
        }`}
      >
        <View className="flex-row items-center justify-between mb-4">
          <Text
            className={`text-2xl font-inter-bold ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Disease Information
          </Text>
        </View>

        {/* Search Bar */}
        <View
          className={`flex-row items-center px-4 py-3 rounded-xl ${
            isDarkMode ? "bg-gray-800" : "bg-white"
          } shadow-sm`}
        >
          <FontAwesome
            name={ICONS.search}
            size={20}
            color={isDarkMode ? "#9CA3AF" : "#6B7280"}
          />
          <TextInput
            className={`flex-1 ml-3 text-base font-inter ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
            placeholder="Search diseases..."
            placeholderTextColor={isDarkMode ? "#9CA3AF" : "#6B7280"}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <FontAwesome
                name={ICONS.close}
                size={20}
                color={isDarkMode ? "#9CA3AF" : "#6B7280"}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Disease List */}
      <ScrollView className="flex-1 px-6 py-4">
        {filteredDiseases.length > 0 ? (
          <>
            <Text
              className={`text-sm font-inter-semibold mb-4 ${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              {filteredDiseases.length} disease
              {filteredDiseases.length !== 1 ? "s" : ""} found
            </Text>
            {filteredDiseases.map((disease, index) => (
              <DiseaseCard key={index} disease={disease} />
            ))}
          </>
        ) : (
          <View className="flex-1 items-center justify-center py-16">
            <FontAwesome
              name={ICONS.alert}
              size={48}
              color={isDarkMode ? "#6B7280" : "#9CA3AF"}
            />
            <Text
              className={`text-lg font-inter-semibold mt-4 ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              No diseases found
            </Text>
            <Text
              className={`text-sm font-inter mt-2 text-center ${
                isDarkMode ? "text-gray-500" : "text-gray-400"
              }`}
            >
              Try adjusting your search terms
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Disease Detail Modal */}
      <Modal
        visible={!!selectedDisease}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedDisease(null)}
      >
        <SafeAreaView
          className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-white"}`}
        >
          <View
            className={`flex-row items-center justify-between p-6 border-b ${
              isDarkMode ? "border-gray-800" : "border-gray-200"
            }`}
          >
            <Text
              className={`text-xl font-inter-bold flex-1 ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              {selectedDisease?.Disease}
            </Text>
            <TouchableOpacity
              onPress={() => setSelectedDisease(null)}
              className={`p-2 rounded-full ${
                isDarkMode ? "bg-gray-800" : "bg-gray-100"
              }`}
            >
              <FontAwesome
                name={ICONS.close}
                size={20}
                color={isDarkMode ? "#9CA3AF" : "#6B7280"}
              />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 p-6">
            <DetailSection
              title="Overview"
              content={selectedDisease?.Overview}
              icon={ICONS.info}
              color="blue"
            />

            <DetailSection
              title="Symptoms"
              content={selectedDisease?.Symptoms}
              icon={ICONS.alert}
              color="orange"
            />

            <DetailSection
              title="Causes"
              content={selectedDisease?.Causes}
              icon={ICONS.stethoscope}
              color="purple"
            />

            <DetailSection
              title="Prevention Tips"
              content={selectedDisease?.["Prevention Tips"]}
              icon={ICONS.shield}
              color="green"
            />

            <DetailSection
              title="Treatment & Protocols"
              content={selectedDisease?.["Approved Treatment and Protocols"]}
              icon={ICONS.stethoscope}
              color="blue"
            />

            {selectedDisease?.["Feline vs Canine"] && (
              <View
                className={`p-4 rounded-xl mb-6 ${
                  isDarkMode ? "bg-gray-800" : "bg-blue-50"
                }`}
              >
                <Text
                  className={`font-inter-semibold mb-2 ${
                    isDarkMode ? "text-blue-400" : "text-blue-800"
                  }`}
                >
                  Species Comparison
                </Text>
                <Text
                  className={`text-base font-inter ${
                    isDarkMode ? "text-gray-300" : "text-blue-700"
                  }`}
                >
                  {selectedDisease["Feline vs Canine"]}
                </Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

export default DiseasesInformationScreen;
