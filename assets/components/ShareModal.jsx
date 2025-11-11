import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import * as Haptics from 'expo-haptics';

export default function ShareModal({
  visible,
  onClose,
  petName,
  setPetName,
  isAnonymous,
  setIsAnonymous,
  isSharing,
  onShare,
  isDark,
  COLORS,
}) {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.9);
      opacityAnim.setValue(0);
      slideAnim.setValue(50);
    }
  }, [visible]);

  const handleHapticPress = async (callback) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    callback();
  };

  const handleToggleAnonymous = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}
    setIsAnonymous(!isAnonymous);
  };

  const handleClose = () => {
    Keyboard.dismiss();
    handleHapticPress(onClose);
  };

  const handleShare = () => {
    Keyboard.dismiss();
    handleHapticPress(onShare);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <TouchableWithoutFeedback onPress={handleClose}>
          <Animated.View 
            className="flex-1 justify-end bg-black/60"
            style={{ opacity: opacityAnim }}
          >
            <TouchableWithoutFeedback>
              <Animated.View
                className="bg-white dark:bg-zinc-900 rounded-t-3xl p-6 border-t border-zinc-200 dark:border-zinc-800"
                style={{
                  transform: [
                    { scale: scaleAnim },
                    { translateY: slideAnim }
                  ],
                }}
              >
                {/* Header */}
                <View className="flex-row items-center justify-between mb-6">
                  <View className="flex-1">
                    <Text className="text-xl font-inter-bold text-zinc-900 dark:text-zinc-100">
                      Share to Newsfeed
                    </Text>
                    <Text className="text-xs font-inter-regular text-zinc-500 dark:text-zinc-500 mt-1">
                      Let others see your pet analysis
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={handleClose}
                    className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 items-center justify-center"
                    disabled={isSharing}
                    activeOpacity={0.7}
                  >
                    <FontAwesome
                      name="times"
                      size={16}
                      color={isDark ? "#fafafa" : "#09090b"}
                    />
                  </TouchableOpacity>
                </View>

                {/* Pet Name Input */}
                <View className="mb-4">
                  <Text className="text-sm font-inter-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Pet Name
                    <Text className="text-zinc-500 dark:text-zinc-500 font-inter-regular"> (Optional)</Text>
                  </Text>
                  <View className="relative">
                    <TextInput
                      className="border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 rounded-lg px-4 py-3 font-inter-regular text-sm text-zinc-900 dark:text-zinc-100"
                      placeholder="e.g., Buddy, Max, Luna..."
                      placeholderTextColor={isDark ? "#71717a" : "#a1a1aa"}
                      value={petName}
                      onChangeText={setPetName}
                      maxLength={50}
                      editable={!isSharing}
                      autoCapitalize="words"
                      returnKeyType="done"
                    />
                  </View>
                </View>

                {/* Anonymous Toggle */}
                <TouchableOpacity
                  className="flex-row items-center p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 mb-6"
                  onPress={handleToggleAnonymous}
                  disabled={isSharing}
                  activeOpacity={0.7}
                >
                  <View className="w-5 h-5 items-center justify-center">
                    <FontAwesome
                      name={isAnonymous ? "check-square" : "square-o"}
                      size={20}
                      color={isDark ? "#fafafa" : "#09090b"}
                    />
                  </View>
                  <View className="flex-1 ml-3">
                    <Text className="font-inter-medium text-sm text-zinc-900 dark:text-zinc-100">
                      Share anonymously
                    </Text>
                    <Text className="font-inter-regular text-xs text-zinc-500 dark:text-zinc-500 mt-0.5">
                      Your name won't be visible to others
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Action Buttons */}
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    className="flex-1 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 py-3.5 rounded-lg"
                    onPress={handleClose}
                    disabled={isSharing}
                    activeOpacity={0.7}
                  >
                    <Text className="text-center text-zinc-900 dark:text-zinc-100 font-inter-semibold text-sm">
                      Cancel
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className={`flex-1 py-3.5 rounded-lg ${
                      isSharing 
                        ? 'bg-zinc-400 dark:bg-zinc-600' 
                        : 'bg-zinc-900 dark:bg-zinc-100'
                    }`}
                    onPress={handleShare}
                    disabled={isSharing}
                    activeOpacity={0.7}
                  >
                    {isSharing ? (
                      <View className="flex-row items-center justify-center gap-2">
                        <ActivityIndicator size="small" color={isDark ? "#09090b" : "#fafafa"} />
                        <Text className="text-center text-zinc-100 dark:text-zinc-900 font-inter-semibold text-sm">
                          Sharing...
                        </Text>
                      </View>
                    ) : (
                      <View className="flex-row items-center justify-center gap-2">
                        <FontAwesome
                          name="send"
                          size={14}
                          color={isDark ? "#09090b" : "#fafafa"}
                        />
                        <Text className="text-center text-zinc-100 dark:text-zinc-900 font-inter-semibold text-sm">
                          Share
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </TouchableWithoutFeedback>
          </Animated.View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}
