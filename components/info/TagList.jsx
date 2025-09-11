import { View } from "react-native";
import Tag from "./Tag";

const TagList = ({ tags, isDarkMode, onTagPress }) => {
  if (!tags || tags.length === 0) return null;

  return (
    <View className="flex-row flex-wrap mt-2">
      {tags.map((tag, index) => (
        <Tag 
          key={index} 
          label={tag} 
          isDarkMode={isDarkMode} 
          onPress={onTagPress ? () => onTagPress(tag) : null} 
        />
      ))}
    </View>
  );
};

export default TagList;