import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { FontAwesome } from "@expo/vector-icons";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 items-center justify-center bg-white dark:bg-black p-4">
          <FontAwesome name="exclamation-triangle" size={48} color="#EF4444" />
          <Text className="text-xl font-inter-bold text-black dark:text-white mt-4">
            Something went wrong
          </Text>
          <Text className="text-neutral-600 dark:text-neutral-400 text-center mt-2 font-inter">
            {this.state.error?.message || "An unexpected error occurred"}
          </Text>
          <TouchableOpacity
            onPress={this.handleReset}
            className="mt-6 px-6 py-3 bg-blue-500 rounded-lg"
          >
            <Text className="text-white font-inter-semibold">Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
