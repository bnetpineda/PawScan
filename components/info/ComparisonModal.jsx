import { View, Text, Modal, TouchableOpacity, ScrollView } from "react-native";
import { FontAwesome } from "@expo/vector-icons";

const ComparisonModal = ({ visible, disease1, disease2, onClose, isDarkMode }) => {
  if (!disease1 || !disease2) return null;

  const comparisonFields = [
    { label: "Overview", field: "Overview" },
    { label: "Symptoms", field: "Symptoms" },
    { label: "Causes", field: "Causes" },
    { label: "Severity", field: "Severity" },
    { label: "When to See a Vet", field: "When to See a Vet" },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-white dark:bg-black p-4">
        <View className="flex-row items-center justify-between mb-4 mt-2">
          <Text className="text-2xl font-inter-bold dark:text-white text-black">
            Comparison
          </Text>
          <TouchableOpacity onPress={onClose}>
            <FontAwesome 
              name="close" 
              size={24} 
              color={isDarkMode ? "#fff" : "#000"} 
            />
          </TouchableOpacity>
        </View>

        {/* Disease headers */}
        <View className="flex-row mb-6">
          <View className="flex-1 pr-2">
            <Text className="text-lg font-inter-bold dark:text-blue-400 text-blue-600 text-center">
              {disease1.Disease}
            </Text>
          </View>
          <View className="w-px bg-neutral-300 dark:bg-neutral-700 mx-2" />
          <View className="flex-1 pl-2">
            <Text className="text-lg font-inter-bold dark:text-blue-400 text-blue-600 text-center">
              {disease2.Disease}
            </Text>
          </View>
        </View>

        <ScrollView>
          {comparisonFields.map((field, index) => (
            <View key={index} className="mb-6">
              <Text className="text-lg font-inter-semibold mb-2 dark:text-white text-black text-center">
                {field.label}
              </Text>
              <View className="flex-row">
                <View className="flex-1 pr-2">
                  <Text className="text-base font-inter dark:text-neutral-300 text-neutral-700">
                    {disease1[field.field] || "N/A"}
                  </Text>
                </View>
                <View className="w-px bg-neutral-300 dark:bg-neutral-700 mx-2" />
                <View className="flex-1 pl-2">
                  <Text className="text-base font-inter dark:text-neutral-300 text-neutral-700">
                    {disease2[field.field] || "N/A"}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
        
        {/* Close button at the bottom for better UX */}
        <TouchableOpacity 
          className="mt-4 py-3 rounded-full bg-blue-500 dark:bg-blue-600 items-center"
          onPress={onClose}
        >
          <Text className="text-white font-inter-bold text-base">
            Close Comparison
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

export default ComparisonModal;