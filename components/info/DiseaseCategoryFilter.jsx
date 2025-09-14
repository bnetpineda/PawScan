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
              ? "dark:bg-neutral-700 bg-neutral-800"
              : "dark:bg-neutral-800 bg-neutral-200"
          }`}
          onPress={() => onSelectCategory(category)}
        >
          <Text
            className={`text-sm font-inter-semibold ${
              selectedCategory === category
                ? "dark:text-white text-white"
                : "dark:text-neutral-300 text-neutral-700"
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