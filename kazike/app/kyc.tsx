import { router } from "expo-router";
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  ScrollView,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Shield, CheckCircle, Camera, FileText, Upload } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import ErrorMessage from "@/components/ErrorMessage";
import Colors from "./dashboard/constants/colors";

const { width, height } = Dimensions.get('window');

export default function KycScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationSteps, setVerificationSteps] = useState({
    idUpload: false,
    dobVerification: false,
    faceMatch: false,
  });
  const [idImageUri, setIdImageUri] = useState<string | null>(null);
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [dobInput, setDobInput] = useState("");

  const clearError = () => setError(null);

  const handlePickImage = async (type: "id" | "selfie") => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setError("Please allow photo library access to upload images.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        if (type === "id") {
          setIdImageUri(uri);
          setVerificationSteps(prev => ({ ...prev, idUpload: true }));
        } else {
          setSelfieUri(uri);
          setVerificationSteps(prev => ({ ...prev, faceMatch: true }));
        }
        clearError();
      }
    } catch (err) {
      setError("Failed to upload image. Please try again.");
    }
  };

  const handleConfirmDob = () => {
    if (!dobInput.trim()) {
      setError("Please enter your date of birth.");
      return;
    }
    setVerificationSteps(prev => ({ ...prev, dobVerification: true }));
    clearError();
  };

  const handleCompleteKyc = () => {
    const allStepsComplete = Object.values(verificationSteps).every(Boolean);
    
    if (!allStepsComplete) {
      setError("Please complete all verification steps before proceeding.");
      return;
    }

    setIsLoading(true);
    clearError();
    
    setTimeout(() => {
      setIsLoading(false);
      router.replace("/approval-pending");
    }, 1200);
  };

  return (
    <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.content}>
              <View style={styles.header}>
                <View style={styles.iconContainer}>
                  <Shield color={Colors.red} size={32} />
                </View>
                <Text style={styles.title}>Identity Verification</Text>
                <Text style={styles.subtitle}>
                  Complete these steps to verify your identity and activate your .KE digital ID.
                </Text>
              </View>

              {/* Error Message Display */}
              <ErrorMessage 
                message={error || ""} 
                onDismiss={clearError}
                type="error"
              />

              <View style={styles.stepsContainer}>
                <TouchableOpacity
                  style={[
                    styles.stepCard,
                    verificationSteps.idUpload && styles.completedStep,
                  ]}
                  onPress={() => handlePickImage("id")}
                  accessibilityLabel="Upload ID document"
                  accessibilityRole="button"
                >
                  <View style={styles.stepIcon}>
                    <FileText color={Colors.red} size={20} />
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>Upload ID Document</Text>
                    <Text style={styles.stepDescription}>
                      Upload a clear image of your national ID or passport
                    </Text>
                    {!verificationSteps.idUpload && (
                      <TouchableOpacity style={styles.actionButton}>
                        <Upload color={Colors.white} size={16} />
                        <Text style={styles.actionText}>Choose Image</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  {verificationSteps.idUpload && (
                    <CheckCircle color="#00C65A" size={24} />
                  )}
                </TouchableOpacity>

                <View
                  style={[
                    styles.stepCard,
                    verificationSteps.dobVerification && styles.completedStep,
                  ]}
                >
                  <View style={styles.stepIcon}>
                    <FileText color={Colors.red} size={20} />
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>Confirm Date of Birth</Text>
                    <Text style={styles.stepDescription}>
                      Re-enter your date of birth for verification
                    </Text>
                    {!verificationSteps.dobVerification && (
                      <View style={styles.dobInputContainer}>
                        <TextInput
                          style={styles.dobInput}
                          placeholder="DD/MM/YYYY"
                          placeholderTextColor="rgba(0, 0, 0, 0.6)"
                          value={dobInput}
                          onChangeText={(text) => {
                            setDobInput(text);
                            if (error) clearError();
                          }}
                          keyboardType="numeric"
                        />
                        <TouchableOpacity
                          style={styles.confirmButton}
                          onPress={handleConfirmDob}
                        >
                          <Text style={styles.confirmButtonText}>Confirm</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                  {verificationSteps.dobVerification && (
                    <CheckCircle color="#00C65A" size={24} />
                  )}
                </View>

                <TouchableOpacity
                  style={[
                    styles.stepCard,
                    verificationSteps.faceMatch && styles.completedStep,
                  ]}
                  onPress={() => handlePickImage("selfie")}
                  accessibilityLabel="Upload selfie for face recognition"
                  accessibilityRole="button"
                >
                  <View style={styles.stepIcon}>
                    <Camera color={Colors.red} size={20} />
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>Face Recognition</Text>
                    <Text style={styles.stepDescription}>
                      Upload a clear selfie for face verification
                    </Text>
                    {!verificationSteps.faceMatch && (
                      <TouchableOpacity style={styles.actionButton}>
                        <Upload color={Colors.white} size={16} />
                        <Text style={styles.actionText}>Upload Selfie</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  {verificationSteps.faceMatch && (
                    <CheckCircle color="#00C65A" size={24} />
                  )}
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[
                  styles.completeButton,
                  {
                    opacity: isLoading
                      ? 0.7
                      : Object.values(verificationSteps).every(Boolean)
                      ? 1
                      : 0.7,
                  },
                ]}
                onPress={handleCompleteKyc}
                disabled={isLoading || !Object.values(verificationSteps).every(Boolean)}
                accessibilityLabel="Complete verification"
                accessibilityRole="button"
              >
                <Text style={styles.completeButtonText}>
                  {isLoading ? "Processing..." : "Complete Verification"}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.lightGray,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: width > 768 ? 32 : 24,
    paddingTop: height > 800 ? 20 : 10,
    paddingBottom: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: height > 800 ? 40 : 30,
  },
  iconContainer: {
    width: width > 768 ? 80 : 64,
    height: width > 768 ? 80 : 64,
    borderRadius: width > 768 ? 40 : 32,
    backgroundColor: "rgba(206, 17, 38, 0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: width > 768 ? 28 : 24,
    fontWeight: "bold",
    color: Colors.black,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: width > 768 ? 18 : 16,
    color: "rgba(0, 0, 0, 0.7)",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: width > 768 ? 40 : 20,
  },
  stepsContainer: {
    gap: height > 800 ? 20 : 16,
    marginBottom: 32,
  },
  stepCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    padding: width > 768 ? 20 : 16,
    borderRadius: 12,
    minHeight: 80,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
    shadowColor: "rgba(0, 0, 0, 0.1)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  completedStep: {
    borderWidth: 2,
    borderColor: "#006600",
  },
  stepIcon: {
    width: width > 768 ? 48 : 40,
    height: width > 768 ? 48 : 40,
    borderRadius: width > 768 ? 24 : 20,
    backgroundColor: "rgba(206, 17, 38, 0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: width > 768 ? 18 : 16,
    fontWeight: "600",
    color: Colors.black,
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: width > 768 ? 15 : 14,
    color: "rgba(0, 0, 0, 0.7)",
    marginBottom: 8,
  },
  actionButton: {
    backgroundColor: Colors.red,
    paddingVertical: width > 768 ? 12 : 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 8,
  },
  actionText: {
    color: Colors.white,
    fontWeight: "600",
    fontSize: width > 768 ? 15 : 14,
  },
  dobInputContainer: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
    shadowColor: "rgba(0, 0, 0, 0.1)",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dobInput: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: Colors.black,
    fontSize: width > 768 ? 16 : 14,
    flex: 1,
    minWidth: 120,
  },
  confirmButton: {
    backgroundColor: Colors.red,
    paddingVertical: width > 768 ? 12 : 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  confirmButtonText: {
    color: Colors.white,
    fontWeight: "600",
    fontSize: width > 768 ? 15 : 14,
  },
  completeButton: {
    backgroundColor: Colors.red,
    paddingVertical: width > 768 ? 18 : 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 2,
  },
  completeButtonText: {
    color: Colors.white,
    fontSize: width > 768 ? 18 : 16,
    fontWeight: "600",
  },
});