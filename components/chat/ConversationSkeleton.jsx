import { View } from "react-native";

const ConversationSkeleton = () => {
  return (
    <View className="flex-row items-center p-4 border-b border-neutral-200 dark:border-neutral-700">
      {/* Avatar Skeleton */}
      <View className="w-14 h-14 rounded-full bg-neutral-300 dark:bg-neutral-700" />
      
      <View className="flex-1 ml-3">
        {/* Name Skeleton */}
        <View className="h-5 w-32 bg-neutral-300 dark:bg-neutral-700 rounded mb-2" />
        
        {/* Message Skeleton */}
        <View className="h-4 w-48 bg-neutral-300 dark:bg-neutral-700 rounded" />
      </View>
      
      {/* Time Skeleton */}
      <View className="h-3 w-12 bg-neutral-300 dark:bg-neutral-700 rounded" />
    </View>
  );
};

export default ConversationSkeleton;
