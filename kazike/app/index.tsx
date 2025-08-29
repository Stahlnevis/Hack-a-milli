
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "react-native";
import { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { 
  Shield, 
  Globe, 
  Briefcase, 
  FileText,
  ChevronRight 
} from "lucide-react-native";
import Colors from "./dashboard/constants/colors";

const { width, height } = Dimensions.get("window");

export default function LandingScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const isSmallScreen = width < 600;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const valueHighlights = [
    {
      icon: Shield,
      title: "Verified EduID",
      description: "Government-backed digital identity",
    },
    {
      icon: Globe,
      title: ".KE Subdomain Portfolio",
      description: "Professional online presence",
    },
    {
      icon: Briefcase,
      title: "AI Job Matching",
      description: "Smart career opportunities",
    },
    {
      icon: FileText,
      title: "Multilingual CV",
      description: "Reach global employers",
    },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[
          Colors.white,
          'rgba(29, 203, 4, 0.06)',
          'rgba(227, 30, 37, 0.06)',
          Colors.white,
        ]}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.topBar} />
          <Animated.ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: false }
            )}
            scrollEventThrottle={16}
          >
            {/* Hero Section */}
            <Animated.View
              style={[
                styles.heroSection,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <View style={styles.logoPlaceholder}>
                <Image
                  source={require("../assets/images/icon.png")}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
              
              <Text style={styles.heroTitle}>
                Claim Your .KE Digital Identity
              </Text>
              <View style={styles.titleUnderline} />
              
              <Text style={styles.heroSubtitle}>
                Get your verified EduID, secure your .KE subdomain, and unlock 
                trusted job opportunities in Kenya and beyond.
              </Text>

              <View style={styles.ctaContainer}>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => router.push("/profile-selection")}
                  accessibilityLabel="Get started with your digital identity"
                  accessibilityRole="button"
                >
                  <Text style={styles.primaryButtonText}>Get Started</Text>
                  <ChevronRight color={Colors.white} size={20} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => router.push("/login")}
                  accessibilityLabel="Sign in to your account"
                  accessibilityRole="button"
                >
                  <Text style={styles.secondaryButtonText}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* Value Highlights */}
            <View style={styles.highlightsSection}>
              <Text style={styles.sectionTitle}>Why Choose .KE Identity?</Text>

              <View style={styles.highlightsGrid}>
                {valueHighlights.map((item, index) => (
                  <Animated.View
                    key={index}
                    style={[
                      styles.highlightCard,
                      isSmallScreen ? styles.cardFull : styles.cardHalf,
                    ]}
                  >
                    <View style={styles.highlightIcon}>
                      <item.icon color={Colors.green} size={24} />
                    </View>
                    <View style={styles.highlightContent}>
                      <Text style={styles.highlightTitle}>{item.title}</Text>
                      <Text style={styles.highlightDescription}>
                        {item.description}
                      </Text>
                    </View>
                  </Animated.View>
                ))}
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Powered by Kenya Education Network
              </Text>
            </View>
          </Animated.ScrollView>
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
  topBar: {
    height: 44,
    backgroundColor: Colors.black,
    width: '100%',
  },
  scrollView: {
    flex: 1,
  },
  heroSection: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 60,
    minHeight: height * 0.7,
    justifyContent: "center",
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.lightGray,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  logoImage: {
    width: 72,
    height: 72,
    borderRadius: 16,
  },
  logoText: {
    fontSize: 32,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: Colors.black,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 40,
  },
  titleUnderline: {
    height: 4,
    width: 96,
    backgroundColor: Colors.red,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  heroSubtitle: {
    fontSize: 16,
    color: "rgba(0, 0, 0, 0.7)",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 8,
  },
  ctaContainer: {
    width: "100%",
    alignItems: "center",
    gap: 16,
  },
  primaryButton: {
    backgroundColor: Colors.red,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minWidth: 200,
    justifyContent: "center",
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.black,
    borderRadius: 12,
  },
  secondaryButtonText: {
    color: Colors.black,
    fontSize: 16,
    textDecorationLine: "underline",
  },
  highlightsSection: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  highlightsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.black,
    textAlign: "center",
    marginBottom: 32,
  },
  highlightCard: {
    flexDirection: "row",
    backgroundColor: "rgba(0, 0, 0, 0.04)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: "center",
  },
  cardHalf: {
    width: "48%",
    flexBasis: "48%",
    maxWidth: "48%",
  },
  cardFull: {
    width: "100%",
  },
  highlightIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0, 102, 0, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  highlightContent: {
    flex: 1,
  },
  highlightTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.black,
    marginBottom: 4,
  },
  highlightDescription: {
    fontSize: 14,
    color: "rgba(0, 0, 0, 0.7)",
    lineHeight: 20,
  },
  footer: {
    alignItems: "center",
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 12,
    color: "rgba(0, 0, 0, 0.6)",
  },
  getStartedButton: {
    backgroundColor: Colors.red,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },
});
