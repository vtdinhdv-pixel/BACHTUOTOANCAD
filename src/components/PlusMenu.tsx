import { useState } from "react";
import { X, Info, Shield, BarChart2, Trash2, FileText } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Stats, Message } from "../types";
import { exportToDocx } from "../services/exportService";

interface PlusMenuProps {
  isOpen: boolean;
  onClose: () => void;
  stats: Stats;
  messages: Message[];
  studentName: string;
  onClearHistory: () => void;
}

export default function PlusMenu({ isOpen, onClose, stats, messages, studentName, onClearHistory }: PlusMenuProps) {
  const [activeTab, setActiveTab] = useState<'how' | 'safety' | 'stats' | 'clear' | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportToDocx(messages, studentName);
    } catch (error) {
      console.error("Export error:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h2 className="font-bold text-gray-700">Tiện ích học tập</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {/* Menu Options */}
          {!activeTab ? (
            <div className="grid grid-cols-1 gap-2">
              <MenuButton icon={<Info size={18} />} label="🤖 Cách hoạt động" onClick={() => setActiveTab('how')} />
              <MenuButton icon={<Shield size={18} />} label="🔐 An toàn & bảo mật" onClick={() => setActiveTab('safety')} />
              <MenuButton icon={<BarChart2 size={18} />} label="📊 Tiến bộ của em" onClick={() => setActiveTab('stats')} />
              <MenuButton 
                icon={isExporting ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" /> : <FileText size={18} />} 
                label="📝 Xuất bài học sang Word" 
                onClick={handleExport}
                disabled={isExporting || messages.length === 0}
              />
              <MenuButton icon={<Trash2 size={18} />} label="🧹 Xóa lịch sử" onClick={() => setActiveTab('clear')} variant="danger" />
            </div>
          ) : (
            <div className="min-h-[300px]">
              <button onClick={() => setActiveTab(null)} className="text-sm text-blue-600 mb-4 flex items-center gap-1">
                ← Quay lại
              </button>
              
              <AnimatePresence mode="wait">
                {activeTab === 'how' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 text-sm text-gray-600">
                    <h3 className="font-bold text-gray-800">Cách hoạt động:</h3>
                    <ul className="space-y-2">
                      <li><span className="font-bold text-red-500">Bước 1:</span> Bạn nhập bài toán hoặc chụp ảnh gửi lên.</li>
                      <li><span className="font-bold text-red-500">Bước 2:</span> Chatbot phân tích bài và nhận dạng dạng toán.</li>
                      <li><span className="font-bold text-red-500">Bước 3:</span> Chatbot gợi ý từng bước giải nhỏ.</li>
                      <li><span className="font-bold text-red-500">Bước 4:</span> Bạn tự làm và chatbot sẽ phản hồi, khen ngợi hoặc động viên.</li>
                    </ul>
                    <p className="italic bg-yellow-50 p-2 rounded border border-yellow-100">👉 Chatbot chỉ hỗ trợ học tập, không thay thế thầy cô.</p>
                  </motion.div>
                )}

                {activeTab === 'safety' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 text-sm text-gray-600">
                    <h3 className="font-bold text-gray-800">An toàn & bảo mật:</h3>
                    <ul className="list-disc pl-4 space-y-2">
                      <li>Ứng dụng KHÔNG yêu cầu thông tin cá nhân quan trọng (không cần số điện thoại, địa chỉ…).</li>
                      <li>Các câu hỏi của bạn chỉ dùng để hỗ trợ học tập.</li>
                      <li>Chatbot chỉ là công cụ hỗ trợ, không thay thế thầy cô.</li>
                    </ul>
                    <p className="italic bg-blue-50 p-2 rounded border border-blue-100">👉 Nếu thấy nội dung lạ hoặc sai, hãy bấm “Báo lỗi” hoặc hỏi thầy cô.</p>
                  </motion.div>
                )}

                {activeTab === 'stats' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 text-sm">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-gray-800">Tiến bộ của em:</h3>
                      <span className="text-[10px] text-gray-400 italic">Cập nhật: {new Date().toLocaleTimeString()}</span>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2">
                      <StatItem label="Tổng số bài/câu đã trao đổi" value={`${stats.total} bài`} />
                      <StatItem label="Số lần làm đúng/hiểu bài" value={`${stats.correct} lần`} color="text-green-600" />
                    </div>

                    {stats.total > 0 && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase">
                          <span>Tỉ lệ hoàn thành</span>
                          <span>{Math.round((stats.correct / stats.total) * 100)}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(stats.correct / stats.total) * 100}%` }}
                            className="h-full bg-green-500"
                          />
                        </div>
                      </div>
                    )}

                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">Kiến thức đã nắm vững</p>
                        <div className="flex flex-wrap gap-1">
                          {stats.strong.length > 0 ? (
                            stats.strong.map(t => <span key={t} className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-bold">{t}</span>)
                          ) : (
                            <span className="text-gray-400 italic text-[10px]">Đang thu thập dữ liệu...</span>
                          )}
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">Kiến thức cần lưu ý</p>
                        <div className="flex flex-wrap gap-1">
                          {stats.weak.length > 0 ? (
                            stats.weak.map(t => <span key={t} className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-[10px] font-bold">{t}</span>)
                          ) : (
                            <span className="text-gray-400 italic text-[10px]">Chưa có ghi nhận khó khăn.</span>
                          )}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-gray-200">
                        <p className="text-xs font-bold text-blue-600 flex items-center gap-1">
                          🚀 Gợi ý học tập: 
                          <span className="font-normal text-gray-600">
                            {stats.recommended.length > 0 ? stats.recommended.join(', ') : 'Hãy tiếp tục luyện tập nhé!'}
                          </span>
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'clear' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 text-center py-8">
                    <div className="space-y-2">
                      <h3 className="font-bold text-lg text-gray-800">Xóa lịch sử</h3>
                      <p className="text-sm text-gray-500">Xóa toàn bộ dữ liệu học tập của em. Hành động này không thể khôi phục.</p>
                      <p className="font-bold text-red-500">👉 Bạn có chắc?</p>
                    </div>
                    <div className="flex gap-3 justify-center">
                      <button onClick={() => setActiveTab(null)} className="px-6 py-2 rounded-full bg-gray-100 font-medium hover:bg-gray-200 transition-colors">Hủy</button>
                      <button onClick={() => { onClearHistory(); onClose(); }} className="px-6 py-2 rounded-full bg-red-500 text-white font-medium hover:bg-red-600 transition-colors">Xóa</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function MenuButton({ icon, label, onClick, variant = 'default', disabled = false }: { icon: any, label: string, onClick: () => void, variant?: 'default' | 'danger', disabled?: boolean }) {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-3 w-full p-4 rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:scale-100 ${
        variant === 'danger' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
      }`}
    >
      <span className={variant === 'danger' ? 'text-red-500' : 'text-blue-500'}>{icon}</span>
      <span className="font-medium text-left">{label}</span>
    </button>
  );
}

function StatItem({ label, value, color = "text-gray-700" }: { label: string, value: string, color?: string }) {
  return (
    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
      <span className="text-gray-500">{label}:</span>
      <span className={`font-bold ${color}`}>[ {value} ]</span>
    </div>
  );
}
