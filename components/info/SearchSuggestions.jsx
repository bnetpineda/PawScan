import { View, Text, TouchableOpacity } from "react-native";

const SearchSuggestions = ({ suggestions, isDarkMode, onSuggestionPress }) => {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <View className={`mt-1 rounded-lg ${isDarkMode ? 'bg-neutral-800' : 'bg-white'} border ${isDarkMode ? 'border-neutral-700' : 'border-neutral-200'}`}>
      {suggestions.map((suggestion, index) => (
        <TouchableOpacity
          key={index}
          className={`p-3 border-b ${isDarkMode ? 'border-neutral-700' : 'border-neutral-200'}`}
          onPress={() => onSuggestionPress(suggestion)}
        >
          <Text className={`font-inter ${isDarkMode ? 'text-white' : 'text-black'}`}>
            {suggestion}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default SearchSuggestions;