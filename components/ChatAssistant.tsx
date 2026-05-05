
import React, { useState, useRef, useEffect } from 'react';
import { getPhotographyConsultation } from '../services/geminiService';
import { Message } from '../types';
import { translations, Language } from '../translations';

interface ChatAssistantProps {
  lang: Language;
  budget: number;
}

const ChatAssistant: React.FC<ChatAssistantProps> = ({ lang, budget }) => {
  const t = translations[lang].chat;
  
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: t.initial.replace('{budget}', budget.toString()) }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Re-initialize first message if language or budget changes
  // Only resets the whole chat if the user hasn't started a conversation yet
  // to avoid annoying resets during active chats, but keeps the greeting fresh.
  useEffect(() => {
    setMessages(prev => {
      if (prev.length <= 1) {
        return [{ role: 'model', text: t.initial.replace('{budget}', budget.toString()) }];
      }
      return prev;
    });
  }, [lang, budget, t.initial]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    const aiResponse = await getPhotographyConsultation(userMsg, budget, lang);
    
    setMessages(prev => [...prev, { role: 'model', text: aiResponse }]);
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden flex flex-col h-[500px] w-full">
      <div className="bg-primary p-4 text-white flex items-center space-x-3 overflow-hidden">
        <div className="w-8 h-8 rounded-full bg-accent flex-shrink-0 flex items-center justify-center text-xs font-bold">AI</div>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-sm leading-tight break-words pr-2">{t.title}</h3>
          <p className="text-[10px] text-gray-300 leading-tight truncate">{t.subtitle}</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] p-3 rounded-2xl text-sm ${
              m.role === 'user' 
                ? 'bg-accent text-white rounded-tr-none' 
                : 'bg-gray-100 text-gray-800 rounded-tl-none'
            }`}>
              {m.text.split('\n').map((line, j) => (
                <p key={j} className={line.startsWith('*') || line.startsWith('-') ? 'ml-4' : 'mb-2'}>
                  {line}
                </p>
              ))}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 p-3 rounded-2xl animate-pulse text-gray-400 text-xs">{t.thinking}</div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-100 flex space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={t.placeholder}
          className="flex-1 bg-gray-50 rounded-full px-4 py-2 text-sm min-w-0 focus:outline-none focus:ring-2 focus:ring-accent/50"
        />
        <button
          onClick={handleSend}
          disabled={loading}
          className="bg-primary text-white p-2 rounded-full hover:bg-gray-800 transition-colors disabled:opacity-50 flex-shrink-0"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ChatAssistant;
