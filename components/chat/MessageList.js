import React, { useCallback } from 'react';
import { FlatList, View } from 'react-native';
import MessageItem from './MessageItem';

const MessageList = ({ 
  messages, 
  user, 
  formatTime, 
  getMessageStatusIcon, 
  onLongPressMessage 
}) => {
  const renderItem = useCallback(({ item }) => (
    <MessageItem 
      item={item} 
      user={user} 
      formatTime={formatTime} 
      getMessageStatusIcon={getMessageStatusIcon} 
      onLongPressMessage={onLongPressMessage}
    />
  ), [user, formatTime, getMessageStatusIcon, onLongPressMessage]);

  return (
    <FlatList
      data={messages}
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderItem}
      className="flex-1"
      contentContainerStyle={{ padding: 16 }}
    />
  );
};

export default React.memo(MessageList);