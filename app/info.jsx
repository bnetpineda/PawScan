import { FontAwesome } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  Modal,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import diseasesData from "../assets/diseases_information.json";

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

const DiseasesInformationScreen = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDisease, setSelectedDisease] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const isDarkMode = useColorScheme() === "dark";

  // Categorize diseases
  const categorizedDiseases = useMemo(() => {
    const categories = {
      "All": [],
      "Skin Conditions": [],
      "Infections": [],
      "Parasites": [],
      "Allergies": [],
      "Other": []
    };

    diseasesData.forEach(disease => {
      if (!disease.Disease) return;
      
      categories["All"].push(disease);
      
      const diseaseName = disease.Disease.toLowerCase();
      const overview = disease.Overview?.toLowerCase() || "";
      
      if (diseaseName.includes("dermatitis") || diseaseName.includes("allergy") || diseaseName.includes("allergic")) {
        categories["Allergies"].push(disease);
      } else if (diseaseName.includes("mite") || diseaseName.includes("flea") || diseaseName.includes("lice") || diseaseName.includes("tick")) {
        categories["Parasites"].push(disease);
      } else if (diseaseName.includes("bacteria") || diseaseName.includes("bacterial") || diseaseName.includes("fungi") || diseaseName.includes("fungal")) {
        categories["Infections"].push(disease);
      } else if (diseaseName.includes("skin") || diseaseName.includes("dermatitis") || diseaseName.includes("acne")) {
        categories["Skin Conditions"].push(disease);
      } else {
        categories["Other"].push(disease);
      }
    });

    return categories;
  }, []);

  // Filter diseases based on search query and category
  const filteredDiseases = useMemo(() => {
    let diseasesToFilter = selectedCategory === "All" 
      ? diseasesData.filter((d) => d.Disease)
      : categorizedDiseases[selectedCategory] || [];

    if (!searchQuery.trim()) return diseasesToFilter;

    return diseasesToFilter.filter(
      (disease) =>
        disease.Disease &&
        (disease.Disease.toLowerCase().includes(searchQuery.toLowerCase()) ||
          disease.Overview?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          disease.Symptoms?.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [searchQuery, selectedCategory, categorizedDiseases]);

  const DiseaseCard = ({ disease }) => {
    // Determine icon based on disease type
    const getDiseaseIcon = () => {
      const diseaseName = disease.Disease.toLowerCase();
      if (diseaseName.includes("mite") || diseaseName.includes("flea") || diseaseName.includes("lice")) {
        return ICONS.bug;
      } else if (diseaseName.includes("allergy") || diseaseName.includes("allergic")) {
        return ICONS.heart;
      } else {
        return ICONS.paw;
      }
    };

    // Determine icon color based on disease type
    const getIconColor = () => {
      const diseaseName = disease.Disease.toLowerCase();
      if (diseaseName.includes("mite") || diseaseName.includes("flea") || diseaseName.includes("lice")) {
        return isDarkMode ? "#F87171" : "#EF4444"; // Red for parasites
      } else if (diseaseName.includes("allergy") || diseaseName.includes("allergic")) {
        return isDarkMode ? "#60A5FA" : "#3B82F6"; // Blue for allergies
      } else {
        return isDarkMode ? "#34D399" : "#10B981"; // Green for others
      }
    };

    return (
      <TouchableOpacity
        className="mb-4 p-4 rounded-2xl border dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-100 shadow-sm"
        onPress={() => setSelectedDisease(disease)}
        activeOpacity={0.7}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1 mr-3">
            <View className="flex-row items-center mb-1">
              <FontAwesome
                name={getDiseaseIcon()}
                size={16}
                color={getIconColor()}
              />
              <Text className="text-lg font-inter-semibold ml-2 dark:text-white text-gray-900">
                {disease.Disease}
              </Text>
            </View>
            <Text
              className="text-sm font-inter leading-5 dark:text-gray-300 text-gray-600"
              numberOfLines={2}
            >
              {disease.Overview}
            </Text>
            {disease["Feline vs Canine"] && (
              <View className="mt-2 px-2 py-1 rounded-full self-start dark:bg-blue-900 bg-blue-100">
                <Text
                  className="text-xs font-inter-semibold dark:text-blue-300 text-blue-700"
                >
                  Species Specific
                </Text>
              </View>
            )}
          </View>
          <FontAwesome
            name={ICONS.chevronRight}
            size={20}
            color={isDarkMode ? "#9CA3AF" : "#6B7280"}
          />
        </View>
      </TouchableOpacity>
    );
  };

  const DetailSection = ({ title, content, icon, color = "blue" }) => {
    if (!content) return null;

    const colorMap = {
      blue: isDarkMode ? "#60A5FA" : "#2563EB",
      green: isDarkMode ? "#34D399" : "#059669",
      orange: isDarkMode ? "#FBBF24" : "#EA580C",
      purple: isDarkMode ? "#A78BFA" : "#7C3AED",
    };

    return (
      <View className="mb-6">
        <View className="flex-row items-center mb-3">
          <FontAwesome name={icon} size={20} color={colorMap[color]} />
          <Text
            className="ml-2 text-lg font-inter-semibold dark:text-white text-gray-900"
          >
            {title}
          </Text>
        </View>
        <Text
          className="text-base font-inter leading-6 dark:text-gray-300 text-gray-700"
        >
          {content}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView
      className="flex-1 dark:bg-gray-900 bg-gray-50"
    >
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor={isDarkMode ? "#111827" : "#F9FAFB"}
      />

      {/* Header */}
      <View
        className="px-6 py-4 border-b dark:border-gray-800 border-gray-200"
      >
        <View className="flex-row items-center justify-between mb-4">
          <Text
            className="text-2xl font-inter-bold dark:text-white text-gray-900"
          >
            Disease Information
          </Text>
        </View>

        {/* Search Bar */}
        <View
          className="flex-row items-center px-4 py-3 rounded-xl dark:bg-gray-800 bg-white shadow-sm mb-4"
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
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <FontAwesome
                name={ICONS.close}
                size={20}
                color={isDarkMode ? "#9CA3AF" : "#6B7280"}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Filter */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          className="pb-2"
        >
          {Object.keys(categorizedDiseases).map((category) => (
            <TouchableOpacity
              key={category}
              className={`px-4 py-2 rounded-full mr-2 ${
                selectedCategory === category
                  ? "dark:bg-blue-600 bg-blue-500"
                  : "dark:bg-gray-700 bg-gray-200"
              }`}
              onPress={() => setSelectedCategory(category)}
            >
              <Text
                className={`text-sm font-inter-semibold ${
                  selectedCategory === category
                    ? "dark:text-white text-white"
                    : "dark:text-gray-300 text-gray-700"
                }`}
              >
                {category} ({categorizedDiseases[category].length})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Disease List */}
      <View className="flex-1 px-6 py-4">
        {filteredDiseases.length > 0 ? (
          <>
            <Text
              className="text-sm font-inter-semibold mb-4 dark:text-gray-400 text-gray-600"
            >
              {filteredDiseases.length} disease
              {filteredDiseases.length !== 1 ? "s" : ""} found
              {selectedCategory !== "All" && ` in ${selectedCategory}`}
            </Text>
            <FlatList
              data={filteredDiseases}
              renderItem={({ item }) => <DiseaseCard disease={item} />}
              keyExtractor={(item, index) => index.toString()}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          </>
        ) : (
          <View className="flex-1 items-center justify-center py-16">
            <FontAwesome
              name={ICONS.alert}
              size={48}
              color={isDarkMode ? "#6B7280" : "#9CA3AF"}
            />
            <Text
              className="text-lg font-inter-semibold mt-4 dark:text-gray-400 text-gray-500"
            >
              No diseases found
            </Text>
            <Text
              className="text-sm font-inter mt-2 text-center dark:text-gray-500 text-gray-400"
            >
              Try adjusting your search terms or select a different category
            </Text>
            <TouchableOpacity
              className="mt-4 px-4 py-2 rounded-full dark:bg-gray-700 bg-gray-200"
              onPress={() => {
                setSearchQuery("");
                setSelectedCategory("All");
              }}
            >
              <Text className="font-inter-semibold dark:text-gray-300 text-gray-700">
                Clear Filters
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Disease Detail Modal */}
      <Modal
        visible={!!selectedDisease}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedDisease(null)}
      >
        <SafeAreaView
          className="flex-1 dark:bg-gray-900 bg-white"
        >
          <View
            className="flex-row items-center justify-between p-6 border-b dark:border-gray-800 border-gray-200"
          >
            <Text
              className="text-xl font-inter-bold flex-1 dark:text-white text-gray-900"
            >
              {selectedDisease?.Disease}
            </Text>
            <TouchableOpacity
              onPress={() => setSelectedDisease(null)}
              className="p-2 rounded-full dark:bg-gray-800 bg-gray-100"
            >
              <FontAwesome
                name={ICONS.close}
                size={20}
                color={isDarkMode ? "#9CA3AF" : "#6B7280"}
              />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 p-6">


            <DetailSection
              title="Overview"
              content={selectedDisease?.Overview}
              icon={ICONS.info}
              color="blue"
            />

            <DetailSection
              title="Symptoms"
              content={selectedDisease?.Symptoms}
              icon={ICONS.alert}
              color="orange"
            />

            <DetailSection
              title="Causes"
              content={selectedDisease?.Causes}
              icon={ICONS.stethoscope}
              color="purple"@
            />

            <DetailSection
              title="Prevention Tips"
              content={selectedDisease?.["Prevention Tips"]}
              icon={ICONS.shield}
              color="green"
            />

            <DetailSection
              title="Treatment & Protocols"
              content={selectedDisease?.["Approved Treatment and Protocols"]}
              icon={ICONS.stethoscope}
              color="blue"
            />

            {selectedDisease?.["Feline vs Canine"] && (
              <View
                className="p-4 rounded-xl mb-6 dark:bg-gray-800 bg-blue-50"
              >
                <View className="flex-row items-center mb-2">
                  <FontAwesome 
                    name={ICONS.paw} 
                    size={16} 
                    color={isDarkMode ? "#60A5FA" : "#2563EB"} 
                  />
                  <Text
                    className="ml-2 font-inter-semibold mb-2 dark:text-blue-400 text-blue-800"
                  >
                    Species Comparison
                  </Text>
                </View>
                <Text
                  className="text-base font-inter dark:text-gray-300 text-blue-700"
                >
                  {selectedDisease["Feline vs Canine"]}
                </Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

export default DiseasesInformationScreen;
