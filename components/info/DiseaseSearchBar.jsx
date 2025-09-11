import { FontAwesome } from "@expo/vector-icons";
import { View, TextInput, TouchableOpacity } from "react-native";
import SearchSuggestions from "./SearchSuggestions";
import { useState, useMemo } from "react";

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

const DiseaseSearchBar = ({ searchQuery, onSearchChange, isDarkMode, onClear, diseases }) => {
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Generate search suggestions based on diseases
  const suggestions = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];
    
    const query = searchQuery.toLowerCase();
    const allTerms = new Set();
    
    diseases.forEach(disease => {
      // Add disease names
      if (disease.Disease && disease.Disease.toLowerCase().includes(query)) {
        allTerms.add(disease.Disease);
      }
      
      // Add tags
      if (disease.Tags) {
        disease.Tags.forEach(tag => {
          if (tag.toLowerCase().includes(query)) {
            allTerms.add(tag);
          }
        });
      }
      
      // Add symptoms keywords
      if (disease.Symptoms) {
        const symptoms = disease.Symptoms.toLowerCase().split(/[;,]/);
        symptoms.forEach(symptom => {
          if (symptom.includes(query)) {
            allTerms.add(symptom.trim());
          }
        });
      }
    });
    
    return Array.from(allTerms).slice(0, 5);
  }, [searchQuery, diseases]);

  const handleFocus = () => {
    setShowSuggestions(true);
  };

  const handleBlur = () => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => setShowSuggestions(false), 150);
  };

  return (
    <View className="relative">
      <View
        className="flex-row items-center px-4 py-3 rounded-xl dark:bg-gray-900 bg-white mb-3 border border-gray-200 dark:border-gray-800"
      >
        <FontAwesome
          name={ICONS.search}
          size={20}
          color={isDarkMode ? "#fff" : "#000"}
        />
        <TextInput
          className="flex-1 ml-3 text-base font-inter dark:text-white text-black"
          placeholder="Search diseases, symptoms, tags..."
          placeholderTextColor={isDarkMode ? "#8E8E93" : "#6C757D"}
          value={searchQuery}
          onChangeText={onSearchChange}
          returnKeyType="search"
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={onClear}>
            <FontAwesome
              name={ICONS.close}
              size={20}
              color={isDarkMode ? "#fff" : "#000"}
            />
          </TouchableOpacity>
        )}
      </View>
      
      {showSuggestions && suggestions.length > 0 && (
        <SearchSuggestions 
          suggestions={suggestions}
          isDarkMode={isDarkMode}
          onSuggestionPress={(suggestion) => {
            onSearchChange(suggestion);
            setShowSuggestions(false);
          }}
        />
      )}
    </View>
  );
};

export default DiseaseSearchBar;