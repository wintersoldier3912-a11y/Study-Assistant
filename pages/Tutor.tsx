
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
  Volume2,
  Clock,
  Zap
} from 'lucide-react';

export default function Tutor() {
  const { settings } = useSettings();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hintLoading, setHintLoading] = useState(false);
  const [selectedSet, setSelectedSet] = useState<StudySet | null>(null);
  const [sets, setSets] = useState<StudySet[]>([]);
  const [secondsSpent, setSecondsSpent] = useState(0);
  
  const startTimeRef = useRef<number>(Date.now());
  const scrollRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    
    if (settings.textToSpeech) {
      handleSpeech(welcome);
    }

    // High-precision tracking
    timerRef.current = setInterval(() => {
      setSecondsSpent(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        saveTutorTime();
      }
    };
  }, [settings.textToSpeech, handleSpeech]);

  const saveTutorTime = async () => {
    const finalSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
    if (finalSeconds > 0) {
      const p = await dbService.getProgress();
      await dbService.updateProgress({ totalStudyTime: p.totalStudyTime + finalSeconds });
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const getChatHistory = () => messages.map(m => ({
    role: m.role,
    parts: [{ text: m.content }]
  }));

  const getContext = () => selectedSet 
    ? `Study Set Topic: ${selectedSet.topic}. Category: ${selectedSet.category}. Concepts: ${selectedSet.concepts.map(c => c.name).join(', ')}`
    : "General knowledge exploration mode.";

  const handleSend = async () => {
    if (!input.trim() || loading || hintLoading) return;

    const userMsg: ChatMessage = { role: 'user', content: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = getChatHistory();
      history.push({ role: 'user', parts: [{ text: input }] });

      const reply = await geminiService.getSocraticTutorResponse(history, getContext());
      
      const botMsg: ChatMessage = {
        role: 'model',
        content: reply,
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, botMsg]);
      
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

  const handleGetHint = async () => {
    if (loading || hintLoading) return;
    setHintLoading(true);

    try {
      const history = getChatHistory();
      const reply = await geminiService.getSocraticHint(history, getContext());
      
      const botMsg: ChatMessage = {
        role: 'model',
        content: reply,
        timestamp: Date.now(),
        isSocraticHint: true
      };
      
      setMessages(prev => [...prev, botMsg]);
      
      if (settings.textToSpeech) {
        handleSpeech(botMsg.content);
      }
    } catch (error) {
      console.error("Hint error:", error);
    } finally {
      setHintLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-10rem)] flex flex-col space-y-4">
      <header className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
              <Sparkles className="text-indigo-600" />
              <span>Socratic Mentor</span>
            </h1>
            <p className="text-sm text-slate-500">I guide you to answers, I don't just give them.</p>
          </div>
          <div className="flex items-center space-x-2 bg-slate-100 px-3 py-1 rounded-full text-slate-600 font-mono font-bold text-sm">
            <Clock size={14} className="text-indigo-500" />
            <span>{formatTime(secondsSpent)}</span>
          </div>
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
                  m.role === 'system' ? 'bg-rose-100 text-rose-600' : 
                  m.isSocraticHint ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'
                }`}>
                  {m.role === 'user' ? <User size={16} /> : (m.isSocraticHint ? <Lightbulb size={16} /> : <Bot size={16} />)}
                </div>
                <div className={`relative p-4 rounded-2xl text-sm leading-relaxed group ${
                  m.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : m.role === 'system'
                    ? 'bg-rose-50 text-rose-700 border border-rose-100'
                    : m.isSocraticHint
                    ? 'bg-amber-50 text-amber-900 border border-amber-200 rounded-tl-none italic'
                    : 'bg-slate-50 text-slate-800 border border-slate-100 rounded-tl-none'
                }`}>
                  {m.isSocraticHint && <div className="text-[10px] font-black uppercase tracking-widest mb-1 text-amber-600">Probing Hint</div>}
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
          {(loading || hintLoading) && (
            <div className="flex justify-start">
              <div className="flex space-x-3 items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${hintLoading ? 'bg-amber-100' : 'bg-slate-100'}`}>
                  {hintLoading ? <Lightbulb size={16} className="text-amber-400" /> : <Bot size={16} className="text-slate-400" />}
                </div>
                <div className="flex space-x-1">
                  <div className={`w-1.5 h-1.5 rounded-full animate-bounce delay-75 ${hintLoading ? 'bg-amber-400' : 'bg-indigo-400'}`} />
                  <div className={`w-1.5 h-1.5 rounded-full animate-bounce delay-150 ${hintLoading ? 'bg-amber-400' : 'bg-indigo-400'}`} />
                  <div className={`w-1.5 h-1.5 rounded-full animate-bounce delay-225 ${hintLoading ? 'bg-amber-400' : 'bg-indigo-400'}`} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/30">
          <div className="flex items-center space-x-3">
            <button 
              onClick={handleGetHint}
              disabled={loading || hintLoading}
              className={`p-4 rounded-2xl flex items-center justify-center transition-all ${
                hintLoading 
                ? 'bg-amber-100 text-amber-400' 
                : 'bg-white text-amber-500 border border-amber-100 hover:bg-amber-50 hover:shadow-md'
              }`}
              title="Get a Socratic hint"
            >
              <Lightbulb size={24} className={hintLoading ? 'animate-pulse' : ''} />
            </button>
            <div className="relative flex-1">
              <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask a question about your study material..."
                className="w-full bg-white border border-slate-200 pl-4 pr-12 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-800"
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || loading || hintLoading}
                className="absolute right-2 top-2 p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-100"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
          <div className="mt-4 flex items-center space-x-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <span className="flex items-center space-x-1.5">
              <Zap size={12} className="text-indigo-500" />
              <span>Socratic Method</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <Lightbulb size={12} className="text-amber-500" />
              <span>Hint button for stuck moments</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <Info size={12} />
              <span>Verifiable Content Only</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
