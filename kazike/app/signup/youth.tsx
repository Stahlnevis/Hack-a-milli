import { router } from "expo-router";
import React, { useState, useEffect } from "react";
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
import { ArrowLeft, User, Mail, Phone, CreditCard, Calendar } from "lucide-react-native";
import { useAuthStore } from "@/stores/auth-store";
import ErrorMessage from "@/components/ErrorMessage";
import Colors from "../dashboard/constants/colors";

const { width, height } = Dimensions.get('window');

export default function YouthSignupScreen() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    nationalId: "",
    dob: "",
    password: "",
  });
  const { signUp, isLoading, error, clearError } = useAuthStore();

  // Clear error when component mounts or when user starts typing
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000); // Auto-clear after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) clearError();
  };

  const handleSignup = async () => {
    const { fullName, email, phone, nationalId, dob, password } = formData;
    
    if (!fullName || !email || !phone || !nationalId || !dob || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long");
      return;
    }
    const emailValid = /.+@.+\..+/.test(email);
    if (!emailValid) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    try {
      console.log("[YouthSignup] Submitting signup to Supabase...");
      const user = await signUp({
        email,
        password,
        role: "youth",
        profile: {
          fullName,
          phone,
          nationalId,
          dateOfBirth: dob,
        },
      });
      
      console.log("User created with domain:", user.domain);
      
      // Navigate to KYC for verification
      router.replace("/kyc");
    } catch (error) {
      // Error is handled by the auth store; shown via ErrorMessage
      console.log("Youth signup error:", error);
      const message = error instanceof Error ? error.message : "Signup failed. Please try again.";
      Alert.alert("Signup Failed", message);
    }
  };

  return (
    <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView
            style={styles.keyboardView}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
                accessibilityLabel="Go back"
                accessibilityRole="button"
              >
                <ArrowLeft color={Colors.white} size={24} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Youth Signup</Text>
              <View style={styles.placeholder} />
            </View>

            <ScrollView 
              style={styles.content} 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.subtitle}>
                Create your .KE digital identity and unlock job opportunities.
              </Text>

              {/* Error Message Display */}
              <ErrorMessage 
                message={error || ""} 
                onDismiss={clearError}
                type="error"
              />

              <View style={styles.form}>
                <View style={styles.inputContainer}>
                  <User color={Colors.gray} size={20} />
                  <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    placeholderTextColor={Colors.gray}
                    value={formData.fullName}
                    onChangeText={(value) => handleInputChange("fullName", value)}
                    accessibilityLabel="Full name input"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Mail color={Colors.gray} size={20} />
                  <TextInput
                    style={styles.input}
                    placeholder="Email Address"
                    placeholderTextColor={Colors.gray}
                    value={formData.email}
                    onChangeText={(value) => handleInputChange("email", value)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    accessibilityLabel="Email input"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Phone color={Colors.gray} size={20} />
                  <TextInput
                    style={styles.input}
                    placeholder="Phone Number"
                    placeholderTextColor={Colors.gray}
                    value={formData.phone}
                    onChangeText={(value) => handleInputChange("phone", value)}
                    keyboardType="phone-pad"
                    accessibilityLabel="Phone number input"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <CreditCard color={Colors.gray} size={20} />
                  <TextInput
                    style={styles.input}
                    placeholder="National ID Number"
                    placeholderTextColor={Colors.gray}
                    value={formData.nationalId}
                    onChangeText={(value) => handleInputChange("nationalId", value)}
                    accessibilityLabel="National ID input"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Calendar color={Colors.gray} size={20} />
                  <TextInput
                    style={styles.input}
                    placeholder="Date of Birth (DD/MM/YYYY)"
                    placeholderTextColor={Colors.gray}
                    value={formData.dob}
                    onChangeText={(value) => handleInputChange("dob", value)}
                    accessibilityLabel="Date of birth input"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <User color={Colors.gray} size={20} />
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor={Colors.gray}
                    value={formData.password}
                    onChangeText={(value) => handleInputChange("password", value)}
                    secureTextEntry
                    accessibilityLabel="Password input"
                  />
                </View>

                <TouchableOpacity
                  style={[
                    styles.signupButton,
                    { opacity: isLoading ? 0.7 : 1 },
                  ]}
                  onPress={handleSignup}
                  disabled={isLoading}
                  accessibilityLabel="Create account button"
                  accessibilityRole="button"
                >
                  <Text style={styles.signupButtonText}>
                    {isLoading ? "Creating Account..." : "Create Account"}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: width > 768 ? 32 : 24,
    paddingVertical: 16,
    backgroundColor: Colors.black,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  backButton: {
    width: width > 768 ? 48 : 40,
    height: width > 768 ? 48 : 40,
    borderRadius: width > 768 ? 24 : 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.white,
  },
  headerTitle: {
    fontSize: width > 768 ? 20 : 18,
    fontWeight: "600",
    color: Colors.white,
  },
  placeholder: {
    width: width > 768 ? 48 : 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: width > 768 ? 32 : 24,
  },
  scrollContent: {
    paddingTop: height > 800 ? 20 : 10,
    paddingBottom: 20,
  },
  subtitle: {
    fontSize: width > 768 ? 18 : 16,
    color: "rgba(0, 0, 0, 0.7)",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: height > 800 ? 40 : 30,
    paddingHorizontal: width > 768 ? 40 : 20,
    fontWeight: "600",
  },
  form: {
    gap: height > 800 ? 24 : 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 12,
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
    fontSize: width > 768 ? 17 : 16,
    color: Colors.black,
    marginLeft: 8,
  },
  signupButton: {
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
  signupButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: "bold",
  },
});