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
  selectedCategory,
  searchQuery
}) => {
  if (diseases.length > 0) {
    return (
      <>
        <Text
          className="text-sm font-inter-semibold mb-3 dark:text-neutral-400 text-neutral-600"
        >
          {diseases.length} disease
          {diseases.length !== 1 ? "s" : ""} found
          {selectedCategory !== "All" && ` in ${selectedCategory}`}
          {searchQuery && ` for "${searchQuery}"`}
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
          color={isDarkMode ? "#fff" : "#000"}
        />
        <Text
          className="mt-4 text-xl font-inter-bold dark:text-white text-black"
        >
          No diseases found
        </Text>
        <Text
          className="mt-2 text-base font-inter text-neutral-500 dark:text-neutral-400 text-center"
        >
          {searchQuery || selectedCategory !== "All" 
            ? "Try adjusting your search terms or filters" 
            : "No diseases available"}
        </Text>
        {(searchQuery || selectedCategory !== "All") && (
          <TouchableOpacity
            className="mt-4 px-4 py-2 rounded-full dark:bg-neutral-800 bg-neutral-200"
            onPress={onClearFilters}
          >
            <Text className="font-inter-semibold dark:text-neutral-300 text-neutral-700">
              Clear Filters
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }
};

export default DiseaseList;