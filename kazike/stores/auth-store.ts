import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/lib/supabase";
import { router } from "expo-router";

export type UserRole = "youth" | "employer" | "government" | "institution";

export interface UserProfile {
  fullName?: string;
  phone?: string;
  nationalId?: string;
  dateOfBirth?: string;
  orgName?: string;
  kraPin?: string;
  ministry?: string;
  institutionName?: string;
  domain?: string;
  // Institution-specific optional fields
  institutionType?: string;
  accreditationNumber?: string;
  website?: string;
  address?: string;
  principalName?: string;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
  profile: UserProfile;
  domain: string;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  selectedRole: UserRole | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  setSelectedRole: (role: UserRole) => void;
  setUser: (user: User) => void;
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  signUp: (userData: Partial<User> & { password: string }) => Promise<User>;
  signIn: (identifier: string, password: string) => Promise<User>;
  generateDomain: (name: string, role: UserRole) => string;
  clearError: () => void;
  setError: (error: string) => void;
}

const STORAGE_KEY = "@ke_identity_user";
const USERS_MAP_KEY = "@ke_identity_users"; 
const CREDENTIALS_KEY = "@ke_identity_credentials"; 

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  selectedRole: null,
  isLoading: false,
  isInitialized: false,
  error: null,

  setSelectedRole: (role: UserRole) => {
    console.log("Setting selected role:", role);
    set({ selectedRole: role, error: null });
  },

  setUser: async (user: User) => {
    console.log("Setting user:", user.email, user.role);
    set({ user, error: null });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } catch (error) {
      console.error("Failed to save user to storage:", error);
    }
  },

  updateProfile: async (profileUpdate: Partial<UserProfile>) => {
    const { user } = get();
    if (!user) return;

    const updatedUser = {
      ...user,
      profile: { ...user.profile, ...profileUpdate },
    };

    set({ user: updatedUser });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
      console.log("Profile updated successfully");
    } catch (error) {
      console.error("Failed to update profile:", error);
    }
  },

 
  logout: async () => {
    console.log("Logging out user");
    // Best-effort Supabase sign out, but don't block local cleanup
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.warn("Supabase signOut failed (continuing):", error);
    }

    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn("Failed removing stored user (continuing):", error);
    }

    // Clear in-memory state and navigate to the root once
    set({ user: null, selectedRole: null });
    try {
      // Ensure we escape any nested stacks/tabs before redirecting
      try { (router as any).dismissAll?.(); } catch {}
      router.replace("/");
    } catch (error) {
      console.warn("Router replace failed (non-fatal):", error);
    }
  },
  
  loadUser: async () => {
    if (get().isInitialized) return;

    set({ isLoading: true });
    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEY);
      if (userData) {
        const user = JSON.parse(userData);
        console.log("Loaded user from storage:", user.email, user.role);
        set({ user });
      } else {
        console.log("No user found in storage");
      }
    } catch (error) {
      console.error("Failed to load user from storage:", error);
    } finally {
      set({ isLoading: false, isInitialized: true });
    }
  },

  generateDomain: (name: string, role: UserRole) => {
    const cleanName = name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .substring(0, 20);

    const timestamp = Date.now().toString().slice(-4);
    const rolePrefix = role === "youth" ? "" : role.substring(0, 3);

    // We now use bare .ke domains (no .KaziKE.ke suffix)
    return `${rolePrefix}${cleanName}${timestamp}.ke`;
  },

  clearError: () => set({ error: null }),
  setError: (error: string) => set({ error }),

  signUp: async (userData: Partial<User> & { password: string }) => {
    set({ isLoading: true, error: null });
    try {
      // Youth => Supabase flow
      if (userData.role === "youth") {
        const fullName = userData.profile?.fullName || "user";
        const phone = userData.profile?.phone || "";
        const nationalId = userData.profile?.nationalId || "";
        const dateOfBirth = userData.profile?.dateOfBirth || "";
        const domain = get().generateDomain(fullName, "youth");

        const emailRedirect = process.env.EXPO_PUBLIC_SUPABASE_REDIRECT_URL;
        const { data, error } = await supabase.auth.signUp({
          email: userData.email!,
          password: userData.password,
          options: {
            data: { fullName, phone, nationalId, dateOfBirth, domain, role: "youth" },
            ...(emailRedirect ? { emailRedirectTo: emailRedirect } : {}),
          },
        });

        if (error) throw error;

        const tempUser: User = {
          id: data.user?.id || `pending_${Date.now()}`,
          email: userData.email!,
          role: "youth",
          isVerified: false,
          profile: { fullName, phone, nationalId, dateOfBirth },
          domain,
          createdAt: new Date().toISOString(),
        };

        // Save minimal user state locally to route into verification
        await get().setUser(tempUser);
        return tempUser;
      }

      // Institution => Supabase flow
      if (userData.role === "institution") {
        const institutionName = userData.profile?.institutionName || "institution";
        const phone = userData.profile?.phone || "";
        const institutionType = userData.profile?.institutionType || "";
        const accreditationNumber = userData.profile?.accreditationNumber || "";
        const website = userData.profile?.website || "";
        const address = userData.profile?.address || "";
        const principalName = userData.profile?.principalName || "";
        const domain = get().generateDomain(institutionName, "institution");

        const emailRedirect2 = process.env.EXPO_PUBLIC_SUPABASE_REDIRECT_URL;
        const { data, error } = await supabase.auth.signUp({
          email: userData.email!,
          password: userData.password,
          options: {
            data: { 
              institutionName, 
              phone, 
              institutionType, 
              accreditationNumber, 
              website, 
              address, 
              principalName, 
              domain, 
              role: "institution" 
            },
            ...(emailRedirect2 ? { emailRedirectTo: emailRedirect2 } : {}),
          },
        });

        if (error) throw error;

        const tempUser: User = {
          id: data.user?.id || `pending_${Date.now()}`,
          email: userData.email!,
          role: "institution",
          isVerified: false,
          profile: { 
            institutionName, 
            phone, 
            institutionType, 
            accreditationNumber, 
            website, 
            address, 
            principalName 
          },
          domain,
          createdAt: new Date().toISOString(),
        };

        await get().setUser(tempUser);
        return tempUser;
      }

      // Employer => Supabase flow
      if (userData.role === "employer") {
        const orgName = userData.profile?.orgName || "employer";
        const kraPin = userData.profile?.kraPin || "";
        const phone = userData.profile?.phone || "";
        const domain = get().generateDomain(orgName, "employer");

        const emailRedirect = process.env.EXPO_PUBLIC_SUPABASE_REDIRECT_URL;
        const { data, error } = await supabase.auth.signUp({
          email: userData.email!,
          password: userData.password,
          options: {
            data: { orgName, kraPin, phone, domain, role: "employer" },
            ...(emailRedirect ? { emailRedirectTo: emailRedirect } : {}),
          },
        });
        if (error) throw error;

        const tempUser: User = {
          id: data.user?.id || `pending_${Date.now()}`,
          email: userData.email!,
          role: "employer",
          isVerified: false,
          profile: { orgName, kraPin, phone },
          domain,
          createdAt: new Date().toISOString(),
        };
        await get().setUser(tempUser);
        return tempUser;
      }

      // Government => Supabase flow
      if (userData.role === "government") {
        const fullName = userData.profile?.fullName || userData.email || "gov";
        const ministry = userData.profile?.ministry || "";
        const phone = userData.profile?.phone || "";
        const domain = get().generateDomain(ministry || fullName, "government");

        const emailRedirect = process.env.EXPO_PUBLIC_SUPABASE_REDIRECT_URL;
        const { data, error } = await supabase.auth.signUp({
          email: userData.email!,
          password: userData.password,
          options: {
            data: { fullName, ministry, phone, domain, role: "government" },
            ...(emailRedirect ? { emailRedirectTo: emailRedirect } : {}),
          },
        });
        if (error) throw error;

        const tempUser: User = {
          id: data.user?.id || `pending_${Date.now()}`,
          email: userData.email!,
          role: "government",
          isVerified: false,
          profile: { fullName, ministry, phone },
          domain,
          createdAt: new Date().toISOString(),
        };
        await get().setUser(tempUser);
        return tempUser;
      }

      // Fallback local (should not be used now)
      throw new Error("Unsupported role for local signup");
    } catch (error: any) {
      console.error("Sign up failed:", error);
      set({ error: error?.message || "Sign up failed. Please try again." });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  signIn: async (identifier: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      // Try Supabase first for youth and institution emails
      if (identifier.includes("@")) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: identifier,
          password,
        });

        if (data?.user) {
          const meta = (data.user as any).user_metadata || {};
          const role: UserRole = meta.role || "youth";
          const domain = meta.domain || get().generateDomain(meta.fullName || meta.institutionName || "user", role);
          const isVerified = Boolean((data.user as any).email_confirmed_at);

          let signedInUser: User;

          if (role === "institution") {
            signedInUser = {
              id: data.user.id,
              email: data.user.email || identifier,
              role,
              isVerified,
              profile: {
                institutionName: meta.institutionName,
                phone: meta.phone,
                institutionType: meta.institutionType,
                accreditationNumber: meta.accreditationNumber,
                website: meta.website,
                address: meta.address,
                principalName: meta.principalName,
              },
              domain,
              createdAt: (data.user as any).created_at || new Date().toISOString(),
            };
          } else {
            signedInUser = {
              id: data.user.id,
              email: data.user.email || identifier,
              role,
              isVerified,
              profile: {
                fullName: meta.fullName,
                phone: meta.phone,
                nationalId: meta.nationalId,
                dateOfBirth: meta.dateOfBirth,
              },
              domain,
              createdAt: (data.user as any).created_at || new Date().toISOString(),
            };
          }

          await get().setUser(signedInUser);
          return signedInUser;
        }

        if (error) console.warn("Supabase signIn failed:", error.message);
      }

      // Fallback to AsyncStorage for other roles
      const rawCreds = (await AsyncStorage.getItem(CREDENTIALS_KEY)) || "{}";
      const creds: {
        byEmail?: Record<string, { id: string; password: string }>;
        byPhone?: Record<string, { id: string; password: string }>;
      } = JSON.parse(rawCreds);

      const byEmail = creds.byEmail || {};
      const byPhone = creds.byPhone || {};
      const identifierLower = identifier.toLowerCase();
      const asPhone = identifier.replace(/\D/g, "");

      let credential = byEmail[identifierLower];
      if (!credential && asPhone) {
        credential = byPhone[asPhone];
      }
      if (!credential) throw new Error("Account not found");
      if (credential.password !== password) throw new Error("Invalid credentials");

      const rawUsers = (await AsyncStorage.getItem(USERS_MAP_KEY)) || "{}";
      const usersMap: Record<string, User> = JSON.parse(rawUsers);
      const user = usersMap[credential.id];
      if (!user) throw new Error("User data missing");

      await get().setUser(user);
      return user;
    } catch (error: any) {
      console.error("Sign in failed:", error);
      set({ error: error?.message || "Sign in failed. Please try again." });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
}));
