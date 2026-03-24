import { useState, useRef, useEffect } from "react";
import { Paperclip, Plus, Send, MessageSquareText, AlertTriangle, UserRound, X, Layout } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { gemini } from "../services/geminiService";
import { Message, Stats } from "../types";
import PlusMenu from "./PlusMenu";
import MathVisualizer from "./MathVisualizer";
import { 
  db, 
  auth, 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  addDoc, 
  serverTimestamp, 
  doc, 
  setDoc,
  handleFirestoreError,
  OperationType
} from "../firebase";

interface ChatInterfaceProps {
  sessionId: string;
  onNewChat: () => void;
  onMessageSent?: (question: string) => void;
  onTeacherRequest?: (content: string) => void;
  onStatsUpdate?: (stats: Stats) => void;
  teacherResponse?: { content: string; timestamp: number } | null;
  onTeacherResponseHandled?: () => void;
}

export default function ChatInterface({ 
  sessionId,
  onNewChat,
  onMessageSent, 
  onTeacherRequest, 
  onStatsUpdate,
  teacherResponse,
  onTeacherResponseHandled
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showVisualizer, setShowVisualizer] = useState(false);
  const [visualizerData, setVisualizerData] = useState<{topic: string, data?: any}>({ topic: "" });
  
  const [stats, setStats] = useState<Stats>({
    total: 0,
    correct: 0,
    needsPractice: 0,
    strong: [],
    weak: [],
    recommended: ["Phân số", "Số nguyên"],
  });

  const calculateStatsFromMessages = (msgs: Message[]) => {
    const newStats: Stats = {
      total: 0,
      correct: 0,
      needsPractice: 0,
      strong: [],
      weak: [],
      recommended: ["Phân số", "Số nguyên"],
    };

    const topics = {
      "Phân số": ["phân số", "tử số", "mẫu số", "rút gọn"],
      "Số nguyên": ["số nguyên", "âm", "dương", "giá trị tuyệt đối"],
      "Hình học": ["hình học", "tam giác", "hình vuông", "chu vi", "diện tích", "góc"],
      "Tính chia hết": ["chia hết", "ước", "bội", "số nguyên tố"]
    };

    const correctKeywords = ["tốt lắm", "chính xác", "đúng rồi", "giỏi quá", "rất tốt", "hoàn thành"];
    const weakKeywords = ["làm lại nhé", "thử lại", "chưa đúng", "nhầm rồi", "cần xem lại", "sai rồi"];

    for (let i = 0; i < msgs.length - 1; i++) {
      const current = msgs[i];
      const next = msgs[i + 1];

      if (current.role === 'user' && next.role === 'assistant') {
        newStats.total += 1;
        const lowerInput = current.content.toLowerCase();
        const lowerResponse = next.content.toLowerCase();

        let detectedTopic = "";
        for (const [topic, keywords] of Object.entries(topics)) {
          if (keywords.some(k => lowerInput.includes(k) || lowerResponse.includes(k))) {
            detectedTopic = topic;
            break;
          }
        }

        const isCorrect = correctKeywords.some(k => lowerResponse.includes(k));
        const needsPractice = weakKeywords.some(k => lowerResponse.includes(k));

        if (isCorrect) newStats.correct += 1;
        if (needsPractice) newStats.needsPractice += 1;

        if (detectedTopic) {
          if (isCorrect) {
            if (!newStats.strong.includes(detectedTopic)) {
              newStats.strong.push(detectedTopic);
              newStats.weak = newStats.weak.filter(t => t !== detectedTopic);
            }
          } else if (needsPractice) {
            if (!newStats.weak.includes(detectedTopic)) {
              newStats.weak.push(detectedTopic);
              newStats.strong = newStats.strong.filter(t => t !== detectedTopic);
            }
          }
        }
      }
    }

    const recommendations: string[] = [];
    const weakActions: Record<string, string> = {
      "Phân số": "Luyện tập rút gọn và quy đồng mẫu số",
      "Số nguyên": "Ôn tập quy tắc cộng trừ số nguyên âm",
      "Hình học": "Thực hành tính chu vi và diện tích các hình cơ bản",
      "Tính chia hết": "Xem lại các dấu hiệu chia hết cho 2, 3, 5, 9"
    };

    newStats.weak.forEach(topic => {
      if (weakActions[topic]) recommendations.push(weakActions[topic]);
    });

    if (recommendations.length === 0) {
      recommendations.push("Thử sức với các bài toán nâng cao về Phân số");
      recommendations.push("Thách thức bản thân với bài toán đố về Số nguyên");
    }

    newStats.recommended = recommendations.slice(0, 2);

    // Also update visualizer topic based on the VERY last message
    const lastMsg = msgs[msgs.length - 1];
    if (lastMsg && lastMsg.role === 'assistant') {
       if (lastMsg.content.toLowerCase().includes("phân số")) {
         setVisualizerData({ topic: "Phân số", data: { parts: 4, shaded: 1 } });
       } else if (lastMsg.content.toLowerCase().includes("số nguyên")) {
         setVisualizerData({ topic: "Số nguyên", data: { value: 0 } });
       }
    }

    return newStats; 
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load/Sync Messages from Firestore
  useEffect(() => {
    if (!auth.currentUser) return;

    gemini.resetChat();

    let unsubscribe: (() => void) | undefined;

    const setupChat = async () => {
      if (!auth.currentUser) return;

      const sessionRef = doc(db, "chatSessions", sessionId);
      try {
        await setDoc(sessionRef, {
          studentUid: auth.currentUser.uid,
          studentName: auth.currentUser.displayName || "Học sinh",
          createdAt: serverTimestamp(),
          lastMessageAt: serverTimestamp()
        }, { merge: true });
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `chatSessions/${sessionId}`);
        return;
      }

      const messagesRef = collection(db, "chatSessions", sessionId, "messages");
      const q = query(messagesRef, orderBy("timestamp", "asc"));

      unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedMessages = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            role: data.role,
            content: data.content,
            timestamp: data.timestamp?.toMillis() || Date.now(),
            image: data.image
          } as Message;
        });

        if (fetchedMessages.length === 0) {
          const welcomeMsg = {
            role: "assistant",
            senderUid: "assistant",
            content: "Chào em! Mình là chú Bạch Tuộc Gia sư đây 😊. Hôm nay chúng ta sẽ cùng khám phá thế giới Toán lớp 6 nhé! \n\nEm đang gặp khó khăn ở bài nào? Ví dụ như **Phân số**, **Số nguyên** hay **Hình học**? Hãy gửi đề bài hoặc chụp ảnh cho mình xem nhé!",
            timestamp: serverTimestamp(),
            sessionId: sessionId
          };
          addDoc(messagesRef, welcomeMsg).catch(e => handleFirestoreError(e, OperationType.CREATE, `chatSessions/${sessionId}/messages`));
        } else {
          setMessages(fetchedMessages);
          // Detect topic for visualization
          const lastMsg = fetchedMessages[fetchedMessages.length - 1];
          if (lastMsg && lastMsg.role === 'assistant') {
             if (lastMsg.content.toLowerCase().includes("phân số")) {
               setVisualizerData({ topic: "Phân số", data: { parts: 4, shaded: 1 } });
             } else if (lastMsg.content.toLowerCase().includes("số nguyên")) {
               setVisualizerData({ topic: "Số nguyên", data: { value: 2 } });
             }
          }
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, `chatSessions/${sessionId}/messages`);
      });
    };

    setupChat();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [sessionId]);

  // Handle teacher response
  useEffect(() => {
    if (teacherResponse && auth.currentUser) {
      const messagesRef = collection(db, "chatSessions", sessionId, "messages");
      addDoc(messagesRef, {
        role: "teacher",
        senderUid: "teacher",
        content: teacherResponse.content,
        timestamp: serverTimestamp(),
        sessionId: sessionId
      }).catch(e => handleFirestoreError(e, OperationType.CREATE, `chatSessions/${sessionId}/messages`));
      
      if (onTeacherResponseHandled) {
        onTeacherResponseHandled();
      }
    }
  }, [teacherResponse, onTeacherResponseHandled, sessionId]);

  // Notify parent when stats change
  useEffect(() => {
    if (onStatsUpdate) {
      onStatsUpdate(stats);
    }
  }, [stats, onStatsUpdate]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (customContent?: string) => {
    const messageContent = customContent || input;
    if (!messageContent.trim() && !selectedImage) return;
    if (!auth.currentUser) return;

    const messagesRef = collection(db, "chatSessions", sessionId, "messages");
    
    try {
      await addDoc(messagesRef, {
        role: "user",
        senderUid: auth.currentUser.uid,
        content: messageContent,
        timestamp: serverTimestamp(),
        image: selectedImage || null,
        sessionId: sessionId
      });

      if (messageContent.trim() && onMessageSent) {
        onMessageSent(messageContent.trim());
      }

      setInput("");
      setSelectedImage(null);
      setIsLoading(true);

      const response = await gemini.sendMessage(messageContent, selectedImage || undefined);
      
      await addDoc(messagesRef, {
        role: "assistant",
        senderUid: "assistant",
        content: response || "Mình chưa rõ lắm, em nói lại được không? 😊",
        timestamp: serverTimestamp(),
        sessionId: sessionId
      });

      await setDoc(doc(db, "chatSessions", sessionId), {
        lastMessageAt: serverTimestamp()
      }, { merge: true });

    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `chatSessions/${sessionId}/messages`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTeacherRequest = () => {
    if (!auth.currentUser) return;
    
    const lastAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant');
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    
    let context = "";
    if (lastUserMsg) context += `\n- Câu hỏi của em: "${lastUserMsg.content}"`;
    if (lastAssistantMsg) context += `\n- Chú Bạch Tuộc đang hướng dẫn: "${lastAssistantMsg.content.substring(0, 100)}..."`;

    const requestText = `Bài này khó quá, em muốn nhờ thầy cô giúp đỡ ạ! ${context}`;
    
    if (onTeacherRequest) {
      onTeacherRequest(requestText);
    }

    const messagesRef = collection(db, "chatSessions", sessionId, "messages");
    addDoc(messagesRef, {
      role: "user",
      senderUid: auth.currentUser.uid,
      content: "Mình muốn nhờ thầy cô giúp đỡ bài này ạ!",
      timestamp: serverTimestamp(),
      sessionId: sessionId
    }).catch(e => handleFirestoreError(e, OperationType.CREATE, `chatSessions/${sessionId}/messages`));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto bg-white shadow-xl relative">
      {/* Visualizer Sidebar/Drawer Toggle */}
      {visualizerData.topic && (
        <button 
          onClick={() => setShowVisualizer(!showVisualizer)}
          className={`absolute -left-12 top-4 p-3 rounded-l-2xl shadow-lg transition-all z-20 flex flex-col items-center gap-1 ${showVisualizer ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border border-gray-100'}`}
          title="Xem trực quan"
        >
          <Layout size={20} />
          <span className="text-[8px] font-bold uppercase">Hình vẽ</span>
        </button>
      )}

      {/* Visualizer Overlay */}
      <AnimatePresence>
        {showVisualizer && visualizerData.topic && (
          <motion.div 
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            className="absolute -left-80 top-4 w-72 z-30"
          >
            <div className="relative">
               <button 
                onClick={() => setShowVisualizer(false)}
                className="absolute -top-2 -right-2 bg-gray-800 text-white rounded-full p-1 z-40"
               >
                 <X size={12} />
               </button>
               <MathVisualizer topic={visualizerData.topic} data={visualizerData.data} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#fdfbf7]">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${
                  msg.role === "user"
                    ? "bg-red-500 text-white rounded-tr-none"
                    : msg.role === "teacher"
                    ? "bg-indigo-600 text-white rounded-tl-none"
                    : "bg-white text-gray-800 border border-gray-100 rounded-tl-none"
                }`}
              >
                {msg.role === "teacher" && (
                  <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-white/20">
                    <UserRound size={14} className="text-white" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Phản hồi từ Thầy Cô</span>
                  </div>
                )}
                {msg.image && (
                  <img src={msg.image} alt="Uploaded" className="mb-2 rounded-lg max-h-60 object-contain" />
                )}
                <div className="markdown-body prose prose-sm max-w-none">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm, remarkMath]} 
                    rehypePlugins={[rehypeKatex]}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
                <div className={`text-[10px] mt-1 opacity-60 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-2">
              <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce [animation-delay:0.2s]" />
              <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t bg-white">
        {selectedImage && (
          <div className="mb-2 relative inline-block">
            <img src={selectedImage} alt="Preview" className="h-20 w-20 object-cover rounded-lg border" />
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md"
            >
              <X size={12} />
            </button>
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
          >
            <Paperclip size={22} />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            accept="image/*" 
            className="hidden" 
          />
          
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Nhập bài toán của em..."
              className="w-full p-3 pr-12 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-all"
            />
            <button
              onClick={() => handleSend()}
              disabled={isLoading || (!input.trim() && !selectedImage)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-red-500 text-white rounded-full disabled:opacity-50 disabled:bg-gray-300 transition-all hover:bg-red-600 active:scale-90"
            >
              <Send size={18} />
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 mt-4 justify-center">
          <ActionButton icon={<Plus size={16} />} label="[+]" onClick={() => setIsPlusMenuOpen(true)} />
          <ActionButton icon={<MessageSquareText size={16} />} label="Giải thích thêm" onClick={() => setInput("Hãy giải thích thêm cho mình chỗ này nhé")} />
          <ActionButton icon={<AlertTriangle size={16} />} label="Báo lỗi" onClick={() => setInput("Mình thấy có lỗi ở đây, hãy xem lại nhé")} />
          <ActionButton icon={<UserRound size={16} />} label="Nhờ thầy cô" onClick={handleTeacherRequest} />
        </div>
      </div>

      <PlusMenu 
        isOpen={isPlusMenuOpen} 
        onClose={() => setIsPlusMenuOpen(false)} 
        stats={stats}
        messages={messages}
        studentName={auth.currentUser?.displayName || "Học sinh"}
        onClearHistory={onNewChat}
      />
    </div>
  );
}

function ActionButton({ icon, label, onClick }: { icon: any, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium hover:bg-red-50 hover:text-red-500 transition-all active:scale-95 border border-gray-200"
    >
      {icon}
      {label}
    </button>
  );
}
