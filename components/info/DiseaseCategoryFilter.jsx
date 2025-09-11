import { ScrollView, TouchableOpacity, Text } from "react-native";

const DiseaseCategoryFilter = ({ categories, selectedCategory, onSelectCategory, isDarkMode }) => {
  // Filter out empty categories except "All" and "Bookmarks"
  const filteredCategories = Object.keys(categories).filter(
    category => category === "All" || category === "Bookmarks" || categories[category].length > 0
  );

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      className="pb-2"
    >
      {filteredCategories.map((category) => (
        <TouchableOpacity
          key={category}
          className={`px-4 py-2 rounded-full mr-2 ${
            selectedCategory === category
              ? "dark:bg-gray-700 bg-gray-800"
              : "dark:bg-gray-800 bg-gray-200"
          }`}
          onPress={() => onSelectCategory(category)}
        >
          <Text
            className={`text-sm font-inter-semibold ${
              selectedCategory === category
                ? "dark:text-white text-white"
                : "dark:text-gray-300 text-gray-700"
            }`}
          >
            {category} 
            {category !== "Bookmarks" && categories[category] && ` (${categories[category].length})`}
            {category === "Bookmarks" && ` (${categories[category].length})`}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

export default DiseaseCategoryFilter;