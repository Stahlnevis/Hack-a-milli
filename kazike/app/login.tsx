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
import { ArrowLeft, Mail, Lock } from "lucide-react-native";
import { useAuthStore } from "@/stores/auth-store";
import ErrorMessage from "@/components/ErrorMessage";
import Colors from "./dashboard/constants/colors";

const { width, height } = Dimensions.get("window");

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signIn, isLoading, error, clearError } = useAuthStore();

  // Auto clear error after 5s
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => clearError(), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      console.log("Attempting login with:", email);
      const user = await signIn(email, password);
      console.log("Login successful, user role:", user.role);

      if (!user.isVerified) {
        const verifyRoute = user.role === "youth"
          ? "/kyc"
          : user.role === "employer"
          ? "/verify-company"
          : user.role === "government"
          ? "/verify-government"
          : "/verify-institution";
        router.replace(verifyRoute);
        return;
      }

      router.replace(`/dashboard/${user.role}`);
    } catch (err) {
      console.error("Login error:", err);
      // Error is shown in <ErrorMessage>
    }
  };

  return (
    <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView
            style={styles.keyboardView}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
                accessibilityLabel="Go back"
                accessibilityRole="button"
              >
                <ArrowLeft color={Colors.white} size={24} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Sign In</Text>
              <View style={styles.placeholder} />
            </View>

            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.content}>
                <Text style={styles.subtitle}>
                  Welcome back! Sign in to access your .KE digital identity.
                </Text>

                {/* Error message */}
                <ErrorMessage
                  message={error || ""}
                  onDismiss={clearError}
                  type="error"
                />

                <View style={styles.form}>
                  {/* Email */}
                  <View style={styles.inputContainer}>
                    <Mail color={Colors.gray} size={20} />
                    <TextInput
                      style={styles.input}
                      placeholder="Email or Phone"
                      placeholderTextColor={Colors.gray}
                      value={email}
                      onChangeText={(text) => {
                        setEmail(text);
                        if (error) clearError();
                      }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      accessibilityLabel="Email or phone input"
                    />
                  </View>

                  {/* Password */}
                  <View style={styles.inputContainer}>
                    <Lock color={Colors.gray} size={20} />
                    <TextInput
                      style={styles.input}
                      placeholder="Password"
                      placeholderTextColor={Colors.gray}
                      value={password}
                      onChangeText={(text) => {
                        setPassword(text);
                        if (error) clearError();
                      }}
                      secureTextEntry
                      accessibilityLabel="Password input"
                    />
                  </View>

                  {/* Forgot Password */}
                  <TouchableOpacity style={styles.forgotPassword}>
                    <Text style={styles.forgotPasswordText}>
                      Forgot Password?
                    </Text>
                  </TouchableOpacity>

                  {/* Login Button */}
                  <TouchableOpacity
                    style={[
                      styles.loginButton,
                      { opacity: isLoading ? 0.7 : 1 },
                    ]}
                    onPress={handleLogin}
                    disabled={isLoading}
                    accessibilityLabel="Sign in button"
                    accessibilityRole="button"
                  >
                    <Text style={styles.loginButtonText}>
                      {isLoading ? "Signing In..." : "Sign In"}
                    </Text>
                  </TouchableOpacity>

                  {/* Signup Prompt */}
                  <View style={styles.signupPrompt}>
                    <Text style={styles.signupPromptText}>
                      Don&apos;t have an account?{" "}
                    </Text>
                    <TouchableOpacity
                      onPress={() => router.push("/profile-selection")}
                    >
                      <Text style={styles.signupLink}>Get Started</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
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
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 20 },

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
  placeholder: { width: width > 768 ? 48 : 40 },

  content: {
    flex: 1,
    paddingHorizontal: width > 768 ? 32 : 24,
    paddingTop: height > 800 ? 20 : 10,
    paddingBottom: 20,
    justifyContent: "center",
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
  form: { gap: height > 800 ? 24 : 20 },

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
  input: { flex: 1, fontSize: width > 768 ? 17 : 16, color: Colors.black, marginLeft: 8 },

  forgotPassword: { alignSelf: "flex-end" },
  forgotPasswordText: {
    color: "rgba(0, 0, 0, 0.7)",
    fontSize: width > 768 ? 15 : 14,
    textDecorationLine: "underline",
  },

  loginButton: {
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
  loginButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: "bold",
  },

  signupPrompt: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  signupPromptText: {
    color: "rgba(0, 0, 0, 0.7)",
    fontSize: width > 768 ? 15 : 14,
  },
  signupLink: {
    color: Colors.red,
    fontSize: width > 768 ? 15 : 14,
    fontWeight: "600",
  },
});
