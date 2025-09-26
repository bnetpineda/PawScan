import React from 'react';
import { View, TextInput, TouchableOpacity, useColorScheme } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

const MessageInput = ({ 
  newMessage, 
  setNewMessage, 
  onSend, 
  onAttachment, 
  isSending,
  handleInputChange 
}) => {
  const isDark = useColorScheme() === 'dark';

  return (
    <View className="flex-row p-4 bg-white border-t border-black dark:bg-neutral-900 dark:border-neutral-700">
      <TouchableOpacity 
        className="justify-center mr-2"
        onPress={onAttachment}
      >
        <FontAwesome name="plus-circle" size={24} color={isDark ? "#fff" : "#000"} />
      </TouchableOpacity>
      <TextInput
        value={newMessage}
        onChangeText={handleInputChange}
        placeholder="Type a message..."
        placeholderTextColor={isDark ? "#8E8E93" : "#6C757D"}
        className="flex-1 border border-black dark:border-neutral-700 rounded-full py-2 px-4 max-h-[100px] text-base font-inter bg-white dark:bg-neutral-800 text-black dark:text-white"
        multiline
        maxLength={1000}
      />
      <TouchableOpacity 
        onPress={onSend}
        className={`rounded-full w-10 h-10 justify-center items-center ml-2 ${!newMessage.trim() ? 'bg-neutral-400' : 'bg-black dark:bg-white'}`}
        disabled={!newMessage.trim()}
        activeOpacity={0.8}
      >
        <FontAwesome name="send" size={16} color={isDark ? "#000" : "#fff"} />
      </TouchableOpacity>
    </View>
  );
};

export default MessageInput;