/**
 * Utility functions shared between chat components
 */

/**
 * Format timestamp for chat conversations
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted time string
 */
export const formatChatTime = (dateString) => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) return '';
    
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInDays === 1) {
      return "Yesterday";
    } else if (diffInDays < 7) {
      return date.toLocaleDateString([], { weekday: "long" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  } catch (error) {
    console.error("Error formatting time:", error);
    return '';
  }
};

/**
 * Get initials for avatar fallback
 * @param {string} name - Person's name
 * @returns {string} Initials (max 2 characters)
 */
export const getInitials = (name) => {
  if (!name) return "U";
  return name
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase()
    .substring(0, 2);
};

/**
 * Debounce function for search input
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Filter conversations based on search query
 * @param {Array} conversations - Array of conversation objects
 * @param {string} searchQuery - Search query string
 * @param {string} searchType - 'user' or 'vet' to determine search fields
 * @returns {Array} Filtered conversations
 */
export const filterConversations = (conversations, searchQuery, searchType = 'user') => {
  if (!searchQuery?.trim()) return conversations;
  
  const query = searchQuery.toLowerCase().trim();
  
  return conversations.filter(conversation => {
    if (searchType === 'user') {
      const vetName = conversation.vetName?.toLowerCase() || "";
      const latestMessage = conversation.latestMessage?.content?.toLowerCase() || "";
      return vetName.includes(query) || latestMessage.includes(query);
    } else {
      const userName = conversation.userName?.toLowerCase() || "";
      const latestMessage = conversation.latestMessage?.content?.toLowerCase() || "";
      return userName.includes(query) || latestMessage.includes(query);
    }
  });
};

/**
 * Filter veterinarians for new chat creation
 * @param {Array} veterinarians - Array of veterinarian objects
 * @param {Array} existingConversationVetIds - Array of vet IDs user already has conversations with
 * @param {string} searchQuery - Search query string
 * @returns {Array} Available veterinarians for new chats
 */
export const filterAvailableVeterinarians = (veterinarians, existingConversationVetIds, searchQuery) => {
  // Filter out veterinarians user already has conversations with
  const availableVets = veterinarians.filter(vet => 
    !existingConversationVetIds.includes(vet.id)
  );
  
  if (!searchQuery?.trim()) return availableVets;
  
  const query = searchQuery.toLowerCase().trim();
  
  return availableVets.filter(vet => {
    const vetName = vet.display_name?.toLowerCase() || "";
    return vetName.includes(query);
  });
};

/**
 * Create consistent conversation rendering data
 * @param {Object} conversation - Raw conversation data
 * @param {string} role - 'user' or 'vet'
 * @returns {Object} Formatted conversation object
 */
export const formatConversationData = (conversation, role = 'user') => {
  if (role === 'user') {
    return {
      id: conversation.id,
      partnerId: conversation.vet_id,
      partnerName: conversation.vetName || 'Veterinarian',
      profileImageUrl: conversation.profile_image_url,
      latestMessage: conversation.latestMessage,
      isRead: conversation.is_read || false,
      unreadCount: conversation.unread_count || 0
    };
  } else {
    return {
      id: conversation.id,
      partnerId: conversation.user_id,
      partnerName: conversation.userName || 'Pet Owner',
      profileImageUrl: conversation.profile_image_url,
      latestMessage: conversation.latestMessage,
      isRead: conversation.is_read || false,
      unreadCount: conversation.unread_count || 0
    };
  }
};

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum character length
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};
