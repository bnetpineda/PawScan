import { FontAwesome } from "@expo/vector-icons";
import { TouchableOpacity, Text, View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DetailSection from "./DetailSection";

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

const DiseaseDetailModal = ({ visible, disease, isDarkMode, onClose }) => {
  return (
    <SafeAreaView
      className="flex-1 bg-white dark:bg-black"
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View
        className="flex-row items-center justify-between p-4 border-b dark:border-gray-800 border-gray-200"
      >
        <Text
          className="text-xl font-inter-bold flex-1 dark:text-white text-black"
        >
          {disease?.Disease}
        </Text>
        <TouchableOpacity
          onPress={onClose}
          className="p-2"
        >
          <FontAwesome
            name={ICONS.close}
            size={20}
            color={isDarkMode ? "#fff" : "#000"}
          />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 p-4">
        <DetailSection
          title="Overview"
          content={disease?.Overview}
          icon={ICONS.info}
          color="green"
          isDarkMode={isDarkMode}
        />

        <DetailSection
          title="Symptoms"
          content={disease?.Symptoms}
          icon={ICONS.alert}
          color="orange"
          isDarkMode={isDarkMode}
        />

        <DetailSection
          title="Causes"
          content={disease?.Causes}
          icon={ICONS.stethoscope}
          color="purple"
          isDarkMode={isDarkMode}
        />

        <DetailSection
          title="Prevention Tips"
          content={disease?.["Prevention Tips"]}
          icon={ICONS.shield}
          color="green"
          isDarkMode={isDarkMode}
        />

        <DetailSection
          title="Treatment & Protocols"
          content={disease?.["Approved Treatment and Protocols"]}
          icon={ICONS.stethoscope}
          color="purple"
          isDarkMode={isDarkMode}
        />

        {disease?.["Feline vs Canine"] && (
          <View
            className="p-4 rounded-xl mb-6 dark:bg-gray-900 bg-gray-100"
          >
            <View className="flex-row items-center mb-2">
              <FontAwesome 
                name={ICONS.paw} 
                size={16} 
                color={isDarkMode ? "#fff" : "#000"} 
              />
              <Text
                className="ml-2 font-inter-semibold mb-2 dark:text-gray-300 text-gray-700"
              >
                Species Comparison
              </Text>
            </View>
            <Text
              className="text-base font-inter dark:text-gray-300 text-gray-700"
            >
              {disease["Feline vs Canine"]}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default DiseaseDetailModal;