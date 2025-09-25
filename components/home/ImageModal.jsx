import { Modal, TouchableOpacity, View, Image, Dimensions, Alert } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const ImageModal = ({ visible, onClose, imageUrl }) => {
  const handleDownload = async () => {
    try {
      // Request media library permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please allow access to media library to save images.');
        return;
      }

      // Download the image to the device
      const filename = imageUrl.split('/').pop(); // Extract filename from URL
      const downloadResumable = FileSystem.createDownloadResumable(
        imageUrl,
        `${FileSystem.documentDirectory}${filename}`
      );

      const { uri } = await downloadResumable.downloadAsync();
      
      // Save to media library
      const asset = await MediaLibrary.createAssetAsync(uri);
      await MediaLibrary.createAlbumAsync('PawScan', asset, false);
      
      Alert.alert('Success', 'Image saved to your photos!');
    } catch (error) {
      console.error('Error downloading image:', error);
      Alert.alert('Error', 'Failed to download image. Please try again.');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black bg-opacity-90 justify-center items-center">
        <View className="absolute top-12 right-4 z-10 flex-row space-x-2">
          <TouchableOpacity
            className="w-10 h-10 rounded-full bg-black bg-opacity-50 justify-center items-center"
            onPress={handleDownload}
          >
            <FontAwesome name="download" size={20} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            className="w-10 h-10 rounded-full bg-black bg-opacity-50 justify-center items-center"
            onPress={onClose}
          >
            <FontAwesome name="times" size={20} color="white" />
          </TouchableOpacity>
        </View>

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