import { router } from "expo-router";
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, GraduationCap, Building, Mail, Phone, Lock, MapPin, User, FileText } from "lucide-react-native";
import { useAuthStore } from "@/stores/auth-store";
import ErrorMessage from "@/components/ErrorMessage";
import { Picker } from "@react-native-picker/picker";
import Colors from "../dashboard/constants/colors";

const { width, height } = Dimensions.get('window');

export default function InstitutionSignupScreen() {
  const { signUp, isLoading, setSelectedRole, error, clearError } = useAuthStore();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    institutionName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    institutionType: "",
    accreditationNumber: "",
    address: "",
    principalName: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) clearError();
  };

  const validateStep1 = () => {
    const { institutionName, email, phone, password, confirmPassword } = formData;
    if (!institutionName || !email || !phone || !password || !confirmPassword) {
      Alert.alert("Validation Error", "Please fill in all required fields");
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert("Validation Error", "Passwords do not match");
      return false;
    }
    if (password.length < 6) {
      Alert.alert("Validation Error", "Password must be at least 6 characters long");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    const { institutionType, accreditationNumber, address, principalName } = formData;
    if (!institutionType) {
      Alert.alert("Validation Error", "Please select an institution type");
      return false;
    }
    if (!accreditationNumber) {
      Alert.alert("Validation Error", "Please enter the accreditation number");
      return false;
    }
    if (!address) {
      Alert.alert("Validation Error", "Please enter the physical address");
      return false;
    }
    if (!principalName) {
      Alert.alert("Validation Error", "Please enter the principal/admin name");
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handleSignup = async () => {
    if (!validateStep2()) return;

    const {
      institutionName,
      email,
      phone,
      password,
      institutionType,
      accreditationNumber,
      address,
      principalName,
    } = formData;

    try {
      const user = await signUp({
        email,
        role: "institution",
        password,
        profile: {
          institutionName,
          phone,
          institutionType,
          accreditationNumber,
          address,
          principalName,
        },
      });
      setSelectedRole("institution");
      router.replace("/verify-institution");
    } catch (error) {
      // Error is already set in auth store and displayed via ErrorMessage
      console.log("Institution signup error:", error);
    }
  };

  return (
    <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => (step === 1 ? router.back() : setStep(step - 1))}
              >
                <ArrowLeft color={Colors.white} size={24} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Institution Signup</Text>
              <View style={{ width: 40 }} />
            </View>

            <View style={styles.progressContainer}>
              <View style={[styles.progressStep, step >= 1 && styles.progressActive]} />
              <View style={[styles.progressStep, step >= 2 && styles.progressActive]} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              <ErrorMessage 
                message={error || ""} 
                onDismiss={clearError}
                type="error"
              />
              {step === 1 && (
                <View style={styles.formCard}>
                  <View style={styles.stepHeader}>
                    <GraduationCap color={Colors.red} size={24} />
                    <Text style={styles.stepTitle}>Step 1: Account Information</Text>
                  </View>

                  <View style={{ marginBottom: 12 }}>
                    <Text style={{ color: 'rgba(0,0,0,0.7)', marginBottom: 6 }}><Text style={{ color: '#FF4D4F' }}>*</Text> Institution Name</Text>
                    <View style={styles.inputContainer}>
                      <Building color={Colors.gray} size={20} />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter institution name"
                        placeholderTextColor={Colors.gray}
                        value={formData.institutionName}
                        onChangeText={(v) => handleInputChange("institutionName", v)}
                      />
                    </View>
                  </View>

                  <View style={{ marginBottom: 12 }}>
                    <Text style={{ color: 'rgba(0,0,0,0.7)', marginBottom: 6 }}><Text style={{ color: '#FF4D4F' }}>*</Text> Official Email</Text>
                    <View style={styles.inputContainer}>
                      <Mail color={Colors.gray} size={20} />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter official email"
                        placeholderTextColor={Colors.gray}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={formData.email}
                        onChangeText={(v) => handleInputChange("email", v)}
                      />
                    </View>
                  </View>

                  <View style={{ marginBottom: 12 }}>
                    <Text style={{ color: 'rgba(0,0,0,0.7)', marginBottom: 6 }}><Text style={{ color: '#FF4D4F' }}>*</Text> Phone Number</Text>
                    <View style={styles.inputContainer}>
                      <Phone color={Colors.gray} size={20} />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter phone number"
                        placeholderTextColor={Colors.gray}
                        keyboardType="phone-pad"
                        value={formData.phone}
                        onChangeText={(v) => handleInputChange("phone", v)}
                      />
                    </View>
                  </View>

                  <View style={{ marginBottom: 12 }}>
                    <Text style={{ color: 'rgba(0,0,0,0.7)', marginBottom: 6 }}><Text style={{ color: '#FF4D4F' }}>*</Text> Password</Text>
                    <View style={styles.inputContainer}>
                      <Lock color={Colors.gray} size={20} />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter password"
                        placeholderTextColor={Colors.gray}
                        secureTextEntry
                        value={formData.password}
                        onChangeText={(v) => handleInputChange("password", v)}
                      />
                    </View>
                  </View>

                  <View style={{ marginBottom: 12 }}>
                    <Text style={{ color: 'rgba(0,0,0,0.7)', marginBottom: 6 }}><Text style={{ color: '#FF4D4F' }}>*</Text> Confirm Password</Text>
                    <View style={styles.inputContainer}>
                      <Lock color={Colors.gray} size={20} />
                      <TextInput
                        style={styles.input}
                        placeholder="Confirm password"
                        placeholderTextColor={Colors.gray}
                        secureTextEntry
                        value={formData.confirmPassword}
                        onChangeText={(v) => handleInputChange("confirmPassword", v)}
                      />
                    </View>
                  </View>

                  <TouchableOpacity style={styles.primaryButton} onPress={handleNextStep}>
                    <Text style={styles.primaryButtonText}>Next</Text>
                  </TouchableOpacity>
                </View>
              )}

              {step === 2 && (
                <View style={styles.formCard}>
                  <View style={styles.stepHeader}>
                    <Building color={Colors.red} size={24} />
                    <Text style={styles.stepTitle}>Step 2: Institutional Details</Text>
                  </View>

                  <View style={{ marginBottom: 12 }}>
                    <Text style={{ color: 'rgba(0,0,0,0.7)', marginBottom: 6 }}><Text style={{ color: '#FF4D4F' }}>*</Text> Institution Type</Text>
                    <View style={styles.pickerWrapper}>
                      <Picker
                        selectedValue={formData.institutionType}
                        onValueChange={(v: string) => handleInputChange("institutionType", v)}
                        style={styles.picker}
                        dropdownIconColor={Colors.gray}
                        itemStyle={{ color: Colors.black }}
                      >
                        <Picker.Item label="Select Institution Type" value="" color="#000000" />
                        <Picker.Item label="University" value="University" color="#000000" />
                        <Picker.Item label="College" value="College" color="#000000" />
                        <Picker.Item label="High School" value="High School" color="#000000" />
                        <Picker.Item label="Vocational" value="Vocational" color="#000000" />
                        <Picker.Item label="Training Center" value="Training Center" color="#000000" />
                      </Picker>
                    </View>
                  </View>

                  <View style={{ marginBottom: 12 }}>
                    <Text style={{ color: 'rgba(0,0,0,0.7)', marginBottom: 6 }}><Text style={{ color: '#FF4D4F' }}>*</Text> Institution Registration Number</Text>
                    <View style={styles.inputContainer}>
                      <FileText color={Colors.gray} size={20} />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter registration number"
                        placeholderTextColor={Colors.gray}
                        value={formData.accreditationNumber}
                        onChangeText={(v) => handleInputChange("accreditationNumber", v)}
                      />
                    </View>
                  </View>

                  <View style={{ marginBottom: 12 }}>
                    <Text style={{ color: 'rgba(0,0,0,0.7)', marginBottom: 6 }}><Text style={{ color: '#FF4D4F' }}>*</Text> Physical Address</Text>
                    <View style={styles.inputContainer}>
                      <MapPin color={Colors.gray} size={20} />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter physical address"
                        placeholderTextColor={Colors.gray}
                        value={formData.address}
                        onChangeText={(v) => handleInputChange("address", v)}
                      />
                    </View>
                  </View>

                  <View style={{ marginBottom: 12 }}>
                    <Text style={{ color: 'rgba(0,0,0,0.7)', marginBottom: 6 }}><Text style={{ color: '#FF4D4F' }}>*</Text> Principal / Admin Name</Text>
                    <View style={styles.inputContainer}>
                      <User color={Colors.gray} size={20} />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter principal or admin name"
                        placeholderTextColor={Colors.gray}
                        value={formData.principalName}
                        onChangeText={(v) => handleInputChange("principalName", v)}
                      />
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.primaryButton, { backgroundColor: Colors.red }]}
                    onPress={handleSignup}
                    disabled={isLoading}
                  >
                    <Text style={[styles.primaryButtonText, { color: Colors.white }]}
                    >
                      {isLoading ? "Registering..." : "Register Institution"}
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.loginPrompt}>
                    <Text style={styles.loginPromptText}>Already have an account? </Text>
                    <TouchableOpacity onPress={() => router.push("/login")}>
                      <Text style={styles.loginLink}>Log In</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  safeArea: { flex: 1 },
  keyboardView: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: Colors.black,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  backButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Colors.white, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.1)" },
  headerTitle: { fontSize: 18, fontWeight: "600", color: Colors.white },

  progressContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 16,
  },
  progressStep: {
    width: 60,
    height: 6,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    borderRadius: 3,
    marginHorizontal: 4,
  },
  progressActive: { backgroundColor: Colors.red },

  content: { flex: 1, paddingHorizontal: 24 },

  formCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
    shadowColor: "rgba(0,0,0,0.1)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  stepTitle: { fontSize: 16, fontWeight: "600", color: Colors.black, marginLeft: 8 },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    shadowColor: "rgba(0, 0, 0, 0.1)",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  input: {
    flex: 1,
    color: Colors.black,
    fontSize: 16,
    marginLeft: 8,
    paddingVertical: 0,
  },

  pickerWrapper: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "rgba(0, 0, 0, 0.1)",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  picker: { color: Colors.black, fontSize: 16, backgroundColor: "transparent" },

  primaryButton: {
    backgroundColor: Colors.red,
    paddingVertical: 16,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 2,
    shadowColor: "rgba(0, 0, 0, 0.1)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  primaryButtonText: { color: Colors.white, fontSize: 18, fontWeight: "bold" },

  loginPrompt: { flexDirection: "row", justifyContent: "center", marginTop: 20 },
  loginPromptText: { fontSize: 14, color: "rgba(0,0,0,0.7)" },
  loginLink: { color: Colors.red, fontSize: 14, fontWeight: "600" },
  debugText: { color: "rgba(0,0,0,0.7)", fontSize: 14, textAlign: "center", marginBottom: 10 },
});
