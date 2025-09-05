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
      className="flex-row items-center px-4 py-3 rounded-xl border border-gray-200 mb-4 dark:border-neutral-900 bg-white dark:bg-neutral-900 shadow-sm"
    >
      <FontAwesome
        name={ICONS.search}
        size={20}
        color={isDarkMode ? "#9CA3AF" : "#6B7280"}
      />
      <TextInput
        className="flex-1 ml-3 text-base font-inter dark:text-white text-gray-900"
        placeholder="Search diseases..."
        placeholderTextColor={isDarkMode ? "#9CA3AF" : "#6B7280"}
        value={searchQuery}
        onChangeText={onSearchChange}
      />
      {searchQuery.length > 0 && (
        <TouchableOpacity onPress={onClear}>
          <FontAwesome
            name={ICONS.close}
            size={20}
            color={isDarkMode ? "#9CA3AF" : "#6B7280"}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default DiseaseSearchBar;