
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { geminiService } from '../services/geminiService';
import { dbService } from '../services/dbService';
import { ChatMessage, StudySet } from '../types';
import { useSettings } from '../App';
import { 
  Send, 
  Bot, 
  User, 
  ArrowLeft,
  Lightbulb,
  Sparkles,
  Info,
  Volume2
} from 'lucide-react';

export default function Tutor() {
  const { settings } = useSettings();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedSet, setSelectedSet] = useState<StudySet | null>(null);
  const [sets, setSets] = useState<StudySet[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSpeech = useCallback((text: string) => {
    if (!settings.textToSpeech) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = settings.ttsSpeed;
    window.speechSynthesis.speak(utterance);
  }, [settings.textToSpeech, settings.ttsSpeed]);

  useEffect(() => {
    dbService.getStudySets().then(setSets);
    const welcome = "Hello! I'm your AISA Socratic Tutor. Which topic would you like to explore today? I'll help you discover the answers through guided questioning.";
    setMessages([{
      role: 'model',
      content: welcome,
      timestamp: Date.now()
    }]);
    
    // Auto-read welcome if enabled
    if (settings.textToSpeech) {
      handleSpeech(welcome);
    }
  }, [settings.textToSpeech, handleSpeech]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));
      history.push({ role: 'user', parts: [{ text: input }] });

      const context = selectedSet 
        ? `Study Set Topic: ${selectedSet.topic}. Concepts: ${selectedSet.concepts.map(c => c.name).join(', ')}`
        : "General knowledge exploration mode.";

      const reply = await geminiService.getSocraticTutorResponse(history, context);
      
      const botMsg: ChatMessage = {
        role: 'model',
        content: reply,
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, botMsg]);
      
      // Auto-read response if enabled
      if (settings.textToSpeech) {
        handleSpeech(botMsg.content);
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'system',
        content: "Sorry, I lost connection to the educational network. Please try again later.",
        timestamp: Date.now()
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-10rem)] flex flex-col space-y-4">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <Sparkles className="text-indigo-600" />
            <span>Socratic Mentor</span>
          </h1>
          <p className="text-sm text-slate-500">I guide you to answers, I don't just give them.</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select 
            className="bg-white border border-slate-200 px-3 py-2 rounded-xl text-sm font-medium outline-none"
            onChange={(e) => {
              const set = sets.find(s => s.id === e.target.value);
              setSelectedSet(set || null);
            }}
          >
            <option value="">General Exploration</option>
            {sets.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
          </select>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 bg-white border border-slate-200 rounded-3xl overflow-hidden flex flex-col shadow-sm">
        <div className="flex-1 p-6 overflow-y-auto space-y-6 scroll-smooth" ref={scrollRef}>
          {messages.map((m, idx) => (
            <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex max-w-[80%] space-x-3 ${m.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  m.role === 'user' ? 'bg-indigo-600 text-white' : 
                  m.role === 'system' ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-600'
                }`}>
                  {m.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className={`relative p-4 rounded-2xl text-sm leading-relaxed group ${
                  m.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : m.role === 'system'
                    ? 'bg-rose-50 text-rose-700 border border-rose-100'
                    : 'bg-slate-50 text-slate-800 border border-slate-100 rounded-tl-none'
                }`}>
                  {m.content}
                  
                  {m.role === 'model' && (
                    <button 
                      onClick={() => handleSpeech(m.content)}
                      className="absolute -right-10 top-2 p-1.5 text-slate-300 hover:text-indigo-600 transition-colors bg-white border border-slate-100 rounded-lg opacity-0 group-hover:opacity-100 focus:opacity-100"
                      title="Speak message"
                    >
                      <Volume2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="flex space-x-3 items-center">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                  <Bot size={16} className="text-slate-400" />
                </div>
                <div className="flex space-x-1">
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-75" />
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-150" />
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-225" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="p-6 border-t border-slate-100">
          <div className="relative">
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask a question about your study material..."
              className="w-full bg-slate-50 border border-slate-200 pl-4 pr-12 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="absolute right-2 top-2 p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all"
            >
              <Send size={20} />
            </button>
          </div>
          <div className="mt-3 flex items-center space-x-4 text-xs font-medium text-slate-400">
            <span className="flex items-center space-x-1">
              <Lightbulb size={12} className="text-amber-500" />
              <span>Hint: Try "Explain this to me like I'm 10"</span>
            </span>
            <span className="flex items-center space-x-1">
              <Info size={12} />
              <span>Socratic Mode Active</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
