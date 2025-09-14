import { FontAwesome } from "@expo/vector-icons";
import { TouchableOpacity, Text, View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DetailSection from "./DetailSection";
import SeverityIndicator from "./SeverityIndicator";
import TagList from "./TagList";
import BookmarkButton from "./BookmarkButton";

const ICONS = {
  search: "search",
  close: "close",
  chevronRight: "chevron-right",
  alert: "exclamation-circle",
  shield: "shield",
  stethoscope: "stethoscope",
  info: "info-circle",
  bug: "bug",
  paw: "paw",
  heart: "heart",
  filter: "filter",
  cat: "paw",
  dog: "paw",
  clock: "clock-o",
  medkit: "medkit",
  tag: "tag",
};

const DiseaseDetailModal = ({ visible, disease, isDarkMode, onClose, isBookmarked, onBookmarkPress }) => {
  // Get species icons
  const getSpeciesIcons = () => {
    const species = disease?.Species || [];
    return species.map((s, index) => {
      const isCat = s.toLowerCase() === "cat";
      return (
        <View key={index} className="flex-row items-center mr-2">
          <FontAwesome
            name="paw"
            size={16}
            color={isCat ? (isDarkMode ? "#60A5FA" : "#3B82F6") : (isDarkMode ? "#FBBF24" : "#F59E0B")}
          />
          <Text className={`ml-1 text-sm font-inter ${isDarkMode ? 'text-neutral-300' : 'text-neutral-700'}`}>
            {s}
          </Text>
        </View>
      );
    });
  };

  return (
    <SafeAreaView
      className="flex-1 bg-white dark:bg-black"
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View
        className="flex-row items-start justify-between p-4 border-b dark:border-gray-800 border-gray-200"
      >
        <View className="flex-1">
          <View className="flex-row items-start justify-between">
            <Text
              className="text-xl font-inter-bold flex-1 dark:text-white text-black pr-2"
              numberOfLines={3}
            >
              {disease?.Disease}
            </Text>
            <BookmarkButton 
              isBookmarked={isBookmarked} 
              onPress={onBookmarkPress} 
              isDarkMode={isDarkMode} 
            />
          </View>
          <View className="flex-row items-center mt-3 flex-wrap">
            <SeverityIndicator severity={disease?.Severity} isDarkMode={isDarkMode} />
            <View className="flex-row items-center ml-3 mt-1">
              {getSpeciesIcons()}
            </View>
          </View>
        </View>
        <TouchableOpacity
          onPress={onClose}
          className="p-2 ml-2"
        >
          <FontAwesome
            name={ICONS.close}
            size={20}
            color={isDarkMode ? "#fff" : "#000"}
          />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 p-4">
        <DetailSection
          title="Overview"
          content={disease?.Overview}
          icon={ICONS.info}
          color="green"
          isDarkMode={isDarkMode}
        />

        <DetailSection
          title="Symptoms"
          content={disease?.Symptoms}
          icon={ICONS.alert}
          color="orange"
          isDarkMode={isDarkMode}
        />

        <DetailSection
          title="Causes"
          content={disease?.Causes}
          icon={ICONS.stethoscope}
          color="purple"
          isDarkMode={isDarkMode}
        />

        <DetailSection
          title="Prevention Tips"
          content={disease?.["Prevention Tips"]}
          icon={ICONS.shield}
          color="green"
          isDarkMode={isDarkMode}
        />

        <DetailSection
          title="Treatment & Protocols"
          content={disease?.["Approved Treatment and Protocols"]}
          icon={ICONS.stethoscope}
          color="purple"
          isDarkMode={isDarkMode}
        />

        <DetailSection
          title="When to See a Vet"
          content={disease?.["When to See a Vet"]}
          icon={ICONS.medkit}
          color="blue"
          isDarkMode={isDarkMode}
        />

        <DetailSection
          title="Treatment Timeline"
          content={disease?.["Treatment Timeline"]}
          icon={ICONS.clock}
          color="green"
          isDarkMode={isDarkMode}
        />

        {disease?.["Feline vs Canine"] && (
          <View
            className="p-4 rounded-xl mb-6 dark:bg-neutral-900 bg-neutral-100"
          >
            <View className="flex-row items-center mb-2">
              <FontAwesome 
                name={ICONS.paw} 
                size={16} 
                color={isDarkMode ? "#fff" : "#000"} 
              />
              <Text
                className="ml-2 font-inter-semibold mb-2 dark:text-neutral-300 text-neutral-700"
              >
                Species Comparison
              </Text>
            </View>
            <Text
              className="text-base font-inter dark:text-neutral-300 text-neutral-700"
            >
              {disease["Feline vs Canine"]}
            </Text>
          </View>
        )}

        {disease?.Tags && disease.Tags.length > 0 && (
          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <FontAwesome 
                name={ICONS.tag} 
                size={20} 
                color={isDarkMode ? "#60A5FA" : "#2563EB"} 
              />
              <Text
                className="ml-2 text-lg font-inter-semibold dark:text-white text-black"
              >
                Related Tags
              </Text>
            </View>
            <TagList tags={disease.Tags} isDarkMode={isDarkMode} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default DiseaseDetailModal;