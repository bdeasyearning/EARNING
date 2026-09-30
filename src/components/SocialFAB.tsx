import React, { useState } from 'react';
import { MessageCircle, Youtube, Send, X, Share2, HelpCircle } from 'lucide-react';

export const SocialFAB: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-5 z-40 flex flex-col items-end gap-2.5">
      {isOpen && (
        <div className="flex flex-col gap-2.5 animate-in slide-in-from-bottom-5 duration-200">
          {/* Telegram Button */}
          <a
            href="https://t.me/BDEasyEarning_1"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 bg-[#229ED9] hover:bg-[#1b85b8] text-white px-4 py-2.5 rounded-full shadow-lg font-medium text-sm transition-transform active:scale-95 border-2 border-white"
          >
            <Send className="w-4 h-4 fill-white" />
            <span>Telegram চ্যানেল</span>
          </a>

          {/* YouTube Button */}
          <a
            href="https://youtube.com/@bdeasyearning"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 bg-[#FF0000] hover:bg-[#cc0000] text-white px-4 py-2.5 rounded-full shadow-lg font-medium text-sm transition-transform active:scale-95 border-2 border-white"
          >
            <Youtube className="w-4 h-4" />
            <span>YouTube চ্যানেল</span>
          </a>
        </div>
      )}

      {/* Main FAB toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-13 h-13 rounded-full bg-[#FF4500] hover:bg-[#e03d00] text-white flex items-center justify-center shadow-xl border-2 border-[#ffeb3b] transition-all transform active:scale-90"
        title="হেল্প ও সোশ্যাল কমিউনিটি"
        aria-label="Social Help and Channels"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6 animate-bounce" />}
      </button>
    </div>
  );
};
