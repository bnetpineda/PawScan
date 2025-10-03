import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { useMemo, useState, useEffect } from "react";
import {
  Modal,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import diseasesData from "../assets/diseases_information.json";
import DiseaseCard from "../components/info/DiseaseCard";
import DetailSection from "../components/info/DetailSection";
import DiseaseDetailModal from "../components/info/DiseaseDetailModal";
import DiseaseSearchBar from "../components/info/DiseaseSearchBar";
import DiseaseCategoryFilter from "../components/info/DiseaseCategoryFilter";
import DiseaseList from "../components/info/DiseaseList";
import DiseaseComparison from "../components/info/DiseaseComparison";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTutorial } from "../providers/TutorialProvider";
import TutorialOverlay from "../components/tutorial/TutorialOverlay";
import { diseaseInfoTutorialSteps } from "../components/tutorial/tutorialSteps";

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
  bookmark: "bookmark",
  bookmarked: "bookmark",
  exchange: "exchange",
};

const DiseasesInformationScreen = () => {
  const isDark = useColorScheme() === "dark";
  const { startTutorial, isTutorialCompleted } = useTutorial();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDisease, setSelectedDisease] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [bookmarkedDiseases, setBookmarkedDiseases] = useState([]);
  const [sortBy, setSortBy] = useState("name"); // name, severity, species
  const [showComparison, setShowComparison] = useState(false);

  // Load bookmarked diseases from AsyncStorage
  useEffect(() => {
    const loadBookmarks = async () => {
      try {
        const bookmarks = await AsyncStorage.getItem("bookmarkedDiseases");
        if (bookmarks) {
          setBookmarkedDiseases(JSON.parse(bookmarks));
        }
      } catch (error) {
        console.error("Error loading bookmarks:", error);
      }
    };
    loadBookmarks();
    
    // Show tutorial on first visit
    if (!isTutorialCompleted('diseaseInfo')) {
      const timer = setTimeout(() => {
        startTutorial('diseaseInfo');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Save bookmarked diseases to AsyncStorage
  const saveBookmarks = async (bookmarks) => {
    try {
      await AsyncStorage.setItem("bookmarkedDiseases", JSON.stringify(bookmarks));
    } catch (error) {
      console.error("Error saving bookmarks:", error);
    }
  };

  // Toggle bookmark for a disease
  const toggleBookmark = (disease) => {
    const isBookmarked = bookmarkedDiseases.some(d => d.Disease === disease.Disease);
    let updatedBookmarks;
    
    if (isBookmarked) {
      updatedBookmarks = bookmarkedDiseases.filter(d => d.Disease !== disease.Disease);
    } else {
      updatedBookmarks = [...bookmarkedDiseases, disease];
    }
    
    setBookmarkedDiseases(updatedBookmarks);
    saveBookmarks(updatedBookmarks);
  };

  // Categorize diseases
  const categorizedDiseases = useMemo(() => {
    const categories = {
      "All": [],
      "Skin Conditions": [],
      "Infections": [],
      "Parasites": [],
      "Allergies": [],
      "Tumors/Cancer": [],
      "Other": []
    };

    diseasesData.forEach(disease => {
      if (!disease.Disease) return;
      
      categories["All"].push(disease);
      
      const diseaseName = disease.Disease.toLowerCase();
      const tags = disease.Tags?.map(tag => tag.toLowerCase()) || [];
      
      if (tags.includes("parasite") || tags.includes("flea") || tags.includes("mite") || tags.includes("tick") || tags.includes("lice")) {
        categories["Parasites"].push(disease);
      } else if (tags.includes("infection") || tags.includes("bacterial") || tags.includes("fungal") || tags.includes("viral")) {
        categories["Infections"].push(disease);
      } else if (tags.includes("allergy") || tags.includes("allergic")) {
        categories["Allergies"].push(disease);
      } else if (tags.includes("tumor") || tags.includes("cancer")) {
        categories["Tumors/Cancer"].push(disease);
      } else if (tags.includes("skin") || diseaseName.includes("dermatitis") || diseaseName.includes("acne")) {
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

    const query = searchQuery.toLowerCase();
    return diseasesToFilter.filter(
      (disease) =>
        disease.Disease &&
        (disease.Disease.toLowerCase().includes(query) ||
          disease.Overview?.toLowerCase().includes(query) ||
          disease.Symptoms?.toLowerCase().includes(query) ||
          disease.Tags?.some(tag => tag.toLowerCase().includes(query)))
    );
  }, [searchQuery, selectedCategory, categorizedDiseases]);

  // Sort diseases
  const sortedDiseases = useMemo(() => {
    const diseases = [...filteredDiseases];
    
    switch (sortBy) {
      case "name":
        return diseases.sort((a, b) => a.Disease.localeCompare(b.Disease));
      case "severity":
        const severityOrder = { "Emergency": 4, "High": 3, "Medium": 2, "Low": 1 };
        return diseases.sort((a, b) => (severityOrder[b.Severity] || 0) - (severityOrder[a.Severity] || 0));
      case "species":
        return diseases.sort((a, b) => {
          const speciesA = a.Species?.join(", ") || "";
          const speciesB = b.Species?.join(", ") || "";
          return speciesA.localeCompare(speciesB);
        });
      default:
        return diseases;
    }
  }, [filteredDiseases, sortBy]);

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All");
    setSortBy("name");
  };

  // Filter by tag
  const handleTagFilter = (tag) => {
    setSearchQuery(tag);
  };

  return (
    <SafeAreaView
      className="flex-1 bg-white dark:bg-black"
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={isDark ? "#000" : "#fff"}
      />

      {/* Header */}
      <View
        className="px-4 py-3 border-b dark:border-neutral-800 border-neutral-200"
      >
        <View className="flex-row items-center justify-between mb-3">
          <TouchableOpacity 
            className="p-2"
            onPress={() => router.push('/(user)/home')}
          >
            <FontAwesome
              name="arrow-left"
              size={20}
              color={isDark ? "#fff" : "#000"}
            />
          </TouchableOpacity>
          <Text
            className="text-2xl font-inter-bold dark:text-white text-black flex-1 text-center"
          >
            Disease Information
          </Text>
          <View className="flex-row items-center">
            <TouchableOpacity 
              className="p-2 mr-1"
              onPress={() => startTutorial('diseaseInfo')}
            >
              <MaterialIcons
                name="help-outline"
                size={24}
                color={isDark ? "#d4d4d4" : "#525252"}
              />
            </TouchableOpacity>
            {bookmarkedDiseases.length > 0 && (
              <TouchableOpacity 
                className="flex-row items-center p-2"
                onPress={() => setSelectedCategory("Bookmarks")}
              >
                <FontAwesome
                  name="bookmark"
                  size={20}
                  color={isDark ? "#FBBF24" : "#F59E0B"}
                />
                <Text className="ml-1 text-sm font-inter-semibold dark:text-neutral-300 text-neutral-700">
                  {bookmarkedDiseases.length}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              className="p-2"
              onPress={() => setShowComparison(true)}
            >
              <FontAwesome
                name="exchange"
                size={20}
                color={isDark ? "#fff" : "#000"}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <DiseaseSearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          isDarkMode={isDark}
          onClear={() => setSearchQuery("")}
          diseases={diseasesData.filter(d => d.Disease)}
        />

        {/* Category Filter */}
        <DiseaseCategoryFilter
          categories={{...categorizedDiseases, "Bookmarks": bookmarkedDiseases}}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          isDarkMode={isDark}
        />

        {/* Sort Options */}
        <View className="flex-row items-center mt-3">
          <Text className="font-inter-semibold mr-2 dark:text-white text-black">Sort by:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {["name", "severity", "species"].map((option) => (
              <TouchableOpacity
                key={option}
                className={`px-3 py-1 rounded-full mr-2 ${sortBy === option ? (isDark ? 'bg-neutral-700' : 'bg-neutral-800') : (isDark ? 'bg-neutral-800' : 'bg-neutral-200')}`}
                onPress={() => setSortBy(option)}
              >
                <Text className={`text-sm font-inter-semibold ${sortBy === option ? (isDark ? 'text-white' : 'text-white') : (isDark ? 'text-neutral-300' : 'text-neutral-700')}`}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Disease List */}
      <View className="flex-1 px-4 py-3">
        <DiseaseList
          diseases={selectedCategory === "Bookmarks" ? bookmarkedDiseases : sortedDiseases}
          selectedDisease={selectedDisease}
          onSelectDisease={setSelectedDisease}
          isDarkMode={isDark}
          onClearFilters={handleClearFilters}
          selectedCategory={selectedCategory}
          searchQuery={searchQuery}
        />
      </View>

      {/* Disease Detail Modal */}
      <Modal
        visible={!!selectedDisease}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedDisease(null)}
      >
        <DiseaseDetailModal
          visible={!!selectedDisease}
          disease={selectedDisease}
          isDarkMode={isDark}
          onClose={() => setSelectedDisease(null)}
          isBookmarked={selectedDisease ? bookmarkedDiseases.some(d => d.Disease === selectedDisease.Disease) : false}
          onBookmarkPress={() => selectedDisease && toggleBookmark(selectedDisease)}
        />
      </Modal>

      {/* Disease Comparison Modal */}
      <Modal
        visible={showComparison}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowComparison(false)}
      >
        <DiseaseComparison
          diseases={diseasesData.filter(d => d.Disease)}
          isDarkMode={isDark}
          onClose={() => setShowComparison(false)}
        />
      </Modal>
      
      <TutorialOverlay steps={diseaseInfoTutorialSteps} tutorialId="diseaseInfo" />
    </SafeAreaView>
  );
};

export default DiseasesInformationScreen;
