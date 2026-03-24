import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Users, MessageSquare, PieChart as PieChartIcon, BookOpen, BarChart3, Send } from "lucide-react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";

interface TeacherDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  onRespond: (requestId: string, response: string) => void;
  stats: {
    studentCount: number;
    questions: string[];
    topicData: { topic: string; count: number }[];
    teacherRequests: { id: string; content: string; timestamp: any; studentName?: string; status?: string }[];
  };
}

const COLORS = ["#6366f1", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function TeacherDashboard({ isOpen, onClose, onRespond, stats }: TeacherDashboardProps) {
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");

  const handleSendResponse = (id: string) => {
    if (!responseText.trim()) return;
    onRespond(id, responseText);
    setRespondingTo(null);
    setResponseText("");
  };

  const pendingRequests = stats.teacherRequests.filter(r => r.status === "pending");

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-600 p-2 rounded-xl text-white">
                  <BookOpen size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Bảng Điều Khiển Giáo Viên</h2>
                  <p className="text-xs text-gray-500">Phân tích kiến thức và tương tác của học sinh</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/50 rounded-full transition-colors text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 flex items-center gap-4">
                  <div className="bg-blue-500/10 p-3 rounded-xl text-blue-600">
                    <Users size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Sĩ số học sinh</p>
                    <p className="text-2xl font-bold text-blue-900">{stats.studentCount}</p>
                  </div>
                </div>
                
                <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100 flex items-center gap-4">
                  <div className="bg-indigo-500/10 p-3 rounded-xl text-indigo-600">
                    <MessageSquare size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-indigo-600 font-medium">Câu hỏi đã hỏi</p>
                    <p className="text-2xl font-bold text-indigo-900">{stats.questions.length}</p>
                  </div>
                </div>

                <div className="bg-red-50 p-5 rounded-2xl border border-red-100 flex items-center gap-4">
                  <div className="bg-red-500/10 p-3 rounded-xl text-red-600">
                    <Users size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-red-600 font-medium">Yêu cầu hỗ trợ</p>
                    <p className="text-2xl font-bold text-red-900">{pendingRequests.length}</p>
                  </div>
                </div>
              </div>

              {/* Teacher Requests Section */}
              {pendingRequests.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Users size={20} className="text-red-500" />
                    Yêu cầu hỗ trợ mới nhất
                  </h3>
                  <div className="space-y-3">
                    {pendingRequests.map((req) => (
                      <div key={req.id} className="p-4 bg-red-50 rounded-2xl border border-red-100 flex flex-col gap-3 animate-pulse-subtle">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="text-sm text-gray-800 font-medium whitespace-pre-wrap">
                              {req.content.split('\n').map((line, i) => (
                                <div key={i} className={i > 0 ? "text-xs text-gray-600 mt-1 font-normal italic bg-white/50 p-1 rounded" : ""}>
                                  {line}
                                </div>
                              ))}
                            </div>
                            <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
                              {req.timestamp?.toDate ? req.timestamp.toDate().toLocaleTimeString() : new Date(req.timestamp).toLocaleTimeString()} - {req.studentName || "Học sinh"}
                            </p>
                          </div>
                          {respondingTo !== req.id && (
                            <button 
                              onClick={() => setRespondingTo(req.id)}
                              className="px-4 py-1.5 bg-red-500 text-white text-xs font-bold rounded-full hover:bg-red-600 transition-colors"
                            >
                              Phản hồi ngay
                            </button>
                          )}
                        </div>

                        {respondingTo === req.id && (
                          <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex gap-2"
                          >
                            <input 
                              type="text"
                              value={responseText}
                              onChange={(e) => setResponseText(e.target.value)}
                              placeholder="Nhập phản hồi của thầy cô..."
                              className="flex-1 p-2 text-sm border border-red-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400"
                              autoFocus
                              onKeyDown={(e) => e.key === 'Enter' && handleSendResponse(req.id)}
                            />
                            <button 
                              onClick={() => handleSendResponse(req.id)}
                              className="p-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
                            >
                              <Send size={18} />
                            </button>
                            <button 
                              onClick={() => {
                                setRespondingTo(null);
                                setResponseText("");
                              }}
                              className="p-2 bg-gray-200 text-gray-600 rounded-xl hover:bg-gray-300 transition-colors"
                            >
                              <X size={18} />
                            </button>
                          </motion.div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Chart Section */}
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <PieChartIcon size={20} className="text-indigo-500" />
                    Biểu đồ kiến thức học sinh đã hỏi
                  </h3>
                  <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-1 rounded-full uppercase font-bold">
                    Phân bổ theo chủ đề
                  </span>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.topicData} layout="vertical" margin={{ left: 40, right: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" hide />
                      <YAxis 
                        dataKey="topic" 
                        type="category" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#475569', fontSize: 12, fontWeight: 500 }}
                        width={100}
                      />
                      <Tooltip 
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ 
                          borderRadius: '12px', 
                          border: 'none', 
                          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                          padding: '12px'
                        }}
                      />
                      <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={32}>
                        {stats.topicData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <MessageSquare size={20} className="text-blue-500" />
                  Danh sách câu hỏi chi tiết
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {stats.questions.length > 0 ? (
                    stats.questions.map((q, i) => (
                      <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-sm text-gray-700 hover:bg-white hover:shadow-sm transition-all">
                        {q}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 italic text-sm">Chưa có câu hỏi nào được ghi nhận.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 text-center text-[10px] text-gray-400 uppercase tracking-widest">
              Hệ thống quản lý học tập thông minh v1.0
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
