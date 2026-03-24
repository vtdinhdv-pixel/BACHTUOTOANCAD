import { motion } from "motion/react";
import { GraduationCap, Plus, Settings } from "lucide-react";

interface OctopusHeaderProps {
  onTeacherClick: () => void;
  onNewChat: () => void;
  onSettingsClick: () => void;
  requestCount?: number;
}

export default function OctopusHeader({ onTeacherClick, onNewChat, onSettingsClick, requestCount = 0 }: OctopusHeaderProps) {
  return (
    <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-100 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-400" />
      
      <div className="flex items-center gap-3">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative z-10 flex items-center"
        >
          {/* Blue Doctorate Octopus SVG matching the image */}
          <div className="w-14 h-14 relative drop-shadow-sm">
            <svg viewBox="0 0 200 200" className="w-full h-full">
              {/* Graduation Cap (Mortarboard) */}
              <g transform="translate(0, -10)">
                <path d="M40 70 L100 40 L160 70 L100 100 Z" fill="#2c3e50" />
                <path d="M70 75 L70 90 Q100 105 130 90 L130 75" fill="#34495e" />
                {/* Tassel */}
                <path d="M160 70 L170 100" stroke="#f1c40f" strokeWidth="3" fill="none" />
                <circle cx="170" cy="105" r="5" fill="#f1c40f" />
              </g>
              
              {/* Octopus Body - Blue */}
              <circle cx="100" cy="130" r="65" fill="#74b9ff" />
              
              {/* Eyes & Glasses */}
              <g>
                {/* Eyes */}
                <circle cx="75" cy="125" r="15" fill="white" />
                <circle cx="125" cy="125" r="15" fill="white" />
                <circle cx="78" cy="128" r="8" fill="#2d3436" />
                <circle cx="122" cy="128" r="8" fill="#2d3436" />
                <circle cx="73" cy="120" r="4" fill="white" />
                <circle cx="118" cy="120" r="4" fill="white" />
                
                {/* Glasses Frames */}
                <circle cx="75" cy="125" r="18" stroke="#2d3436" strokeWidth="3" fill="none" />
                <circle cx="125" cy="125" r="18" stroke="#2d3436" strokeWidth="3" fill="none" />
                <path d="M93 125 L107 125" stroke="#2d3436" strokeWidth="3" />
              </g>
              
              {/* Blush */}
              <circle cx="55" cy="150" r="10" fill="#ff7675" opacity="0.4" />
              <circle cx="145" cy="150" r="10" fill="#ff7675" opacity="0.4" />
              
              {/* Smile */}
              <path d="M85 155 Q100 175 115 155" stroke="white" strokeWidth="5" fill="none" strokeLinecap="round" />
              
              {/* Tentacles - Blue */}
              <path d="M40 170 Q20 190 45 200" stroke="#74b9ff" strokeWidth="14" fill="none" strokeLinecap="round" />
              <path d="M160 170 Q180 190 155 200" stroke="#74b9ff" strokeWidth="14" fill="none" strokeLinecap="round" />
              <path d="M80 190 Q100 205 120 190" stroke="#74b9ff" strokeWidth="14" fill="none" strokeLinecap="round" />
            </svg>
          </div>
        </motion.div>
        
        <div className="flex flex-col">
          <h1 className="text-lg font-serif font-bold text-gray-800 tracking-tight uppercase">
            BẠCH TUỘC TOÁN VUI
          </h1>
          <p className="text-[10px] text-gray-400 italic -mt-1">Gia sư Toán lớp 6 tận tâm</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button 
          onClick={onSettingsClick}
          className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-all active:scale-95 group relative"
          title="Cài đặt API Key"
        >
          <Settings size={20} />
          {!localStorage.getItem("gemini_api_key") && (
             <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-bounce" />
          )}
        </button>

        <button 
          onClick={onNewChat}
          className="flex items-center gap-2 px-4 py-2 bg-white text-gray-600 border border-gray-200 rounded-full text-sm font-bold shadow-sm hover:bg-gray-50 transition-all active:scale-95"
        >
          <Plus size={18} className="text-blue-500" />
          <span className="hidden sm:inline">Chat mới</span>
        </button>

        <div className="relative">
          <button 
            onClick={onTeacherClick}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-full text-sm font-bold shadow-md hover:bg-indigo-700 transition-all active:scale-95 z-20"
          >
            <GraduationCap size={18} />
            <span className="hidden sm:inline">Giáo viên</span>
          </button>
          {requestCount > 0 && (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white shadow-sm"
            >
              {requestCount}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
