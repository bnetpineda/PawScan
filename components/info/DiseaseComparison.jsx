import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import DetailSection from "./DetailSection";

const DiseaseComparison = ({ diseases, isDarkMode, onClose }) => {
  const [selectedDiseases, setSelectedDiseases] = useState([]);

  const toggleDiseaseSelection = (disease) => {
    if (selectedDiseases.some(d => d.Disease === disease.Disease)) {
      setSelectedDiseases(selectedDiseases.filter(d => d.Disease !== disease.Disease));
    } else if (selectedDiseases.length < 2) {
      setSelectedDiseases([...selectedDiseases, disease]);
    }
  };

  const renderComparison = () => {
    if (selectedDiseases.length !== 2) return null;

    const [disease1, disease2] = selectedDiseases;

    const comparisonFields = [
      { label: "Overview", field: "Overview" },
      { label: "Symptoms", field: "Symptoms" },
      { label: "Causes", field: "Causes" },
      { label: "Severity", field: "Severity" },
      { label: "When to See a Vet", field: "When to See a Vet" },
    ];

    return (
      <View className="mt-6">
        <Text className="text-xl font-inter-bold mb-4 dark:text-white text-black">
          Comparison: {disease1.Disease} vs {disease2.Disease}
        </Text>

        {comparisonFields.map((field, index) => (
          <View key={index} className="mb-6">
            <Text className="text-lg font-inter-semibold mb-2 dark:text-white text-black">
              {field.label}
            </Text>
            <View className="flex-row">
              <View className="flex-1 pr-2">
                <Text className="text-base font-inter dark:text-gray-300 text-gray-700">
                  {disease1[field.field] || "N/A"}
                </Text>
              </View>
              <View className="w-px bg-gray-300 dark:bg-gray-700 mx-2" />
              <View className="flex-1 pl-2">
                <Text className="text-base font-inter dark:text-gray-300 text-gray-700">
                  {disease2[field.field] || "N/A"}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    );
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
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        className="mb-4"
      >
        {diseases.map((disease, index) => (
          <TouchableOpacity
            key={index}
            className={`px-4 py-2 rounded-full mr-2 mb-2 ${
              selectedDiseases.some(d => d.Disease === disease.Disease)
                ? "dark:bg-gray-700 bg-gray-800"
                : "dark:bg-gray-800 bg-gray-200"
            }`}
            onPress={() => toggleDiseaseSelection(disease)}
          >
            <Text
              className={`text-sm font-inter-semibold ${
                selectedDiseases.some(d => d.Disease === disease.Disease)
                  ? "dark:text-white text-white"
                  : "dark:text-gray-300 text-gray-700"
              }`}
            >
              {disease.Disease}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {selectedDiseases.length > 0 && (
        <View className="mb-4">
          <Text className="text-lg font-inter-semibold mb-2 dark:text-white text-black">
            Selected:
          </Text>
          <View className="flex-row flex-wrap">
            {selectedDiseases.map((disease, index) => (
              <View 
                key={index} 
                className="flex-row items-center px-3 py-1 rounded-full mr-2 mb-2 dark:bg-gray-700 bg-gray-800"
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
          </View>
        </View>
      )}

      {renderComparison()}
    </View>
  );
};

export default DiseaseComparison;