import React from 'react';
import { Modal, View, Text, TouchableOpacity, useColorScheme } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export const IdleTimeoutWarning = ({ visible, remainingTime, onExtend }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View className="flex-1 bg-black/60 justify-center items-center px-6">
        <View className={`rounded-2xl p-6 w-full max-w-[340px] items-center border ${
          isDark ? 'bg-neutral-900 border-neutral-700' : 'bg-white border-neutral-300'
        }`}>
          <View className={`w-16 h-16 rounded-full justify-center items-center mb-4 ${
            isDark ? 'bg-amber-900/30' : 'bg-amber-100'
          }`}>
            <MaterialIcons 
              name="timer" 
              size={32} 
              color={isDark ? '#FCD34D' : '#D97706'} 
            />
          </View>
          
          <Text className={`text-xl font-inter-bold mb-3 text-center ${
            isDark ? 'text-white' : 'text-black'
          }`}>
            Session Expiring
          </Text>
          
          <Text className={`text-base font-inter text-center leading-6 mb-2 ${
            isDark ? 'text-neutral-400' : 'text-neutral-600'
          }`}>
            Your session will expire in{' '}
            <Text className="font-inter-bold text-red-500 text-lg">{remainingTime}</Text>
            {' '}seconds due to inactivity.
          </Text>
          
          <Text className={`text-sm font-inter text-center mb-6 ${
            isDark ? 'text-neutral-500' : 'text-neutral-500'
          }`}>
            Would you like to continue your session?
          </Text>

          <TouchableOpacity
            className="w-full py-3.5 rounded-xl bg-black items-center justify-center"
            onPress={onExtend}
            activeOpacity={0.7}
          >
            <Text className="text-base font-inter-semibold text-white">Continue Session</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default IdleTimeoutWarning;
