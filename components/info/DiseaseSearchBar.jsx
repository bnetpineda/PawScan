import { FontAwesome } from "@expo/vector-icons";
import { View, TextInput, TouchableOpacity } from "react-native";

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

const DiseaseSearchBar = ({ searchQuery, onSearchChange, isDarkMode, onClear }) => {
  return (
    <View
      className="flex-row items-center px-4 py-3 rounded-xl dark:bg-gray-900 bg-white mb-3 border border-gray-200 dark:border-gray-800"
    >
      <FontAwesome
        name={ICONS.search}
        size={20}
        color={isDarkMode ? "#fff" : "#000"}
      />
      <TextInput
        className="flex-1 ml-3 text-base font-inter dark:text-white text-black"
        placeholder="Search diseases..."
        placeholderTextColor={isDarkMode ? "#8E8E93" : "#6C757D"}
        value={searchQuery}
        onChangeText={onSearchChange}
      />
      {searchQuery.length > 0 && (
        <TouchableOpacity onPress={onClear}>
          <FontAwesome
            name={ICONS.close}
            size={20}
            color={isDarkMode ? "#fff" : "#000"}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default DiseaseSearchBar;