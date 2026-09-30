import React, { useState, useEffect, useRef } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  orderBy,
  limit,
  getDocs
} from 'firebase/firestore';
import { Dices, Sparkles, Clock, CheckCircle2, Gift, Award, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { SpinRecord } from '../types';
import { playRewardSound, checkAndPayReferralBonus } from '../utils/security';

const WHEEL_SEGMENTS = [
  { amount: 0.5, label: '৳০.৫০', color: '#d32f2f' },
  { amount: 1.0, label: '৳১.০০', color: '#fbc02d' },
  { amount: 1.5, label: '৳১.৫০', color: '#FF4500' },
  { amount: 2.0, label: '৳২.০০', color: '#f57c00' },
  { amount: 3.0, label: '৳৩.০০', color: '#e53935' },
  { amount: 5.0, label: '৳৫.০০', color: '#ffd54f' },
  { amount: 10.0, label: '৳১০.০০', color: '#c2185b' },
  { amount: 20.0, label: '৳২০.০০', color: '#388e3c' }
];

export const SpinWheelPage: React.FC = () => {
  const { userProfile, refreshProfile } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isSpinning, setIsSpinning] = useState(false);
  const [lastSpinTime, setLastSpinTime] = useState<number | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState<string>('');
  const [canSpin, setCanSpin] = useState<boolean>(true);
  const [wonAmount, setWonAmount] = useState<number | null>(null);
  const [showWonModal, setShowWonModal] = useState<boolean>(false);
  const [rotationAngle, setRotationAngle] = useState(0);

  const todayStr = new Date().toISOString().split('T')[0];

  // Draw the wheel onto canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 15;
    const numSegments = WHEEL_SEGMENTS.length;
    const arcSize = (2 * Math.PI) / numSegments;

    ctx.clearRect(0, 0, width, height);

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotationAngle);

    // Draw slices
    WHEEL_SEGMENTS.forEach((seg, i) => {
      const angle = i * arcSize;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, angle, angle + arcSize);
      ctx.closePath();
      ctx.fillStyle = seg.color;
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#fffdf0';
      ctx.stroke();

      // Draw label
      ctx.save();
      ctx.rotate(angle + arcSize / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px "Hind Siliguri", "Poppins", sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 4;
      ctx.fillText(seg.label, radius - 20, 5);
      ctx.restore();
    });

    // Draw center peg
    ctx.beginPath();
    ctx.arc(0, 0, 26, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffeb3b';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#d32f2f';
    ctx.stroke();

    ctx.fillStyle = '#d32f2f';
    ctx.font = 'black 14px "Poppins", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('BD', 0, 0);

    ctx.restore();
  }, [rotationAngle]);

  // Fetch last spin of user
  useEffect(() => {
    if (!userProfile) return;
    const q = query(
      collection(db, 'spins'),
      where('userId', '==', userProfile.uid),
      orderBy('spunAt', 'desc'),
      limit(1)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const last = snapshot.docs[0].data() as SpinRecord;
        const lastTime = new Date(last.spunAt).getTime();
        setLastSpinTime(lastTime);
      } else {
        setLastSpinTime(null);
        setCanSpin(true);
      }
    });

    return () => unsub();
  }, [userProfile]);

  // Update 24h countdown
  useEffect(() => {
    if (!lastSpinTime) {
      setCanSpin(true);
      setCooldownRemaining('');
      return;
    }

    const checkCooldown = () => {
      const now = Date.now();
      const diff = 24 * 60 * 60 * 1000 - (now - lastSpinTime);
      if (diff <= 0) {
        setCanSpin(true);
        setCooldownRemaining('');
      } else {
        setCanSpin(false);
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setCooldownRemaining(`${hours}ঘণ্টা ${minutes}মি. ${seconds}সে.`);
      }
    };

    checkCooldown();
    const interval = setInterval(checkCooldown, 1000);
    return () => clearInterval(interval);
  }, [lastSpinTime]);

  const handleSpinClick = async () => {
    if (!canSpin || isSpinning || !userProfile) return;
    setIsSpinning(true);

    // Pick random segment with weighted logic (realistic probabilities)
    const weights = [30, 25, 18, 12, 8, 4, 2, 1]; // sum = 100
    const randomVal = Math.random() * 100;
    let accumulated = 0;
    let selectedIndex = 0;
    for (let i = 0; i < weights.length; i++) {
      accumulated += weights[i];
      if (randomVal <= accumulated) {
        selectedIndex = i;
        break;
      }
    }

    const selectedPrize = WHEEL_SEGMENTS[selectedIndex];
    const numSegments = WHEEL_SEGMENTS.length;
    const arcSize = (2 * Math.PI) / numSegments;

    // Angle that puts this segment at the top (3*PI / 2)
    // The top pointer points at angle = 1.5 * Math.PI (or -Math.PI / 2)
    const targetSegmentCenter = selectedIndex * arcSize + arcSize / 2;
    const extraSpins = 6; // 6 full rotations
    const finalAngle = extraSpins * 2 * Math.PI + (1.5 * Math.PI - targetSegmentCenter);

    const duration = 4000;
    const startTime = performance.now();
    const initialAngle = rotationAngle % (2 * Math.PI);

    const animateWheel = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentA = initialAngle + (finalAngle - initialAngle) * easeOut;
      setRotationAngle(currentA);

      if (progress < 1) {
        requestAnimationFrame(animateWheel);
      } else {
        // Spin finished
        finishSpin(selectedPrize.amount);
      }
    };

    requestAnimationFrame(animateWheel);
  };

  const finishSpin = async (amount: number) => {
    if (!userProfile) return;
    setIsSpinning(false);
    setWonAmount(amount);
    setShowWonModal(true);

    try {
      const now = new Date().toISOString();
      // Record spin in Firestore
      await addDoc(collection(db, 'spins'), {
        userId: userProfile.uid,
        amount,
        spunAt: now,
        dateStr: todayStr
      });

      // Update user balance
      const newBalance = (userProfile.balance || 0) + amount;
      const newTotal = (userProfile.totalIncome || 0) + amount;

      await updateDoc(doc(db, 'users', userProfile.uid), {
        balance: newBalance,
        totalIncome: newTotal,
        lastActiveAt: now
      });

      // Layer 5 check: if user reached 50 BDT, pay referrer 70 BDT
      await checkAndPayReferralBonus(userProfile.uid, newTotal);

      playRewardSound();
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 }
      });
      refreshProfile();
    } catch (err) {
      console.error('Spin record error', err);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-5 space-y-5 text-center">
      {/* Title */}
      <div className="bg-gradient-to-r from-[#FF4500] to-[#d32f2f] text-white p-5 rounded-3xl shadow-lg border-2 border-[#ffeb3b]">
        <div className="inline-flex p-2 rounded-xl bg-white/20 text-[#ffeb3b] mb-1">
          <Dices className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-black font-['Poppins']">লাকি স্পিন অ্যান্ড আর্ন</h2>
        <p className="text-xs text-amber-100 mt-1">
          প্রতিদিন ১ বার ফ্রি স্পিন করুন আর জিতে নিন সর্বোচ্চ ৳২০ পর্যন্ত নিশ্চিত পুরস্কার!
        </p>
      </div>

      {/* Wheel Card */}
      <div className="bg-white rounded-3xl p-6 shadow-xl border-2 border-[#fbc02d] flex flex-col items-center relative overflow-hidden">
        {/* Top Pointer Indicator */}
        <div className="z-10 -mb-4 flex flex-col items-center drop-shadow-md">
          <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[24px] border-t-[#d32f2f]" />
        </div>

        {/* Wheel Canvas */}
        <canvas
          ref={canvasRef}
          width={320}
          height={320}
          className="max-w-full drop-shadow-lg"
        />

        {/* Cooldown or Spin Button */}
        <div className="mt-6 w-full">
          {canSpin ? (
            <button
              onClick={handleSpinClick}
              disabled={isSpinning}
              className="w-full py-4 bg-gradient-to-r from-[#FF4500] via-[#d32f2f] to-[#b71c1c] hover:brightness-110 text-white font-black rounded-2xl shadow-xl flex items-center justify-center gap-2 text-base active:scale-95 transition disabled:opacity-50 border-2 border-[#ffeb3b]"
            >
              <Sparkles className="w-5 h-5 text-[#ffeb3b] animate-bounce" />
              <span>{isSpinning ? 'চাকা ঘুরছে...' : 'ফ্রি স্পিন করুন! 🎡'}</span>
            </button>
          ) : (
            <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-300 text-xs text-amber-900 flex flex-col items-center gap-1">
              <div className="flex items-center gap-1.5 font-bold text-gray-700">
                <Clock className="w-4 h-4 text-[#d32f2f]" />
                <span>পরবর্তী ফ্রি স্পিনের সময় বাকি:</span>
              </div>
              <span className="text-base font-black text-[#d32f2f] font-['Poppins']">
                {cooldownRemaining}
              </span>
              <span className="text-[10px] text-gray-500">(প্রতি ২৪ ঘণ্টায় ১ বার ফ্রি সুযোগ)</span>
            </div>
          )}
        </div>
      </div>

      {/* Win Modal */}
      {showWonModal && wonAmount !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in zoom-in-95">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 text-center shadow-2xl border-4 border-[#ffeb3b] space-y-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#ffeb3b] to-[#fbc02d] text-[#d32f2f] flex items-center justify-center mx-auto border-4 border-white shadow-lg animate-bounce">
              <Award className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-2xl font-black text-gray-900 font-['Poppins']">
                অভিনন্দন! 🎉
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                আপনি জিতেছেন{' '}
                <span className="text-2xl font-black text-[#d32f2f] font-['Poppins']">
                  ৳{wonAmount.toFixed(2)}
                </span>
              </p>
              <p className="text-xs text-emerald-600 font-semibold mt-1">
                টাকাটি আপনার ব্যালেন্সে যোগ করে দেওয়া হয়েছে!
              </p>
            </div>

            <button
              onClick={() => setShowWonModal(false)}
              className="w-full py-3 bg-[#d32f2f] hover:bg-[#b71c1c] text-white font-bold rounded-2xl text-sm transition"
            >
              ধন্যবাদ!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
