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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Shield, Mail, Building } from "lucide-react-native";
import { useAuthStore } from "@/stores/auth-store";
import ErrorMessage from "@/components/ErrorMessage";
import Colors from "../dashboard/constants/colors";

export default function GovernmentSignupScreen() {
  const [formData, setFormData] = useState({
    officialEmail: "",
    ministry: "",
    role: "",
    password: "",
  });
  const { signUp, isLoading, error, clearError } = useAuthStore();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) clearError();
  };

  const handleSignup = async () => {
    const { officialEmail, ministry, role, password } = formData;
    
    if (!officialEmail || !ministry || !role || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      const user = await signUp({
        email: officialEmail,
        role: "government",
        password,
        profile: { fullName: officialEmail, ministry, phone: "", },
      });
      router.replace("/verify-government");
    } catch (error) {
      console.log("Government signup error:", error);
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
              <Text style={styles.headerTitle}>Government Signup</Text>
              <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              <ErrorMessage 
                message={error || ""} 
                onDismiss={clearError}
                type="error"
              />
              <Text style={styles.subtitle}>
                Register for government oversight and analytics access.
              </Text>

              <View style={styles.form}>
                <View style={styles.inputContainer}>
                  <Mail color={Colors.gray} size={20} />
                  <TextInput
                    style={styles.input}
                    placeholder="Official Government Email"
                    placeholderTextColor={Colors.gray}
                    value={formData.officialEmail}
                    onChangeText={(value) => handleInputChange("officialEmail", value)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    accessibilityLabel="Official email input"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Building color={Colors.gray} size={20} />
                  <TextInput
                    style={styles.input}
                    placeholder="Ministry/Department"
                    placeholderTextColor={Colors.gray}
                    value={formData.ministry}
                    onChangeText={(value) => handleInputChange("ministry", value)}
                    accessibilityLabel="Ministry input"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Shield color={Colors.gray} size={20} />
                  <TextInput
                    style={styles.input}
                    placeholder="Official Role/Title"
                    placeholderTextColor={Colors.gray}
                    value={formData.role}
                    onChangeText={(value) => handleInputChange("role", value)}
                    accessibilityLabel="Role input"
                  />
                </View>

                <View style={styles.inputContainer}>
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
                  accessibilityLabel="Submit application button"
                  accessibilityRole="button"
                >
                  <Text style={styles.signupButtonText}>
                    {isLoading ? "Submitting..." : "Submit Application"}
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
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: Colors.black,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.white,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.white,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(0, 0, 0, 0.7)",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
    fontWeight: "600",
  },
  form: {
    gap: 16,
    paddingBottom: 32,
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
    fontSize: 16,
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