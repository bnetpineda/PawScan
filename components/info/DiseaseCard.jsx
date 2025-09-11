import { FontAwesome } from "@expo/vector-icons";
import { TouchableOpacity, Text, View } from "react-native";
import SeverityIndicator from "./SeverityIndicator";
import TagList from "./TagList";

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
};

const DiseaseCard = ({ disease, onPress, isDarkMode }) => {
  // Determine icon based on disease type
  const getDiseaseIcon = () => {
    const diseaseName = disease.Disease.toLowerCase();
    if (diseaseName.includes("mite") || diseaseName.includes("flea") || diseaseName.includes("lice")) {
      return ICONS.bug;
    } else if (diseaseName.includes("allergy") || diseaseName.includes("allergic")) {
      return ICONS.heart;
    } else {
      return ICONS.paw;
    }
  };

  // Determine icon color based on disease type
  const getIconColor = () => {
    const diseaseName = disease.Disease.toLowerCase();
    if (diseaseName.includes("mite") || diseaseName.includes("flea") || diseaseName.includes("lice")) {
      return isDarkMode ? "#F87171" : "#EF4444"; // Red for parasites
    } else if (diseaseName.includes("allergy") || diseaseName.includes("allergic")) {
      return isDarkMode ? "#60A5FA" : "#3B82F6"; // Blue for allergies
    } else {
      return isDarkMode ? "#34D399" : "#10B981"; // Green for others
    }
  };

  // Get species icons
  const getSpeciesIcons = () => {
    const species = disease.Species || [];
    return species.map((s, index) => {
      const isCat = s.toLowerCase() === "cat";
      return (
        <View key={index} className="flex-row items-center mr-2">
          <FontAwesome
            name="paw"
            size={14}
            color={isCat ? (isDarkMode ? "#60A5FA" : "#3B82F6") : (isDarkMode ? "#FBBF24" : "#F59E0B")}
          />
          <Text className={`ml-1 text-xs font-inter ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            {s}
          </Text>
        </View>
      );
    });
  };

  return (
    <TouchableOpacity
      className="mb-3 p-4 rounded-xl border dark:bg-black bg-white border-gray-200 dark:border-gray-800"
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1 mr-3">
          <View className="flex-row items-center justify-between mb-1">
            <View className="flex-row items-center">
              <FontAwesome
                name={getDiseaseIcon()}
                size={16}
                color={getIconColor()}
              />
              <Text className="text-lg font-inter-semibold ml-2 dark:text-white text-black">
                {disease.Disease}
              </Text>
            </View>
            <SeverityIndicator severity={disease.Severity} isDarkMode={isDarkMode} />
          </View>
          
          <Text
            className="text-sm font-inter leading-5 dark:text-gray-300 text-gray-600"
            numberOfLines={2}
          >
            {disease.Overview}
          </Text>
          
          <View className="flex-row items-center mt-2">
            {getSpeciesIcons()}
          </View>
          
          <TagList tags={disease.Tags} isDarkMode={isDarkMode} />
        </View>
        <FontAwesome
          name={ICONS.chevronRight}
          size={20}
          color={isDarkMode ? "#fff" : "#000"}
        />
      </View>
    </TouchableOpacity>
  );
};

export default DiseaseCard;
