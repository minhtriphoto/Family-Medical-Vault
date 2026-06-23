import React, { useState, useEffect, useRef } from 'react';
import { UserSession, ScreeningMessage, ScreeningSession, FamilyMember } from '../types';
import { getScreenings, saveScreening, getMembers } from '../lib/db';
import { Brain, Send, User, ChevronLeft, CalendarPlus, Paperclip, AlertTriangle, FileText, Loader2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';

interface AIScreeningViewProps {
  session: UserSession;
}

export default function AIScreeningView({ session }: AIScreeningViewProps) {
  const [history, setHistory] = useState<ScreeningSession[]>(() => getScreenings(session.familyId));
  const [activeSession, setActiveSession] = useState<ScreeningSession | null>(null);
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [members] = useState<FamilyMember[]>(() => getMembers(session.familyId));
  const [selectedMember, setSelectedMember] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages, isLoading]);

  const startNewSession = () => {
    setActiveSession({
      id: "ai-" + Date.now().toString(),
      familyId: session.familyId,
      date: new Date().toISOString(),
      memberId: selectedMember || undefined,
      messages: [{
        role: 'ai',
        text: 'Xin chào! Tôi là trợ lý AI Sàng Lọc Sức Khỏe. Bạn hoặc người thân trong gia đình đang có triệu chứng gì? Vui lòng mô tả chi tiết (ví dụ: đau đầu, sốt, đau bụng ở vị trí nào...).',
        timestamp: new Date().toISOString()
      }],
      status: 'active'
    });
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !activeSession || isLoading) return;

    const userMsg: ScreeningMessage = {
      role: 'user',
      text: input,
      timestamp: new Date().toISOString()
    };

    const newMessages = [...activeSession.messages, userMsg];
    setActiveSession(prev => prev ? { ...prev, messages: newMessages } : null);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/screen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: input,
          history: newMessages.slice(0, -1) // optionally pass if the AI prompts require everything at once
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Lỗi kết nối hoặc xử lý thông tin y tá AI.');
      }

      const data = await response.json();
      
      const aiMsg: ScreeningMessage = {
        role: 'ai',
        text: data.text,
        timestamp: new Date().toISOString()
      };

      setActiveSession(prev => {
        if (!prev) return prev;
        const updated = {
          ...prev,
          messages: [...prev.messages, aiMsg]
        };
        saveScreening(session.familyId, updated, session);
        return updated;
      });
      
      // Update history list in background
      setHistory(getScreenings(session.familyId));

    } catch (error: any) {
      console.error("AI chat error:", error);
      const aiErrorMsg: ScreeningMessage = {
        role: 'ai',
        text: `⚠️ **Thông báo hệ thống:** ${error.message || 'Hệ thống sàng lọc AI bận đột xuất.'}\n\n*Lời khuyên: Bạn có thể sao chép lại tin nhắn cũ và thử gửi lại sau 15-30 giây.*`,
        timestamp: new Date().toISOString()
      };
      
      setActiveSession(prev => {
        if (!prev) return null;
        return {
          ...prev,
          messages: [...prev.messages, aiErrorMsg]
        };
      });
    } finally {
      setIsLoading(false);
    }
  };

  const endSession = () => {
    if (!activeSession) return;
    const finalSession = { ...activeSession, status: 'completed' as const };
    saveScreening(session.familyId, finalSession, session);
    setActiveSession(null);
    setHistory(getScreenings(session.familyId));
  };

  if (!activeSession) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="absolute -right-10 -top-10 text-white/10">
            <Brain className="w-48 h-48" />
          </div>
          <div className="relative z-10 flex gap-4 mt-2">
            <div className="bg-white/20 p-4 rounded-full self-start backdrop-blur-sm">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-sans tracking-tight mb-2">AI Sàng Lọc Sức Khỏe</h1>
              <p className="text-indigo-100 text-sm max-w-xl font-medium leading-relaxed">
                Trợ lý AI giúp bạn sơ bộ đánh giá triệu chứng, gợi ý chuyên khoa thăm khám và lập báo cáo để gửi bác sĩ. Nhập thông tin triệu chứng để được phân loại mức độ khẩn cấp.
              </p>

              <div className="mt-8">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex flex-col gap-1 w-full max-w-xs">
                    <label className="text-xs font-semibold text-indigo-200">Đang kiểm tra cho ai?</label>
                    <select
                      value={selectedMember}
                      onChange={(e) => setSelectedMember(e.target.value)}
                      className="bg-white/10 border border-white/20 text-white rounded-xl px-4 py-2.5 outline-none focus:bg-white focus:text-indigo-900 transition-colors cursor-pointer text-sm font-medium"
                    >
                      <option value="" className="text-black">Bản thân (Tôi)</option>
                      {members.map(m => (
                        <option key={m.id} value={m.id} className="text-black">{m.name} ({m.relationship})</option>
                      ))}
                    </select>
                  </div>
                  
                  <button
                    onClick={startNewSession}
                    className="mt-4 sm:mt-5 bg-white text-indigo-600 hover:bg-slate-50 px-6 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    Bắt đầu phiên khám mới
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 flex flex-col gap-6">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <HistoryIcon className="w-5 h-5 text-indigo-500" />
            Lịch sử các phiên sàng lọc
          </h2>
          
          {history.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {history.map(s => (
                <div 
                  key={s.id} 
                  onClick={() => setActiveSession(s)}
                  className="p-4 border border-slate-100 dark:border-slate-800 rounded-xl hover:border-indigo-300 dark:hover:border-indigo-900 hover:shadow-md cursor-pointer transition-all bg-slate-50/50 dark:bg-slate-800/50 flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                      <CalendarPlus className="w-3.5 h-3.5" />
                      {new Date(s.date).toLocaleDateString('vi-VN')}
                    </div>
                    {s.memberId && (
                      <span className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                        {members.find(m => m.id === s.memberId)?.name || 'Thành viên'}
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed">
                    "{s.messages.find(m => m.role === 'user')?.text || 'Phiên chưa có lịch sử'}"
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <FileText className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-3" />
              <div className="text-sm font-medium text-slate-500">Chưa có phiên sàng lọc AI nào</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-10rem)] bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col overflow-hidden relative">
      {/* Disclaimer header */}
      <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-100 dark:border-amber-900/50 p-2 text-[11px] sm:text-xs text-amber-800 dark:text-amber-500 font-medium flex items-center justify-center gap-1.5 text-center px-4">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        <span>Thông tin chỉ mang tính tham khảo, hoàn toàn không thay thế tư vấn, chẩn đoán hay định hướng điều trị của bác sĩ chuyên khoa.</span>
      </div>

      <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setActiveSession(null)}
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-500 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Brain className="w-4 h-4" />
            </div>
             <div>
                <div className="text-sm font-bold text-slate-800 dark:text-slate-100">Phiên tư vấn AI</div>
                <div className="text-[10px] text-slate-500">
                  {members.find(m => m.id === activeSession.memberId)?.name || 'Bản thân'}
                </div>
             </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {activeSession.status === 'active' && (
            <button 
              onClick={endSession}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            >
              Kết thúc phiên
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        <AnimatePresence initial={false}>
          {activeSession.messages.map((msg, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col max-w-[85%] sm:max-w-xl gap-1 ${msg.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
            >
              <div 
                className={`p-3 sm:p-4 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-br-sm' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-sm'
                }`}
              >
                {msg.role === 'user' ? (
                   <div>{msg.text}</div>
                ) : (
                  <div className="markdown-body prose prose-sm dark:prose-invert max-w-none text-sm break-words leading-relaxed space-y-3 prose-p:my-1 prose-ul:my-1 prose-strong:font-bold prose-headings:text-indigo-800 dark:prose-headings:text-indigo-400">
                    <Markdown>{msg.text}</Markdown>
                  </div>
                )}
              </div>
              <div className="text-[10px] text-slate-400 font-medium px-1 flex items-center gap-1">
                {msg.role === 'ai' && <Brain className="w-3 h-3" />}
                {msg.role === 'user' && <User className="w-3 h-3" />}
                {new Date(msg.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute:'2-digit' })}
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mr-auto items-start flex gap-2"
            >
               <div className="px-5 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 rounded-bl-sm flex items-center justify-center">
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-3">
        {activeSession.status === 'completed' && (
          <div className="w-full text-center">
            <div className="inline-flex flex-col sm:flex-row gap-3">
              <button className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-bold px-5 py-2.5 rounded-xl text-sm border border-indigo-200 dark:border-indigo-800/50 flex items-center justify-center gap-2 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition">
                <CalendarPlus className="w-4 h-4" /> Đặt lịch khám
              </button>
              <button className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold px-5 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                <Paperclip className="w-4 h-4" /> Đính kèm kết quả XN liên quan
              </button>
            </div>
            <p className="text-[10px] text-slate-500 mt-3 font-medium">Phiên sàng lọc đã kết thúc.</p>
          </div>
        )}
        
        {activeSession.status === 'active' && (
          <div className="flex flex-col gap-2 relative">
             <div className="absolute left-3 top-3.5 text-slate-400 hover:text-indigo-500 cursor-pointer transition-colors" title="Đính kèm kết quả xét nghiệm liên quan">
                <Paperclip className="w-5 h-5" />
             </div>
             <input 
               type="text"
               value={input}
               onChange={(e) => setInput(e.target.value)}
               onKeyDown={(e) => {
                 if (e.key === 'Enter') handleSendMessage();
               }}
               placeholder="Mô tả triệu chứng hoặc trả lời câu hỏi của AI..."
               className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-2xl px-11 pr-14 py-3.5 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium"
               disabled={isLoading}
             />
             <button
               onClick={handleSendMessage}
               disabled={!input.trim() || isLoading}
               className="absolute right-3 top-2.5 p-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-xl transition-colors"
             >
               {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
             </button>
          </div>
        )}
      </div>
    </div>
  );
}

function HistoryIcon(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>;
}
