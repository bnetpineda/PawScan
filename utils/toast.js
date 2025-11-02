import { Alert } from "react-native";

// Simple toast utility - can be replaced with a proper toast library like react-native-toast-message
export const toast = {
  success: (message, title = "Success") => {
    Alert.alert(title, message);
  },
  error: (message, title = "Error") => {
    Alert.alert(title, message);
  },
  info: (message, title = "Info") => {
    Alert.alert(title, message);
  },
  warning: (message, title = "Warning") => {
    Alert.alert(title, message);
  },
};

export const showToast = (type, message, title) => {
  if (toast[type]) {
    toast[type](message, title);
  } else {
    toast.info(message, title);
  }
};
