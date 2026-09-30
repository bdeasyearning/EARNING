import FingerprintJS from '@fingerprintjs/fingerprintjs';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile, SystemSettings } from '../types';

let fpPromise: ReturnType<typeof FingerprintJS.load> | null = null;

export async function getDeviceVisitorId(): Promise<string> {
  try {
    if (!fpPromise) {
      fpPromise = FingerprintJS.load();
    }
    const fp = await fpPromise;
    const result = await fp.get();
    return result.visitorId || 'dev-' + Math.random().toString(36).substring(2, 10);
  } catch (err) {
    console.warn('Fingerprint error, fallback used:', err);
    let fallbackId = localStorage.getItem('bd_device_vid');
    if (!fallbackId) {
      fallbackId = 'fp_' + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
      localStorage.setItem('bd_device_vid', fallbackId);
    }
    return fallbackId;
  }
}

// Sound effects and vibration
export function playRewardSound() {
  try {
    const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
    osc.frequency.exponentialRampToValueAtTime(1174.66, audioCtx.currentTime + 0.3); // D6
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.36);

    if ('vibrate' in navigator) {
      navigator.vibrate([80, 40, 80]);
    }
  } catch {
    // Audio might fail without user gesture, ignored
  }
}

export function playSuccessChime() {
  try {
    const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
    osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
    osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2); // G5
    osc.frequency.setValueAtTime(1046.50, audioCtx.currentTime + 0.3); // C6
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.45);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.46);

    if ('vibrate' in navigator) {
      navigator.vibrate(120);
    }
  } catch {
    // ignore
  }
}

export interface DeviceLockCheckResult {
  allowed: boolean;
  message?: string;
  reason?: string;
}

/**
 * Cloud Function simulation / Client-side 4-Layer + Anti-fraud validation
 */
export async function checkDeviceLock(
  phone: string,
  visitorId: string,
  referrerCode?: string
): Promise<DeviceLockCheckResult> {
  const cleanPhone = phone.trim().replace(/\D/g, '');

  // 1. Format check
  if (!/^01[3-9]\d{8}$/.test(cleanPhone)) {
    return {
      allowed: false,
      message: 'সঠিক ১১ ডিজিটের বাংলাদেশি ফোন নাম্বার দিন (যেমন: 017XXXXXXXX)'
    };
  }

  // 2. Layer 1: Phone Lock Check
  try {
    const phoneRef = doc(db, 'phones', cleanPhone);
    const phoneSnap = await getDoc(phoneRef);
    if (phoneSnap.exists()) {
      return {
        allowed: false,
        message: 'এই ফোন নাম্বার দিয়ে আগেই একটি অ্যাকাউন্ট খোলা হয়েছে!'
      };
    }
  } catch (err) {
    console.error('Phone check error', err);
  }

  // 3. Layer 2: Device Fingerprint Lock Check
  try {
    const deviceRef = doc(db, 'devices', visitorId);
    const deviceSnap = await getDoc(deviceRef);
    if (deviceSnap.exists()) {
      return {
        allowed: false,
        message: 'এই ফোন/ডিভাইস থেকে আগেই একটি অ্যাকাউন্ট খোলা হয়েছে!'
      };
    }
  } catch (err) {
    console.error('Device check error', err);
  }

  // 4. Layer 7 & 8: Anti-Fake Referral Checks
  if (referrerCode) {
    try {
      const q = query(collection(db, 'users'), where('referralCode', '==', referrerCode.trim().toUpperCase()));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const referrerDoc = snap.docs[0];
        const referrerData = referrerDoc.data() as UserProfile;

        // Anti-fraud: Referrer cannot refer themselves on same device!
        if (referrerData.visitorId === visitorId) {
          // Flag suspicious fraud attempt
          await addDoc(collection(db, 'suspicious_users'), {
            userId: referrerData.uid,
            userPhone: referrerData.phone,
            reason: 'same visitorId referrals',
            flaggedAt: new Date().toISOString(),
            reviewed: false,
            details: `Referral code used on same device visitorId: ${visitorId}`
          }).catch(() => {});

          return {
            allowed: false,
            message: 'একই ডিভাইস থেকে নিজের রেফারেল কোড ব্যবহার করা সম্পূর্ণ নিষিদ্ধ!'
          };
        }

        // Daily referral rate limit check (max 5 per 24 hours)
        const todayStr = new Date().toISOString().split('T')[0];
        const dailyRefDoc = doc(db, 'daily_referrals', `${referrerData.uid}_${todayStr}`);
        const dailySnap = await getDoc(dailyRefDoc);
        if (dailySnap.exists()) {
          const currentCount = dailySnap.data().count || 0;
          if (currentCount >= 5) {
            // Flag as 5+ referrals in 24h
            await addDoc(collection(db, 'suspicious_users'), {
              userId: referrerData.uid,
              userPhone: referrerData.phone,
              reason: '5+ referrals in 24h',
              flaggedAt: new Date().toISOString(),
              reviewed: false,
              details: `Referral threshold reached on ${todayStr} (${currentCount + 1})`
            }).catch(() => {});
          }
        }
      }
    } catch (err) {
      console.warn('Referral check err', err);
    }
  }

  return { allowed: true };
}

/**
 * Register phone lock, device lock, and referral tracking atomically
 */
export async function registerDeviceAndLocks(
  userId: string,
  phone: string,
  visitorId: string,
  referrerUid?: string | null
) {
  const cleanPhone = phone.trim().replace(/\D/g, '');
  const now = new Date().toISOString();
  const todayStr = now.split('T')[0];

  try {
    // Save phone lock
    await setDoc(doc(db, 'phones', cleanPhone), {
      phone: cleanPhone,
      userId,
      createdAt: now
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `phones/${cleanPhone}`);
  }

  try {
    // Save device lock
    await setDoc(doc(db, 'devices', visitorId), {
      visitorId,
      userId,
      createdAt: now
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `devices/${visitorId}`);
  }

  // Update referrer stats
  if (referrerUid) {
    try {
      const referrerRef = doc(db, 'users', referrerUid);
      const referrerSnap = await getDoc(referrerRef);
      if (referrerSnap.exists()) {
        const rData = referrerSnap.data() as UserProfile;
        const newTotal = (rData.totalReferrals || 0) + 1;
        // Layer 5: Pending bonus is credited (70 BDT), NOT added to balance yet!
        const newPending = (rData.referralBonusPending || 0) + 70;

        await updateDoc(referrerRef, {
          totalReferrals: newTotal,
          referralBonusPending: newPending
        });

        // Track daily referral count
        const dailyRef = doc(db, 'daily_referrals', `${referrerUid}_${todayStr}`);
        const dailySnap = await getDoc(dailyRef);
        if (dailySnap.exists()) {
          await updateDoc(dailyRef, {
            count: (dailySnap.data().count || 0) + 1
          });
        } else {
          await setDoc(dailyRef, {
            userId: referrerUid,
            date: todayStr,
            count: 1
          });
        }

        // Send notification to referrer
        await addDoc(collection(db, 'notifications'), {
          userId: referrerUid,
          title: 'নতুন রেফারেল যুক্ত হয়েছে! 🎉',
          message: `আপনার রেফারেল কোড দিয়ে নতুন ইউজার অ্যাকাউন্ট খুলেছে। তিনি প্রথম ৫০৳ আয় করলেই আপনার একাউন্টে ৭০৳ বোনাস যুক্ত হবে!`,
          isRead: false,
          createdAt: now,
          type: 'bonus'
        });
      }
    } catch (err) {
      console.warn('Referral update error', err);
    }
  }
}

/**
 * Layer 5 & 6: Check and release referral bonus (70 BDT) when user reaches 50 BDT income
 */
export async function checkAndPayReferralBonus(userId: string, currentTotalIncome: number) {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return;

    const userData = userSnap.data() as UserProfile;
    // Check if user already got first income done or has no referrer
    if (userData.firstIncomeDone || !userData.referredBy) return;

    // Check threshold (50 BDT)
    if (currentTotalIncome >= 50) {
      const now = new Date().toISOString();

      // Mark user first income as done
      await updateDoc(userRef, {
        firstIncomeDone: true
      });

      // Pay 70 BDT to referrer
      const referrerRef = doc(db, 'users', userData.referredBy);
      const referrerSnap = await getDoc(referrerRef);
      if (referrerSnap.exists()) {
        const rData = referrerSnap.data() as UserProfile;
        const newPending = Math.max(0, (rData.referralBonusPending || 0) - 70);
        const newPaid = (rData.referralBonusPaid || 0) + 70;
        const newBalance = (rData.balance || 0) + 70;
        const newTotalIncome = (rData.totalIncome || 0) + 70;
        const newReferralIncome = (rData.referralIncome || 0) + 70;

        await updateDoc(referrerRef, {
          balance: newBalance,
          totalIncome: newTotalIncome,
          referralIncome: newReferralIncome,
          referralBonusPending: newPending,
          referralBonusPaid: newPaid
        });

        // Notify referrer
        await addDoc(collection(db, 'notifications'), {
          userId: userData.referredBy,
          title: '৭০৳ রেফার বোনাস পেইড! 💰',
          message: `অভিনন্দন! আপনার রেফার করা মেম্বার (${userData.fullName || userData.phone}) প্রথম ৫০৳ আয় সম্পন্ন করেছেন। আপনার ব্যালেন্সে ৭০৳ যোগ হয়েছে!`,
          isRead: false,
          createdAt: now,
          type: 'bonus'
        });
      }
    }
  } catch (err) {
    console.error('Error paying referral bonus', err);
  }
}

export const DEFAULT_SETTINGS: SystemSettings = {
  minWithdraw: 600,
  minReferralsForWithdraw: 20,
  referralBonus: 70,
  referralQualifyIncome: 50,
  verificationFee: 150,
  freeVerificationReferrals: 50,
  bkashNumber: '01888-123456',
  nagadNumber: '01999-654321',
  noticeText: '🎉 BD Easy Earning-এ স্বাগতম! প্রতিদিন টাস্ক ও অ্যাড দেখে আয় করুন। রেফার করে প্রতি রেফারে পান ৭০৳!'
};
