import { FontAwesome } from "@expo/vector-icons";
import { TouchableOpacity } from "react-native";

const BookmarkButton = ({ isBookmarked, onPress, isDarkMode }) => {
  return (
    <TouchableOpacity onPress={onPress} className="p-2">
      <FontAwesome
        name={isBookmarked ? "bookmark" : "bookmark-o"}
        size={24}
        color={isBookmarked ? (isDarkMode ? "#FBBF24" : "#F59E0B") : (isDarkMode ? "#fff" : "#000")}
      />
    </TouchableOpacity>
  );
};

export default BookmarkButton;