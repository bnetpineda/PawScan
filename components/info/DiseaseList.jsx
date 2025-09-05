import { FlatList, Text, View, TouchableOpacity } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import DiseaseCard from "./DiseaseCard";

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
};

const DiseaseList = ({ 
  diseases, 
  selectedDisease, 
  onSelectDisease, 
  isDarkMode, 
  onClearFilters,
  selectedCategory 
}) => {
  if (diseases.length > 0) {
    return (
      <>
        <Text
          className="text-sm font-inter-semibold mb-4 dark:text-gray-400 text-gray-600"
        >
          {diseases.length} disease
          {diseases.length !== 1 ? "s" : ""} found
          {selectedCategory !== "All" && ` in ${selectedCategory}`}
        </Text>
        <FlatList
          data={diseases}
          renderItem={({ item }) => (
            <DiseaseCard 
              disease={item} 
              onPress={() => onSelectDisease(item)} 
              isDarkMode={isDarkMode} 
            />
          )}
          keyExtractor={(item, index) => index.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      </>
    );
  } else {
    return (
      <View className="flex-1 items-center justify-center py-16">
        <FontAwesome
          name={ICONS.alert}
          size={48}
          color={isDarkMode ? "#6B7280" : "#9CA3AF"}
        />
        <Text
          className="text-lg font-inter-semibold mt-4 dark:text-gray-400 text-gray-500"
        >
          No diseases found
        </Text>
        <Text
          className="text-sm font-inter mt-2 text-center dark:text-gray-500 text-gray-400"
        >
          Try adjusting your search terms or select a different category
        </Text>
        <TouchableOpacity
          className="mt-4 px-4 py-2 rounded-full dark:bg-gray-800 bg-gray-200"
          onPress={onClearFilters}
        >
          <Text className="font-inter-semibold dark:text-gray-300 text-gray-700">
            Clear Filters
          </Text>
        </TouchableOpacity>
      </View>
    );
  }
};

export default DiseaseList;