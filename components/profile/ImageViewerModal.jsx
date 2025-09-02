import { FontAwesome } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Modal,
  View,
  Image,
  TouchableOpacity,
  Text,
  Dimensions,
} from "react-native";

const ImageViewerModal = ({ visible, imageUrl, onClose }) => {
  const [imageLoading, setImageLoading] = useState(true);

  if (!imageUrl) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      onRequestClose={onClose}
      animationType="fade"
    >
      <View className="flex-1 bg-black/90">
        {/* Close button */}
        <TouchableOpacity
          className="absolute top-12 right-6 z-10 p-2 rounded-full bg-black/30"
          onPress={onClose}
        >
          <FontAwesome name="close" size={24} color="white" />
        </TouchableOpacity>

        {/* Loading indicator */}
        {imageLoading && (
          <View className="absolute inset-0 justify-center items-center">
            <Text className="text-white text-lg">Loading...</Text>
          </View>
        )}

        {/* Image */}
        <View className="flex-1 justify-center items-center">
          <Image
            source={{ uri: imageUrl }}
            className="w-full h-full"
            resizeMode="contain"
            onLoad={() => setImageLoading(false)}
            onError={() => setImageLoading(false)}
          />
        </View>
      </View>
    </Modal>
  );
};

export default ImageViewerModal;