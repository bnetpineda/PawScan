import { FontAwesome } from "@expo/vector-icons";
import { useState } from "react";
import {
  Alert,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView
} from "react-native";
import SchedulePickerModal from './SchedulePickerModal';

const VetProfileEditModal = ({
  visible,
  onClose,
  name,
  setName,
  medicalSpecialty,
  setMedicalSpecialty,
  clinicLocation,
  setClinicLocation,
  contactInfo,
  setContactInfo,
  bio,
  setBio,
  availableSchedule,
  setAvailableSchedule,
  editSchedule,
  updateVetProfile,
  updating,
  isDark,
}) => {
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);

  const handleAddScheduleSlot = (scheduleData) => {
    // Call the editSchedule function from the parent component with the selected data
    editSchedule(scheduleData);
  };

  const removeScheduleEntry = (id) => {
    // Filter out the schedule entry with the given ID
    const updatedSchedule = availableSchedule.filter(entry => entry.id !== id);
    setAvailableSchedule(updatedSchedule);
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
          Edit Profile
        </Text>

        {/* Name Input */}
        <View className="mb-3">
        <Text className={`mb-1 font-inter-semibold ${
            isDark ? "text-neutral-300" : "text-neutral-600"
          }`}>
            Name
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
            placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
            className={`border rounded-lg px-3 py-2 ${
              isDark 
                ? "bg-neutral-800 text-white border-neutral-700" 
                : "bg-neutral-100 text-black border-neutral-300"
            }`}
          />
        </View>

        {/* Medical Specialty Input */}
        <View className="mb-3">
          <Text className={`mb-1 font-inter-semibold ${
            isDark ? "text-neutral-300" : "text-neutral-600"
          }`}>
            Medical Specialty
          </Text>
          <TextInput
            value={medicalSpecialty}
            onChangeText={setMedicalSpecialty}
            placeholder="Enter your specialty"
            placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
            className={`border rounded-lg px-3 py-2 ${
              isDark 
                ? "bg-neutral-800 text-white border-neutral-700" 
                : "bg-neutral-100 text-black border-neutral-300"
            }`}
          />
        </View>

        {/* Clinic Location Input */}
        <View className="mb-3">
          <Text className={`mb-1 font-inter-semibold ${
            isDark ? "text-neutral-300" : "text-neutral-600"
          }`}>
            Clinic Location
          </Text>
          <TextInput
            value={clinicLocation}
            onChangeText={setClinicLocation}
            placeholder="Enter clinic location"
            placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
            className={`border rounded-lg px-3 py-2 ${
              isDark 
                ? "bg-neutral-800 text-white border-neutral-700" 
                : "bg-neutral-100 text-black border-neutral-300"
            }`}
          />
        </View>

        {/* Contact Info Input */}
        <View className="mb-3">
          <Text className={`mb-1 font-inter-semibold ${
            isDark ? "text-neutral-300" : "text-neutral-600"
          }`}>
            Contact Info
          </Text>
          <TextInput
            value={contactInfo}
            onChangeText={setContactInfo}
            placeholder="Enter contact information"
            placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
            className={`border rounded-lg px-3 py-2 ${
              isDark 
                ? "bg-neutral-800 text-white border-neutral-700" 
                : "bg-neutral-100 text-black border-neutral-300"
            }`}
          />
        </View>

        {/* Bio Input */}
        <View className="mb-3">
          <Text className={`mb-1 font-inter-semibold ${
            isDark ? "text-neutral-300" : "text-neutral-600"
          }`}>
            Bio
          </Text>
          <TextInput
            value={bio}
            onChangeText={setBio}
            placeholder="Tell us about your veterinary experience"
            placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={200}
            className={`border rounded-lg px-3 py-2 ${
              isDark 
                ? "bg-neutral-800 text-white border-neutral-700" 
                : "bg-neutral-100 text-black border-neutral-300"
            }`}
          />
          <Text className={`mt-1 text-right ${
            isDark ? "text-neutral-400" : "text-neutral-500"
          } text-xs`}>
            {bio.length}/200
          </Text>
        </View>

        {/* Schedule Section */}
        <View className="mb-4">
          <Text className={`mb-2 font-inter-semibold ${
            isDark ? "text-neutral-300" : "text-neutral-600"
          }`}>
            Available Schedule
          </Text>
          <Text className={`text-xs mb-2 ${
            isDark ? "text-neutral-400" : "text-neutral-500"
          }`}>
            Add availability slots for clients to book
          </Text>
          <TouchableOpacity
            onPress={() => setShowSchedulePicker(true)}
            className={`py-3 px-4 rounded-lg ${
              isDark ? "bg-neutral-700" : "bg-neutral-300"
            }`}
          >
            <Text className={`text-center font-inter-semibold ${
              isDark ? "text-white" : "text-black"
            }`}>
              Add Availability Slot
            </Text>
          </TouchableOpacity>
          
          {/* Current Schedule List */}
          {availableSchedule && availableSchedule.length > 0 ? (
            <View className="mt-4 max-h-40">
              <Text className={`mb-2 font-inter-semibold ${
                isDark ? "text-neutral-300" : "text-neutral-600"
              }`}>
                Current Schedule
              </Text>
              <ScrollView>
                {availableSchedule.map((entry, index) => (
                  <View 
                    key={entry.id || index} 
                    className={`flex-row justify-between items-center py-2 px-3 mb-2 rounded ${
                      isDark ? "bg-neutral-800" : "bg-neutral-100"
                    }`}
                  >
                    <Text className={`${isDark ? "text-white" : "text-black"}`}>
                      {entry.day} at {entry.time}
                    </Text>
                    <TouchableOpacity onPress={() => removeScheduleEntry(entry.id)}>
                      <FontAwesome name="trash" size={18} color={isDark ? "#EF4444" : "#DC2626"} />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          ) : null}
        </View>

        {/* Schedule Picker Modal */}
        <SchedulePickerModal
          visible={showSchedulePicker}
          onClose={() => setShowSchedulePicker(false)}
          onSave={handleAddScheduleSlot}
          isDark={isDark}
        />

        {/* Buttons */}
        <View className="flex-row justify-between mt-4">
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
            onPress={updateVetProfile}
            disabled={updating}
            className={`flex-1 py-3 ml-2 rounded-lg ${
              isDark ? "bg-green-600" : "bg-green-500"
            }`}
          >
            <Text className="text-white text-center font-inter-semibold">
              {updating ? "Saving..." : "Save"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);
};

export default VetProfileEditModal;
