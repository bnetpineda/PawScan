import { Image, Text, TouchableOpacity, View, TextInput } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { router } from "expo-router";

const Header = ({ 
  isDark, 
  onShowTutorial, 
  onSearch, 
  isSearching, 
  searchQuery, 
  onClearSearch,
  setIsSearching 
}) => {
  return (
    <>
      {/* Top Header */}
      <View className="flex-row items-center px-5 py-4 border-b border-neutral-200 dark:border-neutral-800">
        <Image
          source={require("../../assets/images/home-logo.png")}
          className="w-8 h-9"
          resizeMode="cover"
        />
        <Text className="text-2xl font-inter-bold text-black dark:text-white ml-2">
          PawScan
        </Text>
        <View className="flex-1" />
        <TouchableOpacity
          className="px-3 py-1"
          onPress={onShowTutorial}
          activeOpacity={0.7}
        >
          <Text className="text-base font-inter-bold dark:text-white text-black">
            Help
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Search Bar or Icons */}
      {isSearching ? (
        <View className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
          <View className="flex-row items-center bg-neutral-100 dark:bg-neutral-800 rounded-full px-4 py-2">
            <FontAwesome
              name="search"
              size={18}
              color={isDark ? "#8E8E93" : "#0A0A0A"}
            />
            <TextInput
              value={searchQuery}
              onChangeText={onSearch}
              placeholder="Search posts..."
              placeholderTextColor={isDark ? "#8E8E93" : "#6C757D"}
              className="flex-1 mx-2 font-inter text-black dark:text-white"
              autoFocus
            />
            <TouchableOpacity onPress={onClearSearch}>
              <FontAwesome
                name="times"
                size={18}
                color={isDark ? "#8E8E93" : "#0A0A0A"}
              />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        /* Top Header with Icons */
        <View className="flex-row justify-center items-center px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 divide-x divide-neutral-200 dark:divide-neutral-800">
          <TouchableOpacity
            className="flex-1 items-center"
            onPress={() => setIsSearching(true)}
          >
            <FontAwesome
              name="search"
              size={20}
              color={isDark ? "#fff" : "#0A0A0A"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 items-center"
            onPress={() => router.push("info")}
          >
            <FontAwesome
              name="info"
              size={20}
              color={isDark ? "#fff" : "#0A0A0A"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 items-center"
            onPress={() => router.push("history")}
          >
            <FontAwesome
              name="history"
              size={20}
              color={isDark ? "#fff" : "#0A0A0A"}
            />
          </TouchableOpacity>
        </View>
      )}
    </>
  );
};

export default Header;