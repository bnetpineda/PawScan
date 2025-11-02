export const getRelativeTime = (date) => {
  const now = new Date();
  const messageDate = new Date(date);
  const diffInSeconds = Math.floor((now - messageDate) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} min${diffInMinutes > 1 ? 's' : ''} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  }
  
  if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  }
  
  // For older messages, show the actual date
  return messageDate.toLocaleDateString(undefined, { 
    month: 'short', 
    day: 'numeric',
    year: now.getFullYear() !== messageDate.getFullYear() ? 'numeric' : undefined
  });
};

export const formatTimeAgo = (timestamp) => {
  const now = new Date();
  const postTime = new Date(timestamp);
  const secondsAgo = Math.floor((now - postTime) / 1000);

  if (secondsAgo < 60) return "Just now";
  if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)}m ago`;
  if (secondsAgo < 86400) return `${Math.floor(secondsAgo / 3600)}h ago`;
  if (secondsAgo < 604800) return `${Math.floor(secondsAgo / 86400)}d ago`;
  
  return postTime.toLocaleDateString();
};

export const formatFullDateTime = (timestamp) => {
  const postTime = new Date(timestamp);
  const dateOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  const timeOptions = {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  };

  const date = postTime.toLocaleDateString("en-US", dateOptions);
  const time = postTime.toLocaleTimeString("en-US", timeOptions);
  const timeAgo = formatTimeAgo(timestamp);

  return `${date}   ${time}  ${timeAgo}`;
};

export const formatUnreadCount = (count) => {
  if (count > 99) return '99+';
  return count.toString();
};
