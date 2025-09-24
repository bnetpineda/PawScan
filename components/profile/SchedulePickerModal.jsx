import { FontAwesome } from "@expo/vector-icons";
import { useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePicker from '@react-native-community/datetimepicker';

const SchedulePickerModal = ({ visible, onClose, onSave, isDark }) => {
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedStartTime, setSelectedStartTime] = useState(new Date());
  const [selectedEndTime, setSelectedEndTime] = useState(new Date());
  const [dayPickerVisible, setDayPickerVisible] = useState(false);
  const [startTimePickerVisible, setStartTimePickerVisible] = useState(false);
  const [endTimePickerVisible, setEndTimePickerVisible] = useState(false);

  const days = [
    { key: 'Sunday', value: 'Sunday' },
    { key: 'Monday', value: 'Monday' },
    { key: 'Tuesday', value: 'Tuesday' },
    { key: 'Wednesday', value: 'Wednesday' },
    { key: 'Thursday', value: 'Thursday' },
    { key: 'Friday', value: 'Friday' },
    { key: 'Saturday', value: 'Saturday' },
  ];

  const handleSave = () => {
    if (!selectedDay || !selectedStartTime || !selectedEndTime) {
      Alert.alert("Error", "Please select a day and both start and end times.");
      return;
    }

    // Check if end time is after start time
    if (selectedEndTime <= selectedStartTime) {
      Alert.alert("Error", "End time must be after start time.");
      return;
    }

    const scheduleData = {
      day: selectedDay,
      startTime: selectedStartTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      endTime: selectedEndTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      time: `${selectedStartTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - ${selectedEndTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
    };

    onSave(scheduleData);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setSelectedDay("");
    setSelectedStartTime(new Date());
    setSelectedEndTime(new Date());
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
    >
      <View className="flex-1 justify-center items-center bg-black/50 p-4">
        <View className={`w-full max-w-md rounded-xl p-6 ${
          isDark ? "bg-neutral-900" : "bg-white"
        }`}>
          <Text className={`text-xl font-bold mb-4 ${
            isDark ? "text-white" : "text-black"
          }`}>
            Add Schedule Slot
          </Text>

          {/* Day Selection */}
          <View className="mb-4">
            <Text className={`mb-2 font-inter-semibold ${
              isDark ? "text-neutral-300" : "text-neutral-600"
            }`}>
              Select Day
            </Text>
            <TouchableOpacity
              onPress={() => setDayPickerVisible(true)}
              className={`py-3 px-4 rounded-lg ${
                isDark ? "bg-neutral-800" : "bg-neutral-100"
              }`}
            >
              <Text className={`text-center ${
                isDark ? "text-white" : "text-black"
              }`}>
                {selectedDay || "Select a day"}
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Day Picker Modal */}
          <Modal
            visible={dayPickerVisible}
            animationType="fade"
            transparent={true}
            onRequestClose={() => setDayPickerVisible(false)}
          >
            <TouchableOpacity 
              className="flex-1 justify-center items-center bg-black/50 p-4"
              onPress={() => setDayPickerVisible(false)}
            >
              <View 
                className={`w-3/4 max-h-60 rounded-xl p-4 ${
                  isDark ? "bg-neutral-800" : "bg-white"
                }`}
                onStartShouldSetResponder={() => true} // Prevent touch events from bubbling
              >
                <ScrollView>
                  {days.map((day) => (
                    <TouchableOpacity
                      key={day.value}
                      onPress={() => {
                        setSelectedDay(day.value);
                        setDayPickerVisible(false);
                      }}
                      className={`py-3 px-4 my-1 rounded-lg ${
                        selectedDay === day.value
                          ? isDark ? "bg-blue-700" : "bg-blue-500"
                          : isDark ? "bg-neutral-700" : "bg-neutral-200"
                      }`}
                    >
                      <Text
                        className={`text-center font-inter ${
                          selectedDay === day.value
                            ? "text-white"
                            : isDark ? "text-white" : "text-black"
                        }`}
                      >
                        {day.key}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableOpacity>
          </Modal>

          {/* Start Time Selection */}
          <View className="mb-4">
            <Text className={`mb-2 font-inter-semibold ${
              isDark ? "text-neutral-300" : "text-neutral-600"
            }`}>
              Start Time
            </Text>
            <TouchableOpacity
              onPress={() => setStartTimePickerVisible(true)}
              className={`py-3 px-4 rounded-lg ${
                isDark ? "bg-neutral-800" : "bg-neutral-100"
              }`}
            >
              <Text className={`text-center ${
                isDark ? "text-white" : "text-black"
              }`}>
                {selectedStartTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </TouchableOpacity>
            
            {startTimePickerVisible && (
              <DateTimePicker
                value={selectedStartTime}
                mode="time"
                display="default"
                onChange={(event, time) => {
                  setStartTimePickerVisible(false);
                  if (time) {
                    setSelectedStartTime(time);
                    
                    // If start time is after end time, update end time to be 1 hour after start
                    if (time >= selectedEndTime) {
                      const newEndTime = new Date(time);
                      newEndTime.setHours(newEndTime.getHours() + 1);
                      setSelectedEndTime(newEndTime);
                    }
                  }
                }}
              />
            )}
          </View>

          {/* End Time Selection */}
          <View className="mb-4">
            <Text className={`mb-2 font-inter-semibold ${
              isDark ? "text-neutral-300" : "text-neutral-600"
            }`}>
              End Time
            </Text>
            <TouchableOpacity
              onPress={() => setEndTimePickerVisible(true)}
              className={`py-3 px-4 rounded-lg ${
                isDark ? "bg-neutral-800" : "bg-neutral-100"
              }`}
            >
              <Text className={`text-center ${
                isDark ? "text-white" : "text-black"
              }`}>
                {selectedEndTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </TouchableOpacity>
            
            {endTimePickerVisible && (
              <DateTimePicker
                value={selectedEndTime}
                mode="time"
                display="default"
                onChange={(event, time) => {
                  setEndTimePickerVisible(false);
                  if (time) {
                    setSelectedEndTime(time);
                    
                    // If end time is before start time, set error or update start time
                    if (time <= selectedStartTime) {
                      Alert.alert("Error", "End time must be after start time.");
                    }
                  }
                }}
              />
            )}
          </View>

          {/* Action Buttons */}
          <View className="flex-row justify-between">
            <TouchableOpacity
              onPress={onClose}
              className={`flex-1 py-3 mr-2 rounded-lg ${
                isDark ? "bg-neutral-700" : "bg-neutral-200"
              }`}
            >
              <Text className={`text-center font-inter-semibold ${
                isDark ? "text-white" : "text-black"
              }`}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              className={`flex-1 py-3 ml-2 rounded-lg ${
                isDark ? "bg-green-600" : "bg-green-500"
              }`}
            >
              <Text className="text-white text-center font-inter-semibold">
                Add Slot
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default SchedulePickerModal;