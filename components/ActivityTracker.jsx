import React, { useRef } from 'react';
import { View, PanResponder } from 'react-native';

export const ActivityTracker = ({ children, onActivity, enabled = true }) => {
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => {
        if (enabled) {
          onActivity?.();
        }
        return false; // Don't capture the touch, just observe it
      },
      onMoveShouldSetPanResponder: () => false,
    })
  ).current;

  return (
    <View className="flex-1" {...panResponder.panHandlers}>
      {children}
    </View>
  );
};

export default ActivityTracker;
