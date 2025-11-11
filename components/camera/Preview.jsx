import {
    Text,
    TouchableOpacity,
    View,
    ScrollView,
    ActivityIndicator,
    Image,
    useColorScheme,
    Animated,
    Alert,
  } from "react-native";
  import { SafeAreaView } from "react-native-safe-area-context";
  import { FontAwesome } from "@expo/vector-icons";
  import * as Clipboard from 'expo-clipboard';
  import * as Haptics from 'expo-haptics';
  import { useState, useRef, useEffect } from 'react';
  
  const COLORS = {
    primary: "#09090b",
    primaryHover: "#18181b",
    background: "#ffffff",
    backgroundDark: "#09090b",
    card: "#ffffff",
    cardDark: "#18181b",
    border: "#e4e4e7",
    borderDark: "#27272a",
    text: "#09090b",
    textDark: "#fafafa",
    textMuted: "#71717a",
    textMutedDark: "#a1a1aa",
    accent: "#f4f4f5",
    accentDark: "#27272a",
  };
  
  export default function Preview({ 
    imageUri, 
    isLoading, 
    analysisResult, 
    currentAnalysisId,
    onRetake,
    onChooseNew,
    onSharePress,
    error,
    analysisMetadata
  }) {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === "dark";
    const [isExpanded, setIsExpanded] = useState(true);
    const [copied, setCopied] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

    useEffect(() => {
      if (analysisResult) {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }),
        ]).start();
      }
    }, [analysisResult]);

    const handleButtonPress = async (callback) => {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {
        // Haptics not available
      }
      callback();
    };

    const handleCopyToClipboard = async () => {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {}
      
      await Clipboard.setStringAsync(analysisResult);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    const toggleExpanded = async () => {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {}
      setIsExpanded(!isExpanded);
    };
  
    if (isLoading) {
      return (
        <View className="flex-1 justify-center items-center bg-white dark:bg-zinc-950">
          <View className="items-center gap-4 px-8">
            <ActivityIndicator
              size="large"
              color={isDark ? COLORS.textDark : COLORS.primary}
            />
            <View className="items-center gap-2">
              <Text className="text-center text-sm font-inter-semibold text-zinc-900 dark:text-zinc-100">
                Analyzing image...
              </Text>
              <Text className="text-center text-xs font-inter-regular text-zinc-500 dark:text-zinc-500">
                Using AI to identify your pet
              </Text>
            </View>
          </View>
        </View>
      );
    }
  
    if (!imageUri) {
      return null;
    }

    if (error) {
      return (
        <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950">
          <View className="flex-1 justify-center items-center px-8">
            <View className="items-center gap-4 max-w-sm">
              <View className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950 items-center justify-center">
                <FontAwesome name="exclamation-circle" size={32} color={isDark ? "#fca5a5" : "#dc2626"} />
              </View>
              <View className="items-center gap-2">
                <Text className="text-center text-lg font-inter-semibold text-zinc-900 dark:text-zinc-100">
                  Analysis Failed
                </Text>
                <Text className="text-center text-sm font-inter-regular text-zinc-600 dark:text-zinc-400 leading-5">
                  {error}
                </Text>
              </View>
              <View className="flex-row gap-3 mt-4">
                <TouchableOpacity
                  onPress={() => handleButtonPress(onRetake)}
                  className="flex-1 flex-row items-center justify-center bg-zinc-900 dark:bg-zinc-100 rounded-lg py-3 px-6"
                  activeOpacity={0.7}
                >
                  <FontAwesome
                    name="camera"
                    size={16}
                    color={isDark ? COLORS.text : COLORS.textDark}
                  />
                  <Text className="font-inter-semibold text-sm ml-2 text-zinc-100 dark:text-zinc-900">
                    Try Again
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </SafeAreaView>
      );
    }
  
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950">
        <ScrollView 
          className="flex-1"
          contentContainerClassName="pb-8"
          showsVerticalScrollIndicator={false}
        >
        {/* Image Section */}
        <View className="items-center px-6 pt-6">
          <View className="w-full max-w-md aspect-square bg-zinc-100 dark:bg-zinc-900 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <Image
              source={{ uri: imageUri }}
              className="w-full h-full"
              resizeMode="contain"
            />
          </View>
          
          {/* Metadata */}
          {analysisMetadata && (
            <View className="flex-row items-center gap-4 mt-3">
              {analysisMetadata.timestamp && (
                <View className="flex-row items-center gap-1">
                  <FontAwesome name="clock-o" size={12} color={isDark ? COLORS.textMutedDark : COLORS.textMuted} />
                  <Text className="text-xs font-inter-regular text-zinc-500 dark:text-zinc-500">
                    {new Date(analysisMetadata.timestamp).toLocaleTimeString()}
                  </Text>
                </View>
              )}
              {analysisMetadata.confidence && (
                <View className="flex-row items-center gap-1">
                  <FontAwesome name="check-circle" size={12} color={isDark ? COLORS.textMutedDark : COLORS.textMuted} />
                  <Text className="text-xs font-inter-regular text-zinc-500 dark:text-zinc-500">
                    {Math.round(analysisMetadata.confidence * 100)}% confidence
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
  
          {/* Action Buttons Section */}
          <View className="px-6 mt-6">
            <View className="flex-row justify-center gap-3">
            <TouchableOpacity
              onPress={() => handleButtonPress(onRetake)}
              className="flex-1 max-w-[150px] flex-row items-center justify-center bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg py-3 px-4"
              activeOpacity={0.7}
            >
              <FontAwesome
                name="camera"
                size={16}
                color={isDark ? COLORS.textDark : COLORS.text}
              />
              <Text className="font-inter-semibold text-sm ml-2 text-zinc-900 dark:text-zinc-100">
                Retake
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleButtonPress(onChooseNew)}
              className="flex-1 max-w-[150px] flex-row items-center justify-center bg-zinc-900 dark:bg-zinc-100 rounded-lg py-3 px-4"
              activeOpacity={0.7}
            >
              <FontAwesome
                name="image"
                size={16}
                color={isDark ? COLORS.text : COLORS.textDark}
              />
              <Text className="font-inter-semibold text-sm ml-2 text-zinc-100 dark:text-zinc-900">
                Choose New
              </Text>
            </TouchableOpacity>
            </View>
          </View>
  
        {/* Analysis Result Section */}
        {analysisResult && (
          <Animated.View 
            className="px-6 mt-6"
            style={{
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            }}
          >
            <View className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              {/* Header with expand/collapse */}
              <TouchableOpacity
                onPress={toggleExpanded}
                className="px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex-row items-center justify-between"
                activeOpacity={0.7}
              >
                <Text className="font-inter-semibold text-zinc-900 dark:text-zinc-100 text-sm">
                  Analysis Result
                </Text>
                <FontAwesome 
                  name={isExpanded ? "chevron-up" : "chevron-down"} 
                  size={14} 
                  color={isDark ? COLORS.textMutedDark : COLORS.textMuted} 
                />
              </TouchableOpacity>
              
              {/* Content */}
              {isExpanded && (
                <View className="p-4">
                  <Text className="text-zinc-700 dark:text-zinc-300 font-inter-regular text-sm leading-6">
                    {analysisResult}
                  </Text>
                  
                  {/* Action buttons */}
                  <View className="flex-row gap-2 mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                    <TouchableOpacity
                      onPress={handleCopyToClipboard}
                      className="flex-1 flex-row items-center justify-center bg-zinc-100 dark:bg-zinc-800 rounded-lg py-2.5 px-3"
                      activeOpacity={0.7}
                    >
                      <FontAwesome
                        name={copied ? "check" : "copy"}
                        size={14}
                        color={copied ? (isDark ? "#86efac" : "#16a34a") : (isDark ? COLORS.textDark : COLORS.text)}
                      />
                      <Text className={`font-inter-medium text-xs ml-2 ${copied ? "text-green-600 dark:text-green-400" : "text-zinc-900 dark:text-zinc-100"}`}>
                        {copied ? "Copied!" : "Copy"}
                      </Text>
                    </TouchableOpacity>
                    
                    {currentAnalysisId && (
                      <TouchableOpacity
                        onPress={() => handleButtonPress(onSharePress)}
                        className="flex-1 flex-row items-center justify-center bg-zinc-900 dark:bg-zinc-100 rounded-lg py-2.5 px-3"
                        activeOpacity={0.7}
                      >
                        <FontAwesome
                          name="share-alt"
                          size={14}
                          color={isDark ? COLORS.text : COLORS.textDark}
                        />
                        <Text className="font-inter-medium text-xs ml-2 text-zinc-100 dark:text-zinc-900">
                          Share
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}
            </View>
          </Animated.View>
        )}
        </ScrollView>
      </SafeAreaView>
    );
  }
