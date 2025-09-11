import { View, Text, TouchableOpacity } from "react-native";

const Tag = ({ label, isDarkMode, onPress }) => {
  return (
    <TouchableOpacity 
      className={`px-2 py-1 rounded-full mr-2 mb-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}
      onPress={onPress}
    >
      <Text 
        className={`text-xs font-inter ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
        numberOfLines={1}
        adjustsFontSizeToFit={true}
        minimumFontScale={0.8}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

export default Tag;