import React from 'react';
import { View, Text, Image } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

const MessageItem = ({ 
  item, 
  user, 
  formatTime, 
  getMessageStatusIcon 
}) => {
  const isCurrentUser = item.sender_id === user.id;
  const messageTime = formatTime(item.created_at);
  const isTempMessage = item.id.toString().startsWith('temp_');

  return (
    <View className={`mb-3 flex-row ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
      <View className={`max-w-[80%] ${isCurrentUser ? 'bg-black dark:bg-white rounded-2xl rounded-br-none' : 'bg-white dark:bg-neutral-800 border border-black dark:border-neutral-700 rounded-2xl rounded-bl-none'}`}>
        {item.image_url && (
          <Image 
            source={{ uri: item.image_url }} 
            className="w-full h-48 rounded-t-2xl" 
            resizeMode="cover" 
          />
        )}
        {item.content ? (
          <View className="p-3">
            <Text className={`text-base font-inter ${isCurrentUser ? 'text-white dark:text-black' : 'text-black dark:text-white'}`}>{item.content}</Text>
            <View className={`flex-row items-center justify-end mt-1 ${isCurrentUser ? 'text-neutral-300 dark:text-neutral-600' : 'text-neutral-500 dark:text-neutral-400'}`}>
              <Text className={`text-xs ${isCurrentUser ? 'text-neutral-300 dark:text-neutral-600' : 'text-neutral-500 dark:text-neutral-400'}`}>
                {messageTime}
              </Text>
              {isCurrentUser && !isTempMessage && (
                <View className="ml-1">
                  {getMessageStatusIcon(item.id)}
                </View>
              )}
            </View>
          </View>
        ) : (
          <View className="p-3">
            <View className={`flex-row items-center justify-end mt-1 ${isCurrentUser ? 'text-neutral-300 dark:text-neutral-600' : 'text-neutral-500 dark:text-neutral-400'}`}>
              <Text className={`text-xs ${isCurrentUser ? 'text-neutral-300 dark:text-neutral-600' : 'text-neutral-500 dark:text-neutral-400'}`}>
                {messageTime}
              </Text>
              {isCurrentUser && !isTempMessage && (
                <View className="ml-1">
                  {getMessageStatusIcon(item.id)}
                </View>
              )}
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

export default MessageItem;