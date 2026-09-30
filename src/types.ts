export interface UserProfile {
  uid: string;
  phone: string;
  fullName: string;
  email?: string;
  balance: number;
  totalIncome: number;
  totalWithdraw: number;
  referralCode: string;
  referredBy?: string | null;
  totalReferrals: number;
  referralIncome: number;
  referralBonusPending: number; // Layer 5: pending commission (70 BDT per referral until 50 BDT income)
  referralBonusPaid: number;
  firstIncomeDone: boolean; // has this user made at least 50 BDT?
  isVerified: boolean; // verified via 150 BDT or 50 referrals
  isBanned: boolean;
  visitorId: string; // Layer 2: Device fingerprint
  role?: 'user' | 'admin';
  createdAt: string;
  lastActiveAt: string;
}

export interface TaskItem {
  id: string;
  title: string;
  link: string;
  reward: number;
  dailyLimit: number;
  isActive: boolean;
  category: 'youtube' | 'telegram' | 'facebook' | 'web';
  description?: string;
}

export interface TaskCompletion {
  id?: string;
  userId: string;
  taskId: string;
  reward: number;
  completedAt: string;
  dateStr: string; // YYYY-MM-DD
}

export interface AdCardConfig {
  id: number;
  title: string;
  subtitle: string;
  reward: number;
  dailyLimit: number;
  links: string[];
}

export interface AdViewRecord {
  id?: string;
  userId: string;
  cardId: number;
  adUrl: string;
  reward: number;
  viewedAt: string;
  dateStr: string;
}

export interface SpinRecord {
  id?: string;
  userId: string;
  amount: number;
  spunAt: string;
  dateStr: string;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  amount: number;
  method: 'bKash' | 'Nagad' | 'Rocket';
  accountNumber: string;
  accountType: 'personal' | 'agent';
  status: 'pending' | 'approved' | 'rejected';
  adminNote?: string;
  requestedAt: string;
  processedAt?: string;
}

export interface ActivationRequest {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  method: 'bKash' | 'Nagad' | 'free_referral';
  trxId?: string;
  screenshot?: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  adminNote?: string;
}

export interface AppNotification {
  id: string;
  userId?: string | null; // null for broadcast
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  type?: 'bonus' | 'task' | 'withdraw' | 'system' | 'verify';
}

export interface SuspiciousUserRecord {
  id: string;
  userId: string;
  userPhone?: string;
  reason: string;
  flaggedAt: string;
  reviewed: boolean;
  details?: string;
}

export interface SystemSettings {
  minWithdraw: number; // default 600
  minReferralsForWithdraw: number; // default 20
  referralBonus: number; // default 70
  referralQualifyIncome: number; // default 50
  verificationFee: number; // default 150
  freeVerificationReferrals: number; // default 50
  bkashNumber: string;
  nagadNumber: string;
  noticeText: string;
}
