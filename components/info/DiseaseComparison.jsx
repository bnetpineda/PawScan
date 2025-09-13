import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import ComparisonModal from "./ComparisonModal";

const DiseaseComparison = ({ diseases, isDarkMode, onClose }) => {
  const [selectedDiseases, setSelectedDiseases] = useState([]);
  const [showComparisonModal, setShowComparisonModal] = useState(false);

  const toggleDiseaseSelection = (disease) => {
    if (selectedDiseases.some(d => d.Disease === disease.Disease)) {
      setSelectedDiseases(selectedDiseases.filter(d => d.Disease !== disease.Disease));
    } else if (selectedDiseases.length < 2) {
      setSelectedDiseases([...selectedDiseases, disease]);
    } else {
      // Show alert when trying to select more than 2 diseases
      Alert.alert("Limit Reached", "You can only compare two diseases at a time.");
    }
  };

  // Show modal when exactly 2 diseases are selected
  if (selectedDiseases.length === 2 && !showComparisonModal) {
    setShowComparisonModal(true);
  }

  const closeComparisonModal = () => {
    setShowComparisonModal(false);
  };

  const clearSelection = () => {
    setSelectedDiseases([]);
    setShowComparisonModal(false);
  };

  return (
    <View className="flex-1 bg-white dark:bg-black p-4">
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-2xl font-inter-bold dark:text-white text-black">
          Compare Diseases
        </Text>
        <TouchableOpacity onPress={onClose}>
          <FontAwesome 
            name="close" 
            size={24} 
            color={isDarkMode ? "#fff" : "#000"} 
          />
        </TouchableOpacity>
      </View>

      <Text className="text-base font-inter mb-4 dark:text-gray-300 text-gray-700">
        Select two diseases to compare their characteristics
      </Text>

      <Text className="text-lg font-inter-semibold mb-2 dark:text-white text-black">
        Select Diseases:
      </Text>
      
      {/* Improved disease selection with better layout and visual feedback */}
      <View className="flex-row flex-wrap mb-4">
        {diseases.map((disease, index) => {
          const isSelected = selectedDiseases.some(d => d.Disease === disease.Disease);
          const isDisabled = selectedDiseases.length >= 2 && !isSelected;
          
          return (
            <TouchableOpacity
              key={index}
              className={`px-4 py-2 rounded-full mr-2 mb-2 ${
                isSelected
                  ? "dark:bg-blue-600 bg-blue-500"
                  : isDisabled
                  ? "dark:bg-gray-800 bg-gray-200 opacity-50"
                  : "dark:bg-gray-700 bg-gray-300"
              }`}
              onPress={() => toggleDiseaseSelection(disease)}
              disabled={isDisabled}
            >
              <Text
                className={`text-sm font-inter-semibold ${
                  isSelected
                    ? "dark:text-white text-white"
                    : isDisabled
                    ? "dark:text-gray-500 text-gray-400"
                    : "dark:text-gray-200 text-gray-700"
                }`}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {disease.Disease}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Selected diseases display with better styling */}
      {selectedDiseases.length > 0 && (
        <View className="mb-6">
          <Text className="text-lg font-inter-semibold mb-2 dark:text-white text-black">
            Selected for Comparison:
          </Text>
          <View className="flex-row flex-wrap">
            {selectedDiseases.map((disease, index) => (
              <View 
                key={index} 
                className="flex-row items-center px-4 py-2 rounded-full mr-2 mb-2 dark:bg-blue-600 bg-blue-500"
              >
                <Text className="text-sm font-inter-semibold dark:text-white text-white mr-2">
                  {disease.Disease}
                </Text>
                <TouchableOpacity onPress={() => toggleDiseaseSelection(disease)}>
                  <FontAwesome 
                    name="times" 
                    size={16} 
                    color="#fff" 
                  />
                </TouchableOpacity>
              </View>
            ))}
            {selectedDiseases.length < 2 && (
              <Text className="text-sm font-inter text-gray-500 dark:text-gray-400 self-center">
                Select {2 - selectedDiseases.length} more disease{2 - selectedDiseases.length > 1 ? 's' : ''}
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Comparison Modal */}
      <ComparisonModal
        visible={showComparisonModal}
        disease1={selectedDiseases[0]}
        disease2={selectedDiseases[1]}
        onClose={clearSelection}
        isDarkMode={isDarkMode}
      />
    </View>
  );
};

export default DiseaseComparison;