import { Modal, TouchableOpacity, View, Image, Dimensions } from "react-native";
import { FontAwesome } from "@expo/vector-icons";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const ImageModal = ({ visible, onClose, imageUrl }) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black bg-opacity-90 justify-center items-center">
        <TouchableOpacity
          className="absolute top-12 right-4 z-10 w-10 h-10 rounded-full bg-black bg-opacity-50 justify-center items-center"
          onPress={onClose}
        >
          <FontAwesome name="times" size={20} color="white" />
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-1 justify-center items-center w-full"
          onPress={onClose}
          activeOpacity={1}
        >
          {imageUrl && (
            <Image
              source={{ uri: imageUrl }}
              style={{
                width: screenWidth,
                height: screenHeight * 0.8,
              }}
              resizeMode="contain"
            />
          )}
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

export default ImageModal;