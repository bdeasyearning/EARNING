import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  signInWithPopup,
  GoogleAuthProvider,
  signOut
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  limit
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { UserProfile, SystemSettings } from '../types';
import {
  getDeviceVisitorId,
  checkDeviceLock,
  registerDeviceAndLocks,
  DEFAULT_SETTINGS
} from '../utils/security';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  visitorId: string;
  settings: SystemSettings;
  loginWithPhone: (phone: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  registerWithPhone: (
    phone: string,
    pass: string,
    fullName: string,
    referrerCode?: string
  ) => Promise<{ success: boolean; message?: string }>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateBalance: (delta: number) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAIL = 'mdraselislamrana609@gmail.com';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [visitorId, setVisitorId] = useState('');
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);

  // Load visitor ID once on start
  useEffect(() => {
    getDeviceVisitorId().then((id) => setVisitorId(id));
  }, []);

  // Listen to system settings from Firestore
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'settings', 'global'),
      (snapshot) => {
        if (snapshot.exists()) {
          setSettings({ ...DEFAULT_SETTINGS, ...snapshot.data() } as SystemSettings);
        } else {
          setDoc(doc(db, 'settings', 'global'), DEFAULT_SETTINGS).catch(() => {});
        }
      },
      (error) => {
        console.warn('Settings load error:', error);
      }
    );
    return () => unsub();
  }, []);

  // Listen to auth state and local active user session
  useEffect(() => {
    let unsubSnapshot: (() => void) | null = null;

    const unsubscribeAuth = auth.onAuthStateChanged(async (firebaseUser) => {
      setCurrentUser(firebaseUser);

      if (firebaseUser) {
        // Google auth user
        if (unsubSnapshot) unsubSnapshot();
        const userRef = doc(db, 'users', firebaseUser.uid);
        unsubSnapshot = onSnapshot(
          userRef,
          (docSnap) => {
            if (docSnap.exists()) {
              setUserProfile(docSnap.data() as UserProfile);
            } else {
              handleInitialProfile(firebaseUser);
            }
            setLoading(false);
          },
          (err) => {
            console.error('Error listening to user doc', err);
            setLoading(false);
          }
        );
      } else {
        // Check phone-based session stored in localStorage
        const activeUid = localStorage.getItem('bd_active_uid');
        if (activeUid) {
          if (unsubSnapshot) unsubSnapshot();
          const userRef = doc(db, 'users', activeUid);
          unsubSnapshot = onSnapshot(
            userRef,
            (docSnap) => {
              if (docSnap.exists()) {
                const data = docSnap.data() as UserProfile;
                if (!data.isBanned) {
                  setUserProfile(data);
                } else {
                  localStorage.removeItem('bd_active_uid');
                  setUserProfile(null);
                }
              } else {
                localStorage.removeItem('bd_active_uid');
                setUserProfile(null);
              }
              setLoading(false);
            },
            (err) => {
              console.error('Error listening to active user doc', err);
              setLoading(false);
            }
          );
        } else {
          setUserProfile(null);
          setLoading(false);
        }
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubSnapshot) unsubSnapshot();
    };
  }, [visitorId]);

  // Handle Google initial profile creation
  const handleInitialProfile = async (user: FirebaseUser) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        const vid = visitorId || (await getDeviceVisitorId());
        const refCode = 'BD' + Math.random().toString(36).substring(2, 8).toUpperCase();
        const isAdminUser = user.email === ADMIN_EMAIL;
        const newProfile: UserProfile = {
          uid: user.uid,
          phone: user.phoneNumber || '017' + Math.floor(10000000 + Math.random() * 90000000),
          fullName: user.displayName || 'সম্মানিত ব্যবহারকারী',
          email: user.email || '',
          balance: 10, // 10 BDT welcome bonus
          totalIncome: 10,
          totalWithdraw: 0,
          referralCode: refCode,
          referredBy: null,
          totalReferrals: 0,
          referralIncome: 0,
          referralBonusPending: 0,
          referralBonusPaid: 0,
          firstIncomeDone: false,
          isVerified: false,
          isBanned: false,
          visitorId: vid,
          role: isAdminUser ? 'admin' : 'user',
          createdAt: new Date().toISOString(),
          lastActiveAt: new Date().toISOString()
        };
        await setDoc(userRef, newProfile);
        setUserProfile(newProfile);
      }
    } catch (err) {
      console.error('Error setting initial profile', err);
    }
  };

  // Register with Phone & Password (with full 4-Layer checks & Anti-Fraud)
  const registerWithPhone = async (
    phone: string,
    pass: string,
    fullName: string,
    referrerCode?: string
  ): Promise<{ success: boolean; message?: string }> => {
    const cleanPhone = phone.trim().replace(/\D/g, '');
    const vid = visitorId || (await getDeviceVisitorId());

    // Run 4-Layer + Device Lock Check
    const lockCheck = await checkDeviceLock(cleanPhone, vid, referrerCode);
    if (!lockCheck.allowed) {
      return { success: false, message: lockCheck.message };
    }

    try {
      // Find referrer UID if referral code is given
      let referrerUid: string | null = null;
      if (referrerCode && referrerCode.trim()) {
        const refQuery = query(
          collection(db, 'users'),
          where('referralCode', '==', referrerCode.trim().toUpperCase()),
          limit(1)
        );
        const refSnap = await getDocs(refQuery);
        if (!refSnap.empty) {
          referrerUid = refSnap.docs[0].id;
        }
      }

      // Generate deterministic unique UID for phone registration
      const uid = 'user_' + cleanPhone;
      const refCode = 'BD' + Math.random().toString(36).substring(2, 8).toUpperCase();
      const now = new Date().toISOString();

      // Store phone credential for local authentication
      localStorage.setItem(`bd_auth_pwd_${cleanPhone}`, pass);

      const newProfile: UserProfile = {
        uid,
        phone: cleanPhone,
        fullName: fullName.trim(),
        balance: 10, // 10 BDT welcome bonus
        totalIncome: 10,
        totalWithdraw: 0,
        referralCode: refCode,
        referredBy: referrerUid,
        totalReferrals: 0,
        referralIncome: 0,
        referralBonusPending: 0,
        referralBonusPaid: 0,
        firstIncomeDone: false,
        isVerified: false,
        isBanned: false,
        visitorId: vid,
        role: 'user',
        createdAt: now,
        lastActiveAt: now
      };

      // Save user doc
      await setDoc(doc(db, 'users', uid), newProfile);

      // Lock phone & device and record referral
      await registerDeviceAndLocks(uid, cleanPhone, vid, referrerUid);

      // Persist active UID in localStorage
      localStorage.setItem('bd_active_uid', uid);
      setUserProfile(newProfile);
      return { success: true };
    } catch (err: unknown) {
      console.error('Registration error', err);
      return {
        success: false,
        message: err instanceof Error ? err.message : 'রেজিস্ট্রেশনে সমস্যা হয়েছে। আবার চেষ্টা করুন।'
      };
    }
  };

  // Login with Phone & Password
  const loginWithPhone = async (
    phone: string,
    pass: string
  ): Promise<{ success: boolean; message?: string }> => {
    const cleanPhone = phone.trim().replace(/\D/g, '');

    try {
      // Find user by phone in Firestore
      const q = query(collection(db, 'users'), where('phone', '==', cleanPhone), limit(1));
      const snap = await getDocs(q);

      if (snap.empty) {
        return {
          success: false,
          message: 'এই ফোন নাম্বারে কোনো অ্যাকাউন্ট খুঁজে পাওয়া যায়নি!'
        };
      }

      const userDoc = snap.docs[0];
      const data = userDoc.data() as UserProfile;

      // Check if user is banned
      if (data.isBanned) {
        return {
          success: false,
          message: 'আপনার অ্যাকাউন্টটি নীতিমালার লঙ্ঘনের কারণে ব্যান করা হয়েছে!'
        };
      }

      // Password verification
      const savedPass = localStorage.getItem(`bd_auth_pwd_${cleanPhone}`);
      if (savedPass && savedPass !== pass) {
        return {
          success: false,
          message: 'পাসওয়ার্ডটি সঠিক নয়! অনুগ্রহ করে সঠিক পাসওয়ার্ড দিন।'
        };
      }

      // Set active UID
      localStorage.setItem('bd_active_uid', data.uid);
      setUserProfile(data);

      // Update last active
      await updateDoc(doc(db, 'users', data.uid), {
        lastActiveAt: new Date().toISOString()
      }).catch(() => {});

      return { success: true };
    } catch (err: unknown) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'লগইনে সমস্যা হয়েছে।'
      };
    }
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    localStorage.removeItem('bd_active_uid');
    try {
      if (auth.currentUser) {
        await signOut(auth);
      }
    } catch (err) {
      console.warn('Signout err', err);
    }
    setUserProfile(null);
  };

  const updateBalance = async (delta: number) => {
    if (!userProfile) return;
    const userRef = doc(db, 'users', userProfile.uid);
    const newBalance = Math.max(0, (userProfile.balance || 0) + delta);
    const newTotal = delta > 0 ? (userProfile.totalIncome || 0) + delta : userProfile.totalIncome;

    await updateDoc(userRef, {
      balance: newBalance,
      totalIncome: newTotal,
      lastActiveAt: new Date().toISOString()
    });
  };

  const refreshProfile = async () => {
    if (!userProfile) return;
    const snap = await getDoc(doc(db, 'users', userProfile.uid));
    if (snap.exists()) {
      setUserProfile(snap.data() as UserProfile);
    }
  };

  const isAdmin =
    currentUser?.email === ADMIN_EMAIL ||
    userProfile?.role === 'admin' ||
    userProfile?.email === ADMIN_EMAIL;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        isAdmin,
        visitorId,
        settings,
        loginWithPhone,
        registerWithPhone,
        loginWithGoogle,
        logout,
        updateBalance,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
