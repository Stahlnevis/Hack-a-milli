import { router } from "expo-router";
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Building2, CheckCircle, Upload, FileText, Mail } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import Colors from "./dashboard/constants/colors";

const { width, height } = Dimensions.get('window');

export default function VerifyCompanyScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [docs, setDocs] = useState({
    kraPin: false,
    certOfIncorp: false,
    businessPermit: false,
    domainEmailVerified: false,
  });
  const [kraImage, setKraImage] = useState<string | null>(null);
  const [certImage, setCertImage] = useState<string | null>(null);
  const [permitImage, setPermitImage] = useState<string | null>(null);
  const [logoImage, setLogoImage] = useState<string | null>(null);

  const pickImage = async (kind: 'kra' | 'cert' | 'permit') => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (result.canceled || !result.assets?.length) return;
    const uri = result.assets[0].uri;
    if (kind === 'kra') { setKraImage(uri); setDocs((d)=>({ ...d, kraPin: true })); }
    if (kind === 'cert') { setCertImage(uri); setDocs((d)=>({ ...d, certOfIncorp: true })); }
    if (kind === 'permit') { setPermitImage(uri); setDocs((d)=>({ ...d, businessPermit: true })); }
    
  };

  const handleSendDomainEmail = () => {
    // Placeholder: in a real app, call backend to send a verification link to company's domain email
    setDocs((d)=>({ ...d, domainEmailVerified: true }));
  };

  const handleVerification = () => {
    const allDone = Object.values(docs).every(Boolean);
    if (!allDone) return;
    setIsLoading(true);
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
                <Building2 color={Colors.red} size={32} />
              </View>
              <Text style={styles.title}>Company Verification</Text>
              <Text style={styles.subtitle}>
                We're verifying your company details with KRA and other official records.
              </Text>
            </View>

            <View style={styles.steps}>
              <View style={[styles.stepCard, docs.kraPin && styles.stepDone]}>
                <View style={styles.stepIcon}><FileText color={Colors.red} size={18} /></View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Upload KRA PIN/Tax Letter</Text>
                  <Text style={styles.stepDesc}>Clear image or PDF screenshot</Text>
                  {!docs.kraPin && (
                    <TouchableOpacity style={styles.actionBtn} onPress={() => pickImage('kra')}>
                      <Upload color={Colors.white} size={16} />
                      <Text style={styles.actionText}>Choose File</Text>
                    </TouchableOpacity>
                  )}
                </View>
                {docs.kraPin && <CheckCircle color="#00C65A" size={20} />}
              </View>

              <View style={[styles.stepCard, docs.certOfIncorp && styles.stepDone]}>
                <View style={styles.stepIcon}><FileText color={Colors.red} size={18} /></View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Upload Certificate of Incorporation</Text>
                  <Text style={styles.stepDesc}>Company registration certificate</Text>
                  {!docs.certOfIncorp && (
                    <TouchableOpacity style={styles.actionBtn} onPress={() => pickImage('cert')}>
                      <Upload color={Colors.white} size={16} />
                      <Text style={styles.actionText}>Choose File</Text>
                    </TouchableOpacity>
                  )}
                </View>
                {docs.certOfIncorp && <CheckCircle color="#00C65A" size={20} />}
              </View>

              <View style={[styles.stepCard, docs.businessPermit && styles.stepDone]}>
                <View style={styles.stepIcon}><FileText color={Colors.red} size={18} /></View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Upload Valid Business Permit</Text>
                  <Text style={styles.stepDesc}>Latest county or national permit</Text>
                  {!docs.businessPermit && (
                    <TouchableOpacity style={styles.actionBtn} onPress={() => pickImage('permit')}>
                      <Upload color={Colors.white} size={16} />
                      <Text style={styles.actionText}>Choose File</Text>
                    </TouchableOpacity>
                  )}
                </View>
                {docs.businessPermit && <CheckCircle color="#00C65A" size={20} />}
              </View>

              <View style={[styles.stepCard, docs.domainEmailVerified && styles.stepDone]}>
                <View style={styles.stepIcon}><Mail color={Colors.red} size={18} /></View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Verify Business Email Domain</Text>
                  <Text style={styles.stepDesc}>We'll send a code to your business email</Text>
                  {!docs.domainEmailVerified && (
                    <TouchableOpacity style={styles.actionBtn} onPress={handleSendDomainEmail}>
                      <Mail color={Colors.white} size={16} />
                      <Text style={styles.actionText}>Send Verification</Text>
                    </TouchableOpacity>
                  )}
                </View>
                {docs.domainEmailVerified && <CheckCircle color="#00C65A" size={20} />}
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.continueButton,
                { opacity: isLoading ? 0.7 : Object.values(docs).every(Boolean) ? 1 : 0.7 },
              ]}
              onPress={handleVerification}
              disabled={isLoading || !Object.values(docs).every(Boolean)}
              accessibilityLabel="Continue to dashboard"
              accessibilityRole="button"
            >
              <Text style={styles.continueButtonText}>
                {isLoading ? "Submitting..." : "Submit for Review"}
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
  steps: { 
    gap: height > 800 ? 16 : 12, 
    marginBottom: 32 
  },
  stepCard: { 
    flexDirection: "row", 
    alignItems: "center", 
    backgroundColor: Colors.white, 
    padding: width > 768 ? 20 : 16, 
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
    shadowColor: "rgba(0, 0, 0, 0.1)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  stepDone: { 
    borderWidth: 2, 
    borderColor: "#006600" 
  },
  stepIcon: { 
    width: width > 768 ? 48 : 40, 
    height: width > 768 ? 48 : 40, 
    borderRadius: width > 768 ? 24 : 20, 
    alignItems: "center", 
    justifyContent: "center", 
    backgroundColor: "rgba(206, 17, 38, 0.18)", 
    marginRight: 12 
  },
  stepContent: { 
    flex: 1 
  },
  stepTitle: { 
    color: Colors.black, 
    fontWeight: "600", 
    fontSize: width > 768 ? 18 : 16, 
    marginBottom: 4 
  },
  stepDesc: { 
    color: "rgba(0,0,0,0.7)", 
    fontSize: width > 768 ? 15 : 14,
    marginBottom: 8
  },
  actionBtn: { 
    marginTop: 10, 
    backgroundColor: Colors.red, 
    paddingVertical: width > 1000 ? 10 : 10, 
    borderRadius: 8, 
    alignItems: "center", 
    flexDirection: "row", 
    justifyContent: "center", 
    gap: 10, 
  
  },
  actionText: { 
    color: Colors.white, 
    fontWeight: "600",
    fontSize: width > 500? 15 : 14,
  },
  continueButton: {
    backgroundColor: Colors.red,
    paddingVertical: width > 768 ? 18 : 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  continueButtonText: {
    color: Colors.white,
    fontSize: width > 768 ? 18 : 16,
    fontWeight: "600",
  },
});


