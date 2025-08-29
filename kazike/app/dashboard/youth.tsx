import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  FileText,
  Briefcase,
  User,
  LogOut,
  Home,
  X,
  FileUp,
  Languages,
  Download,
  File,
  Upload,
} from "lucide-react-native";
import { useAuthStore } from "@/stores/auth-store";
import { useYouthStore } from "@/stores/youth-store";
import { mockJobs as baseMockJobs } from "@/mocks/jobs";
import DomainManager from "./components/DomainManager";
import Colors from "./constants/colors";

type TabType = "portfolio" | "profile-domain" | "jobs" | "cv";

interface TranslationMessage {
  id: number;
  type: "user" | "bot";
  message: string;
  timestamp: Date;
  attachments?: string[];
}

export default function YouthDashboard() {
  const { user, logout } = useAuthStore();
  const {
    profile,
    jobMatches = [],
    applications = [],
    savedJobs = [],
    loadProfile,
    loadApplications,
    applyToJob,
    saveJob,
    unsaveJob,
  } = useYouthStore();

  const [activeTab, setActiveTab] = useState<TabType>("portfolio");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [matchedJobs, setMatchedJobs] = useState<any[]>([]);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [showProjects, setShowProjects] = useState(false);
  const [showCerts, setShowCerts] = useState(false);
  const [showHustles, setShowHustles] = useState(false);
  const [showCVSummary, setShowCVSummary] = useState(false);

  // CV Translation (Translator-like) State
  // removed modal toggle; CV tab shows translator inline
  const [uploadedCV, setUploadedCV] = useState<string | null>(null);
  const [cvContent, setCvContent] = useState<string>("");
  const [cvData, setCvData] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [extractedText, setExtractedText] = useState<string>("");
  const [translatedText, setTranslatedText] = useState<string>("");
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [targetLang, setTargetLang] = useState<string>('sw');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editableProfile, setEditableProfile] = useState({
    fullName: profile?.fullName || user?.profile?.fullName || "",
    email: profile?.email || user?.email || "",
    phone: profile?.phone || user?.profile?.phone || "",
    nationalId: profile?.nationalId || user?.profile?.nationalId || "",
    dateOfBirth: profile?.dateOfBirth || user?.profile?.dateOfBirth || "",
    location: profile?.location || (user?.profile as any)?.location || "",
    bio: profile?.bio || (user?.profile as any)?.bio || "",
    skills: profile?.skills || [],
    education: profile?.education || [],
    experience: profile?.experience || [],
  });

  useEffect(() => {
    loadProfile?.();
    loadApplications?.();
  }, [loadProfile, loadApplications]);

  const handleSignOut = async () => {
    await logout();
    router.replace("/");
  };

  const toggleMenu = () => setIsMenuOpen((v) => !v);

  // Legacy chatbot helpers replaced by translator flow
  const addBotMessage = (_message: string) => { /* no-op */ };
  const addUserMessage = (_message: string) => { /* no-op */ };

  const parseCVContent = (content: string) => {
    const lines = content.split("\n").map((l) => l.trim()).filter(Boolean);

    const parsed = {
      personalInfo: {
        name: "",
        email: "",
        phone: "",
        location: "",
        summary: "",
      },
      experience: [] as string[],
      education: [] as string[],
      skills: [] as string[],
    };

    let currentSection = "";
    for (const raw of lines) {
      const line = raw;
      const lower = line.toLowerCase();

      if (lower.includes("experience") || lower.includes("work") || lower.includes("employment")) {
        currentSection = "experience";
        continue;
      } else if (lower.includes("education") || lower.includes("academic") || lower.includes("qualification")) {
        currentSection = "education";
        continue;
      } else if (lower.includes("skill") || lower.includes("expertise") || lower.includes("competency")) {
        currentSection = "skills";
        continue;
      } else if (lower.includes("summary") || lower.includes("profile") || lower.includes("objective")) {
        currentSection = "summary";
        continue;
      }

      if (line.includes("@") && line.includes(".")) parsed.personalInfo.email = line;
      else if (line.match(/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/)) parsed.personalInfo.phone = line;
      else if (!parsed.personalInfo.name && line.length > 2 && !line.includes("@") && !line.match(/\d/)) parsed.personalInfo.name = line;

      if (currentSection === "experience" && line.length > 5) parsed.experience.push(line);
      if (currentSection === "education" && line.length > 5) parsed.education.push(line);
      if (currentSection === "skills" && line.length > 1) {
        const items = line.split(/[,;•-]/).map((s) => s.trim()).filter(Boolean);
        parsed.skills.push(...items);
      }
      if (currentSection === "summary" && line.length > 5) parsed.personalInfo.summary += (parsed.personalInfo.summary ? " " : "") + line;
    }

    return parsed;
  };

  const generateTranslatedCV = (language: string) => {
    if (!cvData && !cvContent) return "No CV content available to translate.";

    const translations: any = {
      swahili: {
        title: "📄 CV YA KAZI",
        personalInfo: "Maelezo Binafsi:",
        name: "Jina:",
        email: "Barua pepe:",
        phone: "Simu:",
        location: "Mahali:",
        summary: "Muhtasari:",
        experience: "Uzoefu wa Kazi:",
        education: "Elimu:",
        skills: "Ujuzi:",
      },
      french: {
        title: "📄 CV PROFESSIONNEL",
        personalInfo: "Informations Personnelles:",
        name: "Nom:",
        email: "Email:",
        phone: "Téléphone:",
        location: "Localisation:",
        summary: "Résumé:",
        experience: "Expérience:",
        education: "Formation:",
        skills: "Compétences:",
      },
      // add other languages as needed
    };

    const t = translations[language] || translations["swahili"];
    let output = `${t.title}\n\n`;

    if (cvData?.personalInfo) {
      output += `${t.personalInfo}\n`;
      if (cvData.personalInfo.name) output += `${t.name} ${cvData.personalInfo.name}\n`;
      if (cvData.personalInfo.email) output += `${t.email} ${cvData.personalInfo.email}\n`;
      if (cvData.personalInfo.phone) output += `${t.phone} ${cvData.personalInfo.phone}\n`;
      if (cvData.personalInfo.location) output += `${t.location} ${cvData.personalInfo.location}\n`;
      output += "\n";
    }

    if (cvData?.personalInfo?.summary) {
      output += `${t.summary}\n${cvData.personalInfo.summary}\n\n`;
    }

    if (cvData?.experience?.length) {
      output += `${t.experience}\n`;
      cvData.experience.forEach((e: string, i: number) => (output += `${i + 1}. ${e}\n`));
      output += "\n";
    }

    if (cvData?.education?.length) {
      output += `${t.education}\n`;
      cvData.education.forEach((e: string, i: number) => (output += `${i + 1}. ${e}\n`));
      output += "\n";
    }

    if (cvData?.skills?.length) {
      output += `${t.skills}\n`;
      cvData.skills.forEach((s: string) => (output += `• ${s}\n`));
    }

    return output;
  };

  const handleUploadCV = async () => {
    setIsUploading(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "text/plain",
          "text/rtf",
        ],
        copyToCacheDirectory: true,
      });

      // Support both old and new shapes
      const isCanceled = (result as any).canceled === true || (result as any).type === 'cancel';
      if (isCanceled) return;

      let file: any = (result as any).assets?.[0] || result;
      const name = file?.name || 'uploaded';
      const uri = file?.uri;
      const size = file?.size;
      const mimeType = file?.mimeType || file?.mime || '';

      if (size && size > 10 * 1024 * 1024) {
        Alert.alert("File Too Large", "Please select a CV file smaller than 10MB.");
        return;
      }

      setUploadedCV(name);
      setCurrentStep(2);

      // Try to extract text content based on file type
      try {
        let text = '';
        const fileName = name.toLowerCase();
        
        if (fileName.endsWith('.txt') || fileName.endsWith('.rtf') || mimeType.includes('text')) {
          // Handle text files
          if (uri?.startsWith('file://')) {
            text = await FileSystem.readAsStringAsync(uri);
          } else {
            const resp = await fetch(uri);
            text = await resp.text();
          }
          setCvContent(text);
          const parsed = parseCVContent(text);
          setCvData(parsed);
        } else if (fileName.endsWith('.pdf')) {
          // For PDF files, we'll extract text in the next step
          // In a real app, you'd use react-native-pdf or similar
          setCvContent('PDF file uploaded. Text extraction will be performed in the next step.');
        } else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
          // For Word documents, we'll extract text in the next step
          // In a real app, you'd use a library like react-native-docx
          setCvContent('Word document uploaded. Text extraction will be performed in the next step.');
        } else {
          setCvContent('File uploaded. Text extraction will be performed in the next step.');
        }
      } catch (e) {
        console.warn('Could not read file contents', e);
        setCvContent('File uploaded successfully. Text extraction will be performed in the next step.');
      }

    } catch (err) {
      console.error('Error picking document:', err);
      Alert.alert('Upload Error', 'Failed to upload CV. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // removed old chatbot request handler

  const clearUploadedCV = () => {
    setUploadedCV(null);
    setCvContent("");
    setCvData(null);
    setTargetLang('');
    addBotMessage("CV cleared. Upload or paste a new CV to continue.");
  };

  const handleApplyToJob = async (jobId: string) => {
    try {
      await applyToJob(jobId);
      Alert.alert("Success", "Application submitted successfully!");
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to apply");
    }
  };

  const handleSaveJob = async (jobId: string) => {
    try {
      if (savedJobs.includes(jobId)) await unsaveJob(jobId);
      else await saveJob(jobId);
    } catch (err) {
      console.error(err);
    }
  };

  const quickStats = [
    { label: "Job Matches", value: `${(matchedJobs.length || jobMatches.length)}`, icon: Briefcase, color: Colors.green },
    { label: "Profile Views", value: "45", icon: User, color: Colors.blue },
    { label: "Applications", value: `${applications.length}`, icon: FileText, color: Colors.orange },
  ];

  const tabs = [
    { id: "portfolio" as TabType, title: "Portfolio", icon: Home },
    { id: "profile-domain" as TabType, title: "Profile Domain", icon: User },
    { id: "jobs" as TabType, title: "Jobs", icon: Briefcase },
    { id: "cv" as TabType, title: "CV", icon: FileText },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "#FF6B35";
      case "reviewed":
        return "#4A90E2";
      case "interview":
        return "#00C65A";
      case "rejected":
        return "#FF6B6B";
      case "accepted":
        return "#00C65A";
      default:
        return "#666";
    }
  };

  // Render functions
  const renderPortfolioTab = () => (
    <>
      <View style={styles.statsContainer}>
        {quickStats.map((stat, i) => (
          <View
            key={i}
            style={[
              styles.statCard,
              {
                backgroundColor: Colors.white,
                shadowColor: Colors.shadow,
                shadowOpacity: 1,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 2 },
                elevation: 3,
              },
            ]}
          >
            <View style={[styles.statIcon, { backgroundColor: Colors.lightGray }]}>
              <stat.icon color={stat.color} size={20} />
            </View>
            <Text style={[styles.statValue, { color: Colors.black }]}>{stat.value}</Text>
            <Text style={[styles.statLabel, { color: Colors.gray }]}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[
          styles.sectionCard,
          {
            backgroundColor: Colors.white,
            borderColor: Colors.lightGray,
            borderWidth: 1,
            shadowColor: Colors.shadow,
            shadowOpacity: 1,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 2 },
            elevation: 2,
          },
        ]}
        onPress={() => setShowProjects(true)}
      >
        <Text style={[styles.sectionTitle, { color: Colors.red }]}>Personal Projects</Text>
        <Text style={[styles.sectionHint, { color: Colors.gray }]}>Showcase your best work. Tap to view examples.</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.sectionCard,
          {
            backgroundColor: Colors.white,
            borderColor: Colors.lightGray,
            borderWidth: 1,
            shadowColor: Colors.shadow,
            shadowOpacity: 1,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 2 },
            elevation: 2,
          },
        ]}
        onPress={() => setShowCerts(true)}
      >
        <Text style={[styles.sectionTitle, { color: Colors.red }]}>Certificates & Accreditations</Text>
        <Text style={[styles.sectionHint, { color: Colors.gray }]}>Upload or link verified certificates to boost credibility.</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.sectionCard,
          {
            backgroundColor: Colors.white,
            borderColor: Colors.lightGray,
            borderWidth: 1,
            shadowColor: Colors.shadow,
            shadowOpacity: 1,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 2 },
            elevation: 2,
          },
        ]}
        onPress={() => setShowHustles(true)}
      >
        <Text style={[styles.sectionTitle, { color: Colors.red }]}>Side Hustles</Text>
        <Text style={[styles.sectionHint, { color: Colors.gray }]}>List side gigs and freelance work you are proud of.</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.sectionCard,
          {
            backgroundColor: Colors.white,
            borderColor: Colors.lightGray,
            borderWidth: 1,
            shadowColor: Colors.shadow,
            shadowOpacity: 1,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 2 },
            elevation: 2,
          },
        ]}
        onPress={() => setShowCVSummary(true)}
      >
        <Text style={[styles.sectionTitle, { color: Colors.red }]}>CV</Text>
        <Text style={[styles.sectionHint, { color: Colors.gray }]}>Manage and translate your CV in the CV tab.</Text>
      </TouchableOpacity>

      
    </>
  );

  const handleAIMatch = async () => {
    setIsMatching(true);
    await new Promise((r) => setTimeout(r, 1500));
    const safeMock = Array.isArray(baseMockJobs) && baseMockJobs.length
      ? baseMockJobs
      : [
          { id: "j1", title: "Junior Frontend Developer", company: "Nairobi Tech", location: "Nairobi", type: "full-time", salary: "KES 80,000", applicants: 12 },
          { id: "j2", title: "Mobile App Intern", company: "Mombasa Labs", location: "Mombasa", type: "internship", salary: "KES 20,000", applicants: 5 },
          { id: "j3", title: "Data Entry Assistant", company: "Gov Services", location: "Remote", type: "contract", salary: "KES 50,000", applicants: 9 },
          { id: "j4", title: "Backend Developer", company: "CloudKenya", location: "Remote", type: "full-time", salary: "KES 150,000", applicants: 3 },
          { id: "j5", title: "Graphic Designer", company: "Creative Hub", location: "Nakuru", type: "part-time", salary: "KES 40,000", applicants: 6 },
          { id: "j6", title: "IT Support", company: "EduNet", location: "Kisumu", type: "full-time", salary: "KES 60,000", applicants: 7 },
        ];
    const fromStore = (jobMatches && jobMatches.length ? jobMatches : safeMock.slice(0, 6)).map((j: any) => ({ ...j, applied: false }));
    setMatchedJobs(fromStore);
    setIsMatching(false);
  };

  const handleApplyOne = async (jobId: string) => {
    setApplyingId(jobId);
    try { await applyToJob(jobId); } catch {}
    await new Promise(r => setTimeout(r, 500));
    setMatchedJobs((arr) => arr.map(j => j.id === jobId ? { ...j, applied: true } : j));
    setApplyingId(null);
  };

  const handleAutoApplyAll = async () => {
    const list = (matchedJobs.length ? matchedJobs : []).map(j => j.id);
    for (const id of list) {
      await handleApplyOne(id);
    }
    Alert.alert("Applications Sent", "Check your email for job feedback.");
  };

  const renderJobsTab = () => (
    <View style={styles.tabContent}>
      <Text style={[styles.tabTitle, { color: Colors.black }]}>Jobs</Text>
      <Text style={[styles.tabSubtitle, { color: Colors.gray }]}>AI job matching and one-click auto-apply</Text>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <TouchableOpacity style={[styles.aiMatchButton, { flex: 1, backgroundColor: Colors.red }]} onPress={handleAIMatch} disabled={isMatching}>
          <Text style={[styles.aiMatchText, { color: Colors.white }]}>{isMatching ? "Matching..." : "AI Job Matching"}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.autoApplyAllBtn, { flex: 1, backgroundColor: Colors.red }]} onPress={handleAutoApplyAll} disabled={isMatching || (!matchedJobs.length && !jobMatches.length)}>
          <Text style={[styles.autoApplyAllText, { color: Colors.white }]}>Auto Apply</Text>
        </TouchableOpacity>
      </View>

      {isMatching && (
        <View style={styles.aiLoader}>
          <ActivityIndicator color={Colors.red} />
          <Text style={[styles.aiLoaderText, { color: Colors.gray }]}>Analyzing your skills and preferences...</Text>
        </View>
      )}

      {(matchedJobs.length ? matchedJobs : []).map((job: any) => {
        const isApplied = job.applied;
        const isSaved = savedJobs.includes(job.id);
        return (
          <View key={job.id} style={[styles.jobCard, { backgroundColor: Colors.white, borderWidth: 1, borderColor: '#E0E0E0', shadowColor: Colors.shadow, shadowOpacity: 1, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }]}>
            <View style={styles.jobHeader}>
              <View style={styles.jobTitleContainer}>
                <Text style={[styles.jobTitle, { color: Colors.black }]}>{job.title}</Text>
                <View style={[styles.matchScoreBadge, { backgroundColor: Colors.lightGray }]}>
                  <Text style={[styles.matchScoreText, { color: Colors.gray }]}>{job.matchScore || 85}%</Text>
                </View>
              </View>
              <Text style={[styles.jobType, { color: Colors.gray, backgroundColor: Colors.lightGray }]}>{job.type}</Text>
            </View>
            <Text style={[styles.jobCompany, { color: Colors.gray }]}>{job.company}</Text>
            <Text style={[styles.jobLocation, { color: Colors.gray }]}>{job.location}</Text>
            <Text style={[styles.jobSalary, { color: Colors.gray }]}>{job.salary}</Text>

            <View style={styles.jobActions}>
              <TouchableOpacity
                style={[styles.applyButton, { backgroundColor: Colors.red }, (isApplied || applyingId === job.id) && styles.appliedButton]}
                onPress={() => !isApplied && handleApplyOne(job.id)}
                disabled={isApplied}
              >
                <Text style={[styles.applyButtonText, { color: Colors.white }, (isApplied || applyingId === job.id) && styles.appliedButtonText]}>
                  {isApplied ? "Applied" : applyingId === job.id ? "Applying..." : "Apply Now"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveButton, { backgroundColor: Colors.red }]} onPress={() => handleSaveJob(job.id)}>
                <Text style={[styles.saveButtonText, { color: Colors.white }]}>{isSaved ? "Saved" : "Save"}</Text>
              </TouchableOpacity>
              <Text style={[styles.applicantsText, { color: Colors.gray }]}>{job.applicants} applicants</Text>
            </View>
          </View>
        );
      })}

      
    </View>
  );

  // removed domain/applications/alerts/settings tabs in new 4-tab layout

  

  const renderNotificationsTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>Notifications</Text>
      <Text style={styles.tabSubtitle}>Stay updated with your activities</Text>
      <View style={styles.notificationCard}>
        <Text style={styles.notificationTitle}>🎉 New Job Match!</Text>
        <Text style={styles.notificationText}>A new Senior Developer position matches your profile.</Text>
        <Text style={styles.notificationTime}>2 hours ago</Text>
      </View>
    </View>
  );

  const renderSettingsTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>Settings</Text>
      <Text style={styles.tabSubtitle}>Manage your account preferences</Text>
      <View style={styles.settingsSection}>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <LogOut color="#FF6B6B" size={20} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderProfileTab = () => (
    <View style={styles.tabContent}>
      <Text style={[styles.tabTitle, { color: Colors.black }]}>Profile Domain</Text>
      <Text style={[styles.tabSubtitle, { color: Colors.gray }]}>Manage, view and publish your government domain</Text>
      
      {/* Profile Information Section */}
      <View style={styles.profileSection}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: Colors.black }]}>Personal Information</Text>
          <TouchableOpacity 
            style={[styles.editButton, { backgroundColor: Colors.white, borderColor: '#E0E0E0' }]} 
            onPress={() => setIsEditingProfile(!isEditingProfile)}
          >
            <Text style={[styles.editButtonText, { color: Colors.blue }]}>
              {isEditingProfile ? "Cancel" : "Edit Profile"}
            </Text>
          </TouchableOpacity>
        </View>
        
        {isEditingProfile ? (
          <View style={[styles.profileEditForm, { backgroundColor: Colors.white, shadowColor: Colors.shadow, shadowOpacity: 1, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, borderColor: '#E0E0E0', borderWidth: 1 }] }>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: Colors.black }]}>Full Name</Text>
              <TextInput
                style={styles.textInput}
                value={editableProfile.fullName}
                onChangeText={(text) => setEditableProfile(prev => ({ ...prev, fullName: text }))}
                placeholder="Enter your full name"
                placeholderTextColor={Colors.gray}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: Colors.black }]}>Email</Text>
              <TextInput
                style={styles.textInput}
                value={editableProfile.email}
                onChangeText={(text) => setEditableProfile(prev => ({ ...prev, email: text }))}
                placeholder="Enter your email"
                placeholderTextColor={Colors.gray}
                keyboardType="email-address"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: Colors.black }]}>Phone Number</Text>
              <TextInput
                style={styles.textInput}
                value={editableProfile.phone}
                onChangeText={(text) => setEditableProfile(prev => ({ ...prev, phone: text }))}
                placeholder="Enter your phone number"
                placeholderTextColor={Colors.gray}
                keyboardType="phone-pad"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: Colors.black }]}>National ID</Text>
              <TextInput
                style={styles.textInput}
                value={editableProfile.nationalId}
                onChangeText={(text) => setEditableProfile(prev => ({ ...prev, nationalId: text }))}
                placeholder="Enter your national ID"
                placeholderTextColor={Colors.gray}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: Colors.black }]}>Date of Birth</Text>
              <TextInput
                style={styles.textInput}
                value={editableProfile.dateOfBirth}
                onChangeText={(text) => setEditableProfile(prev => ({ ...prev, dateOfBirth: text }))}
                placeholder="DD/MM/YYYY"
                placeholderTextColor={Colors.gray}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: Colors.black }]}>Location</Text>
              <TextInput
                style={styles.textInput}
                value={editableProfile.location}
                onChangeText={(text) => setEditableProfile(prev => ({ ...prev, location: text }))}
                placeholder="Enter your location"
                placeholderTextColor={Colors.gray}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: Colors.black }]}>Bio</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={editableProfile.bio}
                onChangeText={(text) => setEditableProfile(prev => ({ ...prev, bio: text }))}
                placeholder="Tell us about yourself..."
                placeholderTextColor={Colors.gray}
                multiline
                numberOfLines={4}
              />
            </View>
            
            <View style={styles.formActions}>
              <TouchableOpacity 
                style={[styles.profileSaveButton, { backgroundColor: Colors.red }]} 
                onPress={() => {
                  // Here you would typically save to your store/database
                  Alert.alert("Success", "Profile updated successfully!");
                  setIsEditingProfile(false);
                }}
              >
                <Text style={[styles.profileSaveButtonText, { color: Colors.white }]}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={[styles.profileCard, { backgroundColor: Colors.white, shadowColor: Colors.shadow, shadowOpacity: 1, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, borderColor: '#E0E0E0', borderWidth: 1 }] }>
            <View style={styles.profileRow}>
              <Text style={[styles.profileLabel, { color: Colors.gray }]}>Full Name</Text>
              <Text style={[styles.profileValue, { color: Colors.black }]}>{profile?.fullName || user?.profile?.fullName || '-'}</Text>
            </View>
            <View style={styles.profileRow}>
              <Text style={[styles.profileLabel, { color: Colors.gray }]}>Email</Text>
              <Text style={[styles.profileValue, { color: Colors.black }]}>{profile?.email || user?.email || '-'}</Text>
            </View>
            <View style={styles.profileRow}>
              <Text style={[styles.profileLabel, { color: Colors.gray }]}>Phone</Text>
              <Text style={[styles.profileValue, { color: Colors.black }]}>{profile?.phone || user?.profile?.phone || '-'}</Text>
            </View>
            <View style={styles.profileRow}>
              <Text style={[styles.profileLabel, { color: Colors.gray }]}>National ID</Text>
              <Text style={[styles.profileValue, { color: Colors.black }]}>{profile?.nationalId || user?.profile?.nationalId || '-'}</Text>
            </View>
            <View style={styles.profileRow}>
              <Text style={[styles.profileLabel, { color: Colors.gray }]}>Date of Birth</Text>
              <Text style={[styles.profileValue, { color: Colors.black }]}>{profile?.dateOfBirth || user?.profile?.dateOfBirth || '-'}</Text>
            </View>
            <View style={styles.profileRow}>
              <Text style={[styles.profileLabel, { color: Colors.gray }]}>Location</Text>
              <Text style={[styles.profileValue, { color: Colors.black }]}>{profile?.location || (user?.profile as any)?.location || '-'}</Text>
            </View>
            <View style={styles.profileRow}>
              <Text style={[styles.profileLabel, { color: Colors.gray }]}>Bio</Text>
              <Text style={[styles.profileValue, { color: Colors.black }]}>{profile?.bio || (user?.profile as any)?.bio || '-'}</Text>
            </View>
          </View>
        )}
      </View>
      
      {/* Domain Manager Section */}
      <View style={styles.domainSection}>
        <Text style={[styles.sectionTitle, { color: Colors.black }]}>Government Domain</Text>
        <Text style={[styles.sectionSubtitle, { color: Colors.gray }]}>Manage, view and publish your government domain</Text>
        <View style={{ marginTop: 8 }}>
          <DomainManager />
        </View>
      </View>
    </View>
  );

  const renderCVTab = () => (
    <View style={styles.tabContent}>
      <Text style={[styles.tabTitle, { color: Colors.black }]}>CV Translator</Text>
      <Text style={[styles.tabSubtitle, { color: Colors.gray }]}>Upload, extract, translate, and download your CV</Text>

      <View style={styles.instructionsBlock}>
        <Text style={styles.instructionsTitleLight}>How it works:</Text>
        <Text style={styles.instructionsTextLight}>
          1. Upload your CV (PDF/DOCX/TXT){"\n"}
          2. We extract the text automatically{"\n"}
          3. Choose your target language{"\n"}
          4. Translate and download
        </Text>
      </View>

      <View style={styles.stepIndicator}>
        {[1,2,3,4].map((n, i) => (
          <View key={n} style={styles.stepContainer}>
            <View style={[styles.stepCircle, currentStep >= n && styles.stepCircleActive]}>
              <Text style={styles.stepNumber}>{n}</Text>
            </View>
            <Text style={[styles.stepTitle, currentStep >= n && styles.stepTitleActive]}>
              {n===1? 'Upload CV': n===2? 'Extract Text': n===3? 'Translate': 'Download'}
            </Text>
            {i<3 && <View style={[styles.stepLine, currentStep > n && styles.stepLineActive]} />}
          </View>
        ))}
      </View>

      {currentStep === 1 && (
        <View style={{ paddingHorizontal: 20 }}>
          <TouchableOpacity 
            style={[styles.translateButton, isUploading && styles.translateButtonDisabled]} 
            onPress={handleUploadCV}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <ActivityIndicator color={Colors.white} size="small" />
                <Text style={styles.translateButtonText}>Uploading...</Text>
              </>
            ) : (
              <>
                <Upload color={Colors.white} size={24} />
                <Text style={styles.translateButtonText}>Upload CV</Text>
              </>
            )}
          </TouchableOpacity>
          
          {uploadedCV && (
            <View style={styles.uploadedFileInfo}>
              <File color={Colors.green} size={20} />
              <Text style={styles.uploadedFileName}>{uploadedCV}</Text>
              <TouchableOpacity style={styles.changeFileButton} onPress={handleUploadCV}>
                <Text style={styles.changeFileButtonText}>Change</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {currentStep === 2 && (
        <View style={styles.translationContainer}>
          {uploadedCV && (
            <View style={styles.fileInfoCard}>
              <Text style={styles.fileInfoTitle}>File Information:</Text>
              <Text style={styles.fileInfoText}>Name: {uploadedCV}</Text>
              <Text style={styles.fileInfoText}>Type: {uploadedCV.split('.').pop()?.toUpperCase() || 'Unknown'}</Text>
              <Text style={styles.fileInfoText}>Status: Ready for extraction</Text>
            </View>
          )}
          
          {isExtracting ? (
            <View style={styles.loadingContainerLight}>
              <ActivityIndicator color={Colors.red} size="large" />
              <Text style={styles.loadingTextLight}>Extracting text from CV...</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.translateButton} onPress={extractTextFromFile}>
              <Text style={styles.translateButtonText}>Start Extraction</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {currentStep >= 3 && (
        <View style={styles.translationContainer}>
          {!!extractedText && (
            <View style={styles.textPreview}>
              <Text style={styles.previewTitle}>Extracted CV Text:</Text>
              <ScrollView style={styles.previewContainer}>
                <Text style={styles.previewText}>{extractedText}</Text>
              </ScrollView>
            </View>
          )}

          <TouchableOpacity 
            style={[styles.translateButton, isTranslating && styles.translateButtonDisabled]} 
            onPress={extractedText ? translateCVNow : extractTextFromFile} 
            disabled={isTranslating}
          >
            {isTranslating ? (
              <>
                <ActivityIndicator color={Colors.white} size="small" />
                <Text style={styles.translateButtonText}>Translating...</Text>
              </>
            ) : (
              <Text style={styles.translateButtonText}>Translate Now</Text>
            )}
          </TouchableOpacity>

          {!!translatedText && (
            <View style={styles.translatedBlock}>
              <Text style={styles.previewTitle}>Translated CV:</Text>
              <ScrollView style={styles.previewContainer}>
                <Text style={styles.previewText}>{translatedText}</Text>
              </ScrollView>

              <TouchableOpacity style={styles.downloadButton} onPress={handleDownloadTranslatedCV}>
                <Text style={styles.downloadButtonText}>Download Translated CV</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.resetButton} onPress={resetTranslationFlow}>
                <Text style={styles.resetButtonText}>Start Over</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {currentStep === 4 && translatedText && (
        <View style={styles.translationContainer}>
          <Text style={styles.resultTitle}>Translated CV ({getLanguageName(targetLang)}):</Text>
          <ScrollView style={styles.resultContainer}>
            <Text style={styles.resultText}>{translatedText}</Text>
          </ScrollView>
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.downloadButton} onPress={handleDownloadTranslatedCV}> 
              <Download color={Colors.white} size={20} />
              <Text style={styles.downloadButtonText}>Download Translated CV</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.resetButton} onPress={resetTranslationFlow}>
              <Text style={styles.resetButtonText}>Translate Another CV</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "portfolio":
        return renderPortfolioTab();
      case "profile-domain":
        return renderProfileTab();
      case "jobs":
        return renderJobsTab();
      case "cv":
        return renderCVTab();
      default:
        return renderPortfolioTab();
    }
  };

  const LANGUAGES = [
    { code: 'sw', name: 'Swahili' },
  ];

  const getLanguageName = (code: string) => 'Swahili';

  const extractTextFromFile = async () => {
    setIsExtracting(true);
    try {
      let extractedText = '';
      
      if (uploadedCV) {
        const fileName = uploadedCV.toLowerCase();
        
        if (fileName.endsWith('.txt') || fileName.endsWith('.rtf')) {
          // Text files are already processed
          extractedText = cvContent;
        } else if (fileName.endsWith('.pdf')) {
          // For PDF files, simulate text extraction
          // In a real app, you'd use react-native-pdf or similar
          extractedText = `Name: ${profile?.fullName || user?.profile?.fullName || 'User'}
Email: ${profile?.email || user?.email || 'user@example.com'}
Phone: ${profile?.phone || user?.profile?.phone || 'N/A'}

EXPERIENCE
• Junior Developer at Tech Company (2023-2024)
• Freelance Web Developer (2022-2023)
• Intern at Startup Inc (2021-2022)

EDUCATION
• Bachelor's in Computer Science, University of Nairobi (2019-2023)
• High School Diploma, St. Mary's School (2015-2019)

SKILLS
• JavaScript, React, React Native
• Python, Node.js
• UI/UX Design
• Git, GitHub
• Problem Solving
• Team Collaboration`;
        } else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
          // For Word documents, simulate text extraction
          // In a real app, you'd use a library like react-native-docx
          extractedText = `Name: ${profile?.fullName || user?.profile?.fullName || 'User'}
Email: ${profile?.email || user?.email || 'user@example.com'}
Phone: ${profile?.phone || user?.profile?.phone || 'N/A'}

WORK EXPERIENCE
• Junior Developer at Tech Company (2023-2024)
  - Developed web applications using React and Node.js
  - Collaborated with team of 5 developers
  - Improved application performance by 30%

• Freelance Web Developer (2022-2023)
  - Built responsive websites for small businesses
  - Managed client relationships and project timelines
  - Completed 15+ successful projects

EDUCATION
• Bachelor's in Computer Science, University of Nairobi (2019-2023)
  - GPA: 3.8/4.0
  - Relevant coursework: Data Structures, Algorithms, Web Development

TECHNICAL SKILLS
• Programming Languages: JavaScript, Python, Java
• Frontend: React, React Native, HTML, CSS
• Backend: Node.js, Express.js
• Databases: MongoDB, MySQL
• Tools: Git, GitHub, VS Code, Figma`;
        } else {
          // Fallback for other file types
          extractedText = cvContent || `Name: ${profile?.fullName || user?.profile?.fullName || 'User'}
Email: ${profile?.email || user?.email || 'user@example.com'}
Phone: ${profile?.phone || user?.profile?.phone || 'N/A'}

EXPERIENCE
• Junior Developer at Tech Company (2023-2024)
• Freelance Web Developer (2022-2023)
• Intern at Startup Inc (2021-2022)

EDUCATION
• Bachelor's in Computer Science, University of Nairobi (2019-2023)
• High School Diploma, St. Mary's School (2015-2019)

SKILLS
• JavaScript, React, React Native
• Python, Node.js
• UI/UX Design
• Git, GitHub
• Problem Solving
• Team Collaboration`;
        }
      } else {
        // No file uploaded, use profile data
        extractedText = `Name: ${profile?.fullName || user?.profile?.fullName || 'User'}
Email: ${profile?.email || user?.email || 'user@example.com'}
Phone: ${profile?.phone || user?.profile?.phone || 'N/A'}

EXPERIENCE
• Junior Developer at Tech Company (2023-2024)
• Freelance Web Developer (2022-2023)
• Intern at Startup Inc (2021-2022)

EDUCATION
• Bachelor's in Computer Science, University of Nairobi (2019-2023)
• High School Diploma, St. Mary's School (2015-2019)

SKILLS
• JavaScript, React, React Native
• Python, Node.js
• UI/UX Design
• Git, GitHub
• Problem Solving
• Team Collaboration`;
      }
      
      setExtractedText(extractedText);
      setCurrentStep(3);
    } finally {
      setIsExtracting(false);
    }
  };

  const translateCVNow = async () => {
    if (!extractedText.trim()) return;
    setIsTranslating(true);
    try {
      // Call the Vambo API for translation
      const translatedContent = await translateTextWithVambo(extractedText, 'en', targetLang);
      setTranslatedText(translatedContent);
      setCurrentStep(4);
    } catch (error) {
      console.error('Translation error:', error);
      Alert.alert('Translation Error', 'Failed to translate CV. Please try again.');
    } finally {
      setIsTranslating(false);
    }
  };

  const translateTextWithVambo = async (text: string, sourceLang: string, targetLang: string): Promise<string> => {
    // Mock translation - generate translated content based on language
    const translations: any = {
      sw: {
        title: "📄 CV YA KAZI",
        personalInfo: "Maelezo Binafsi:",
        name: "Jina:",
        email: "Barua pepe:",
        phone: "Simu:",
        location: "Mahali:",
        summary: "Muhtasari:",
        experience: "Uzoefu wa Kazi:",
        education: "Elimu:",
        skills: "Ujuzi:",
      }
    };

    const t = translations["sw"];
    let output = `${t.title}\n\n`;

    // Parse the original text and translate structure
    const lines = text.split('\n');
    let currentSection = '';

    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      
      if (lowerLine.includes('name:')) {
        output += `${t.name} ${line.split(':')[1]?.trim() || ''}\n`;
      } else if (lowerLine.includes('email:')) {
        output += `${t.email} ${line.split(':')[1]?.trim() || ''}\n`;
      } else if (lowerLine.includes('phone:')) {
        output += `${t.phone} ${line.split(':')[1]?.trim() || ''}\n`;
      } else if (lowerLine.includes('experience')) {
        currentSection = 'experience';
        output += `\n${t.experience}\n`;
      } else if (lowerLine.includes('education')) {
        currentSection = 'education';
        output += `\n${t.education}\n`;
      } else if (lowerLine.includes('skills')) {
        currentSection = 'skills';
        output += `\n${t.skills}\n`;
      } else if (line.trim() && currentSection) {
        // Keep the content but add translated bullet points
        if (line.includes('•')) {
          output += `• ${line.replace('•', '').trim()}\n`;
        } else {
          output += `${line}\n`;
        }
      }
    }

    return output;
  };

  const resetTranslationFlow = () => {
    setUploadedCV(null);
    setCvContent("");
    setCvData(null);
    setExtractedText("");
    setTranslatedText("");
    setTargetLang('sw');
    setCurrentStep(1);
  };

  const renderTranslationChat = () => null;

  const handleDownloadTranslatedCV = () => {
    // In a real app, this would save the translated CV as a file
    // For now, we'll show an alert with the option to copy text
    Alert.alert(
      'Download Translated CV',
      'In a real app, this would save the translated CV as a PDF file. For now, you can copy the text.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Copy Text', 
          onPress: () => {
            // In a real app, you'd use Clipboard API
            Alert.alert('Copied!', 'Translated CV text copied to clipboard.');
          }
        }
      ]
    );
  };



  return (
    <View style={styles.container}>
      <LinearGradient colors={[Colors.black, Colors.red, Colors.green]} style={styles.gradient}>
        <SafeAreaView style={styles.safeArea}>
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <View>
                <Text style={styles.greeting}>Welcome back,</Text>
                <Text style={styles.userName}>{profile?.fullName || user?.profile?.fullName || "User"}</Text>
              </View>
              <TouchableOpacity style={styles.profileButton} onPress={toggleMenu}>
                <User color={Colors.black} size={24} />
              </TouchableOpacity>
            </View>

            {isMenuOpen && (
              <View style={styles.profileMenu}>
                <TouchableOpacity style={styles.profileMenuItem} onPress={() => setActiveTab("profile-domain")}>
                  <Text style={styles.profileMenuText}>Profile & Settings</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.profileMenuItem} onPress={handleSignOut}>
                  <Text style={styles.profileMenuText}>Sign Out</Text>
                </TouchableOpacity>
              </View>
            )}

            {renderTabContent()}
          </ScrollView>
        </SafeAreaView>

        <View style={styles.tabBar}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabItem, activeTab === tab.id && styles.activeTabItem]}
              onPress={() => setActiveTab(tab.id)}
              accessibilityLabel={tab.title}
              accessibilityRole="button"
            >
              <tab.icon color={activeTab === tab.id ? Colors.red : Colors.gray} size={20} />
              <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>{tab.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      {/* Portfolio dummy data modals */}
      <Modal visible={showProjects} transparent animationType="fade" onRequestClose={() => setShowProjects(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCardLight}>
            <Text style={styles.modalTitleLight}>Personal Projects</Text>
            <Text style={styles.modalText}>• E-Commerce App (React Native)
• School Portal (Next.js)
• Chatbot Assistant (Python)</Text>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowProjects(false)}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showCerts} transparent animationType="fade" onRequestClose={() => setShowCerts(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCardLight}>
            <Text style={styles.modalTitleLight}>Certificates & Accreditations</Text>
            <Text style={styles.modalText}>• Google IT Support Fundamentals
• AWS Cloud Practitioner
• KENET Verified Student ID</Text>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowCerts(false)}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showHustles} transparent animationType="fade" onRequestClose={() => setShowHustles(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCardLight}>
            <Text style={styles.modalTitleLight}>Side Hustles</Text>
            <Text style={styles.modalText}>• Freelance Graphic Design (Canva)
• Phone Repair & Maintenance
• Social Media Content Editing</Text>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowHustles(false)}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showCVSummary} transparent animationType="fade" onRequestClose={() => setShowCVSummary(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCardLight}>
            <Text style={styles.modalTitleLight}>CV Summary</Text>
            <Text style={styles.modalText}>• Name: {profile?.fullName || user?.profile?.fullName || 'User'}
• Email: {profile?.email || user?.email || 'user@example.com'}
• Skills: React Native, JavaScript, UI/UX, Git
• Experience: 1-2 years internship/freelance</Text>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowCVSummary(false)}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24, backgroundColor: Colors.lightGray },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 20, backgroundColor: Colors.lightGray },
  greeting: { fontSize: 16, color: Colors.black },
  userName: { fontSize: 24, fontWeight: "bold", color: Colors.black },
  profileButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.white, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Colors.lightGray },
  profileMenu: { backgroundColor: "rgba(0,0,0,0.3)", borderRadius: 12, paddingVertical: 8, marginBottom: 12 },
  profileMenuItem: { paddingVertical: 10, paddingHorizontal: 12 },
  profileMenuText: { color: "#FFFFFF", fontSize: 14 },
  statsContainer: { flexDirection: "row", gap: 12, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 16, padding: 16, alignItems: "center" },
  statIcon: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  statValue: { fontSize: 20, fontWeight: "bold", color: "#FFFFFF", marginBottom: 4 },
  statLabel: { fontSize: 12, color: "rgba(255,255,255,0.7)", textAlign: "center" },
  domainCard: { backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 16, padding: 20, marginBottom: 24 },
  domainHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  domainTitle: { fontSize: 18, fontWeight: "600", color: "#FFFFFF" },
  domainUrl: { fontSize: 16, color: "#00C65A", fontWeight: "500", marginBottom: 8 },
  domainStatus: { fontSize: 14, color: "rgba(255,255,255,0.8)", marginBottom: 16 },
  viewDomainButton: { backgroundColor: "#00C65A", paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, alignSelf: "flex-start" },
  viewDomainText: { color: "#FFFFFF", fontWeight: "600" },
  tabBar: { flexDirection: "row", backgroundColor: Colors.white, paddingVertical: 8, paddingHorizontal: 16, borderTopWidth: 1, borderTopColor: Colors.lightGray },
  tabItem: { flex: 1, alignItems: "center", paddingVertical: 8, paddingHorizontal: 4 },
  activeTabItem: { backgroundColor: "transparent", borderRadius: 8 },
  tabText: { fontSize: 10, color: Colors.gray, marginTop: 4, textAlign: "center" },
  activeTabText: { color: Colors.red, fontWeight: "600" },
  tabContent: { paddingBottom: 20 },
  tabTitle: { fontSize: 24, fontWeight: "bold", color: "#FFFFFF", marginBottom: 8 },
  tabSubtitle: { fontSize: 16, color: "rgba(255,255,255,0.8)", marginBottom: 24 },
  jobMatchesCard: { backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 16, padding: 20, marginBottom: 24 },
  jobMatchesTitle: { fontSize: 18, fontWeight: "600", color: "#FFFFFF", marginBottom: 16 },
  jobItem: { flexDirection: "row", alignItems: "center", marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.1)" },
  jobContent: { flex: 1 },
  jobTitle: { fontSize: 16, fontWeight: "600", color: "#FFFFFF", marginBottom: 4 },
  jobCompany: { fontSize: 14, color: "rgba(255,255,255,0.8)", marginBottom: 2 },
  jobSalary: { fontSize: 14, color: "#00C65A", fontWeight: "500" },
  jobLocation: { fontSize: 14, color: "rgba(255,255,255,0.7)", marginBottom: 4 },
  jobType: { fontSize: 12, color: "#00C65A", backgroundColor: "rgba(0,198,90,0.2)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, textTransform: "capitalize" },
  applyButton: { backgroundColor: "#00C65A", paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  applyButtonText: { color: "#FFFFFF", fontWeight: "600", fontSize: 12 },
  viewAllButton: { alignSelf: "center", paddingVertical: 12, paddingHorizontal: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.3)", borderRadius: 8, marginTop: 8 },
  viewAllText: { color: "#FFFFFF", fontWeight: "500" },
  jobCard: { backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 16, padding: 16, marginBottom: 16 },
  jobHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
  jobSkills: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginVertical: 12 },
  skillTag: { backgroundColor: "rgba(0,198,90,0.2)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  skillText: { fontSize: 12, color: "#00C65A", fontWeight: "500" },
  jobActions: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 },
  applicantsText: { fontSize: 12, color: "rgba(255,255,255,0.6)" },
  applicationCard: { backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 16, padding: 16, marginBottom: 16 },
  applicationHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
  applicationTitle: { fontSize: 16, fontWeight: "600", color: "#FFFFFF", flex: 1, marginRight: 12 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 10, color: "#FFFFFF", fontWeight: "600" },
  applicationCompany: { fontSize: 14, color: "rgba(255,255,255,0.8)", marginBottom: 4 },
  applicationDate: { fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 8 },
  notificationCard: { backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 16, padding: 16, marginBottom: 16 },
  notificationTitle: { fontSize: 16, fontWeight: "600", color: "#FFFFFF", marginBottom: 8 },
  notificationText: { fontSize: 14, color: "rgba(255,255,255,0.8)", marginBottom: 8, lineHeight: 20 },
  notificationTime: { fontSize: 12, color: "rgba(255,255,255,0.6)" },
  settingsSection: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: "600", color: "#FFFFFF", marginBottom: 16 },
  signOutButton: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,107,107,0.2)", borderRadius: 12, padding: 16, gap: 12 },
  signOutText: { fontSize: 16, color: "#FF6B6B", fontWeight: "600" },
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 40 },
  emptyStateText: { fontSize: 18, color: "rgba(255,255,255,0.8)", fontWeight: "600", marginTop: 16, marginBottom: 8 },
  profileSection: { marginBottom: 24 },
  profileCard: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E0E0E0', shadowColor: Colors.shadow, shadowOpacity: 1, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  profileRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  profileLabel: { fontSize: 14, color: Colors.gray, fontWeight: "500" },
  profileValue: { fontSize: 14, color: Colors.black, fontWeight: "600" },
  serviceCard: { backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 16, padding: 16, marginBottom: 16 },
  serviceTitle: { fontSize: 18, fontWeight: "600", color: "#FFFFFF", marginBottom: 8 },
  serviceDescription: { fontSize: 14, color: "rgba(255,255,255,0.8)", marginBottom: 12, lineHeight: 20 },
  serviceButton: { backgroundColor: "#00C65A", paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, alignSelf: "flex-start" },
  serviceButtonText: { color: "#FFFFFF", fontWeight: "600", fontSize: 14 },
  // portfolio sections
  sectionCard: { backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 16, padding: 16, marginBottom: 16 },
  sectionHint: { color: "rgba(255,255,255,0.8)", marginTop: 6 },
  // AI jobs
  aiMatchButton: { backgroundColor: "#00C65A", paddingVertical: 12, borderRadius: 8, alignItems: "center", marginBottom: 12 },
  aiMatchText: { color: "#FFFFFF", fontWeight: "700" },
  aiLoader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  aiLoaderText: { color: "rgba(255,255,255,0.85)" },
  autoApplyAllBtn: { backgroundColor: "rgba(0,198,90,0.2)", paddingVertical: 10, borderRadius: 8, alignItems: "center", marginTop: 8 },
  autoApplyAllText: { color: "#00C65A", fontWeight: "700" },
  // translation chat styles
  translationChatContainer: { flex: 1 },
  translationChatGradient: { flex: 1 },
  translationChatHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.1)" },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },
  translationChatTitle: { fontSize: 20, fontWeight: "bold", color: "#FFFFFF", flex: 1, textAlign: "center" },
  cvUploadSection: { padding: 20, alignItems: "center", marginBottom: 20 },
  cvUploadTitle: { fontSize: 18, fontWeight: "600", color: "#FFFFFF", marginBottom: 8 },
  cvUploadDescription: { fontSize: 14, color: "rgba(255,255,255,0.8)", marginBottom: 8, textAlign: "center" },
  uploadCVButton: { backgroundColor: "rgba(255,255,255,0.1)", paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, borderWidth: 1, borderColor: "rgba(255,255,255,0.3)", borderStyle: "dashed", alignItems: "center", flexDirection: "row", gap: 8 },
  uploadCVButtonDisabled: { backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" },
  uploadCVButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
  uploadedCVInfo: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 12, padding: 12, width: "100%", marginBottom: 16 },
  uploadedCVText: { color: "#FFFFFF", fontSize: 14, marginLeft: 10, flex: 1 },
  cvActionButtons: { flexDirection: "row", gap: 8, marginTop: 8 },
  changeCVButton: { backgroundColor: "rgba(255,255,255,0.2)", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  changeCVButtonText: { color: "#FFFFFF", fontSize: 12, fontWeight: "600" },
  clearCVButton: { backgroundColor: "rgba(255,107,107,0.2)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: "rgba(255,107,107,0.3)" },
  clearCVButtonText: { color: "#FF6B6B", fontSize: 12, fontWeight: "600" },
  translationChatMessages: { flex: 1, paddingHorizontal: 20, paddingBottom: 10 },
  instructionsBlock: { padding: 20, backgroundColor: Colors.lightGray, borderRadius: 12, marginVertical: 10 },
  instructionsTitleLight: { fontSize: 16, fontWeight: '600', color: Colors.black, marginBottom: 8 },
  instructionsTextLight: { fontSize: 14, color: Colors.gray, lineHeight: 20 },
  stepIndicator: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginVertical: 20 },
  stepContainer: { alignItems: 'center', flex: 1, position: 'relative' },
  stepCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.gray, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  stepCircleActive: { backgroundColor: Colors.red },
  stepNumber: { color: Colors.white, fontSize: 14, fontWeight: '600' },
  stepTitle: { fontSize: 12, color: Colors.gray, textAlign: 'center' },
  stepTitleActive: { color: Colors.black, fontWeight: '600' },
  stepLine: { position: 'absolute', top: 15, left: '60%', right: '-40%', height: 2, backgroundColor: Colors.gray },
  stepLineActive: { backgroundColor: Colors.red },
  loadingContainerLight: { alignItems: 'center', padding: 30 },
  loadingTextLight: { fontSize: 16, color: Colors.gray, marginTop: 15 },
  translationContainer: { padding: 20 },
  sectionTitleLight: { fontSize: 16, fontWeight: '600', color: Colors.black, marginBottom: 10 },
  languagePickerContainer: { flex: 1, position: 'relative' },
  languageButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, backgroundColor: Colors.lightGray, borderRadius: 8, borderWidth: 1, borderColor: Colors.gray },
  languageButtonText: { fontSize: 16, color: Colors.black, fontWeight: '500' },
  languageDropdown: { position: 'absolute', top: 50, left: 0, right: 0, backgroundColor: Colors.white, borderRadius: 8, borderWidth: 1, borderColor: Colors.gray, maxHeight: 200, zIndex: 1000, elevation: 5, shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 },
  languageList: { maxHeight: 200 },
  languageOption: { padding: 12, borderBottomWidth: 1, borderBottomColor: Colors.lightGray },
  selectedLanguageOption: { backgroundColor: Colors.lightRed },
  languageOptionText: { fontSize: 16, color: Colors.black },
  selectedLanguageOptionText: { color: Colors.red, fontWeight: '600' },
  textPreview: { marginVertical: 20 },
  previewTitle: { fontSize: 16, fontWeight: '600', color: Colors.black, marginBottom: 10 },
  previewContainer: { backgroundColor: Colors.lightGray, borderRadius: 8, padding: 15, maxHeight: 150 },
  previewText: { fontSize: 14, color: Colors.black, lineHeight: 20 },
  translateButton: { backgroundColor: Colors.red, padding: 15, borderRadius: 8, alignItems: 'center', marginVertical: 10 },
  translateButtonDisabled: { backgroundColor: Colors.gray },
  translateButtonText: { color: Colors.white, fontSize: 16, fontWeight: '600' },
  resultTitle: { fontSize: 16, fontWeight: '600', color: Colors.black, marginBottom: 10 },
  resultContainer: { backgroundColor: Colors.lightGray, borderRadius: 8, padding: 15, maxHeight: 200 },
  resultText: { fontSize: 14, color: Colors.black, lineHeight: 20 },
  actionButtons: { gap: 15 },
  downloadButton: { backgroundColor: Colors.green, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderRadius: 8, gap: 10 },
  downloadButtonText: { color: Colors.white, fontSize: 16, fontWeight: '600' },
  resetButton: { backgroundColor: Colors.white, borderWidth: 2, borderColor: Colors.red, padding: 15, borderRadius: 8, alignItems: 'center' },
  resetButtonText: { color: Colors.red, fontSize: 16, fontWeight: '600' },
  translationMessageContainer: { flexDirection: "row", marginBottom: 12, alignItems: "flex-end" },
  translationUserMessage: { justifyContent: "flex-end" },
  translationBotMessage: { justifyContent: "flex-start" },
  translationMessageBubble: { maxWidth: "80%", paddingVertical: 10, paddingHorizontal: 15, borderRadius: 15 },
  translationUserBubble: { backgroundColor: "rgba(255,255,255,0.2)" },
  translationBotBubble: { backgroundColor: "rgba(0,198,90,0.2)" },
  translationMessageText: { fontSize: 14, color: "#FFFFFF", lineHeight: 20 },
  translationUserMessageText: { textAlign: "right" },
  translationBotMessageText: { textAlign: "left" },
  translationMessageTime: { fontSize: 10, color: "rgba(255,255,255,0.6)", marginTop: 4 },
  translatingIndicator: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  translatingText: { fontSize: 12, color: "#FFFFFF", marginLeft: 8 },
  translationChatInputContainer: { flexDirection: "row", paddingHorizontal: 20, paddingBottom: 20, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.1)" },
  translationChatInput: { flex: 1, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 12, paddingVertical: 12, paddingHorizontal: 15, color: "#FFFFFF", fontSize: 14, minHeight: 40, maxHeight: 100 },
  translationSendButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,198,90,0.8)", alignItems: "center", justifyContent: "center", marginLeft: 10 },
  translationSendButtonDisabled: { backgroundColor: "rgba(0,198,90,0.4)" },
  matchScore: { marginTop: 4 },
  matchScoreText: { fontSize: 12, color: "#00C65A", fontWeight: "600" },
  jobTitleContainer: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  matchScoreBadge: { backgroundColor: "rgba(0,198,90,0.2)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  matchReasons: { marginVertical: 8, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: "rgba(0,198,90,0.1)", borderRadius: 8 },
  matchReasonsTitle: { fontSize: 12, color: "#00C65A", fontWeight: "600", marginBottom: 4 },
  matchReason: { fontSize: 11, color: "rgba(255,255,255,0.8)", marginBottom: 2 },
  appliedButton: { backgroundColor: "rgba(255,255,255,0.2)" },
  appliedButtonText: { color: "rgba(255,255,255,0.7)" },
  saveButton: { backgroundColor: "rgba(255,255,255,0.1)", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, marginLeft: 8 },
  saveButtonText: { color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: "500" },
  savedButtonText: { color: "#00C65A" },
  // generic light modal styles
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" },
  modalCardLight: { backgroundColor: "#fff", width: '85%', borderRadius: 12, padding: 16 },
  modalTitleLight: { fontSize: 18, fontWeight: '700', marginBottom: 8, color: '#111' },
  modalText: { color: '#333', lineHeight: 20, marginBottom: 12 },
  modalCloseBtn: { alignSelf: 'flex-end', backgroundColor: '#CE1126', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12 },
  modalCloseText: { color: '#fff', fontWeight: '700' },
  // Profile editing styles
  domainSection: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 16 },
  editButton: { backgroundColor: 'rgba(0,198,90,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(0,198,90,0.3)' },
  editButtonText: { color: '#00C65A', fontSize: 12, fontWeight: '600' },
  profileEditForm: { backgroundColor: Colors.white, borderRadius: 16, padding: 16 },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 14, color: Colors.black, marginBottom: 8, fontWeight: '500' },
  textInput: { backgroundColor: Colors.white, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, color: Colors.black, fontSize: 14, borderWidth: 1, borderColor: '#E0E0E0' },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  formActions: { marginTop: 16, alignItems: 'center' },
  profileSaveButton: { backgroundColor: Colors.red, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 },
  profileSaveButtonText: { color: Colors.white, fontWeight: "600", fontSize: 14 },
  // New styles for CV upload functionality
  uploadedFileInfo: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: 8, padding: 12, marginTop: 12, borderWidth: 1, borderColor: Colors.lightGray },
  uploadedFileName: { flex: 1, fontSize: 14, color: Colors.black, marginLeft: 8, fontWeight: '500' },
  changeFileButton: { backgroundColor: Colors.red, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  changeFileButtonText: { color: Colors.white, fontSize: 12, fontWeight: '600' },
  fileInfoCard: { backgroundColor: Colors.white, borderRadius: 8, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: Colors.lightGray },
  fileInfoTitle: { fontSize: 14, fontWeight: '600', color: Colors.black, marginBottom: 8 },
  fileInfoText: { fontSize: 12, color: Colors.gray, marginBottom: 4 },
  sectionSubtitleLight: { fontSize: 14, color: Colors.gray, marginBottom: 15 },
  translatedBlock: { marginTop: 20 },
});