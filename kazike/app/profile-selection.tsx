import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Users,
  Building2,
  Shield,
  GraduationCap,
  ArrowLeft,
} from "lucide-react-native";
import { useAuthStore, UserRole } from "@/stores/auth-store";
import Colors from "./dashboard/constants/colors";

const profileOptions = [
  {
    role: "youth" as UserRole,
    title: "Youth",
    tagline: "Get your .KE EduID and job matches",
    icon: Users,
    color: "#CE1126",
  },
  {
    role: "employer" as UserRole,
    title: "SME/Employer",
    tagline: "Post jobs and discover verified talent",
    icon: Building2,
    color: "#006600",
  },
  {
    role: "government" as UserRole,
    title: "Government",
    tagline: "Analytics and verification oversight",
    icon: Shield,
    color: "#000000",
  },
  {
    role: "institution" as UserRole,
    title: "University/TVET",
    tagline: "Issue and verify certificates",
    icon: GraduationCap,
    color: "#CE1126",
  },
];

export default function ProfileSelectionScreen() {
  const { setSelectedRole } = useAuthStore();

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    router.push(`/signup/${role}`);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.white, Colors.white]}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              accessibilityLabel="Go back"
              accessibilityRole="button"
            >
              <ArrowLeft color={Colors.white} size={24} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Choose Your Profile</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.subtitle}>
              Select the option that best describes you to get started with your
              .KE digital identity.
            </Text>

            <View style={styles.cardsContainer}>
              {profileOptions.map((option, index) => (
                <TouchableOpacity
                  key={option.role}
                  style={styles.profileCard}
                  onPress={() => handleRoleSelect(option.role)}
                  accessibilityLabel={`Select ${option.title}: ${option.tagline}`}
                  accessibilityRole="button"
                >
                  <View style={styles.cardContent}>
                    <View
                      style={[
                        styles.iconContainer,
                        { backgroundColor: "rgba(206, 17, 38, 0.08)" },
                      ]}
                    >
                      <option.icon color={Colors.red} size={28} />
                    </View>
                    <View style={styles.textContainer}>
                      <Text style={styles.cardTitle}>{option.title}</Text>
                      <Text style={styles.cardTagline}>{option.tagline}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
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
  cardsContainer: {
    gap: 16,
    paddingBottom: 32,
  },
  profileCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.08)",
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.black,
    marginBottom: 4,
  },
  cardTagline: {
    fontSize: 14,
    color: "rgba(0, 0, 0, 0.7)",
    lineHeight: 20,
  },
});