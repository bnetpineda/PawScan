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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import diseasesData from "../assets/diseases_information.json";
import DiseaseCard from "../components/info/DiseaseCard";
import DetailSection from "../components/info/DetailSection";
import DiseaseDetailModal from "../components/info/DiseaseDetailModal";
import DiseaseSearchBar from "../components/info/DiseaseSearchBar";
import DiseaseCategoryFilter from "../components/info/DiseaseCategoryFilter";
import DiseaseList from "../components/info/DiseaseList";

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
  const isDark = useColorScheme() === "dark";

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDisease, setSelectedDisease] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All");

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

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All");
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
        className="px-4 py-3 border-b dark:border-gray-800 border-gray-200"
      >
        <View className="flex-row items-center justify-between mb-3">
          <Text
            className="text-2xl font-inter-bold dark:text-white text-black"
          >
            Disease Information
          </Text>
        </View>

        {/* Search Bar */}
        <DiseaseSearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          isDarkMode={isDark}
          onClear={() => setSearchQuery("")}
        />

        {/* Category Filter */}
        <DiseaseCategoryFilter
          categories={categorizedDiseases}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          isDarkMode={isDark}
        />
      </View>

      {/* Disease List */}
      <View className="flex-1 px-4 py-3">
        <DiseaseList
          diseases={filteredDiseases}
          selectedDisease={selectedDisease}
          onSelectDisease={setSelectedDisease}
          isDarkMode={isDark}
          onClearFilters={handleClearFilters}
          selectedCategory={selectedCategory}
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
        />
      </Modal>
    </SafeAreaView>
  );
};

export default DiseasesInformationScreen;
