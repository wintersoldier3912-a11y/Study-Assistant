
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { dbService } from '../services/dbService';
import { StudySet, Flashcard } from '../types';
import { useSettings } from '../App';
import { 
  ArrowLeft, 
  RotateCcw, 
  CheckCircle, 
  Eye,
  Brain,
  Award,
  Volume2,
  Heart,
  Zap,
  Clock
} from 'lucide-react';

export default function ReviewSession() {
  const { settings } = useSettings();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const setId = query.get('id');

  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [finished, setFinished] = useState(false);
  const [secondsSpent, setSecondsSpent] = useState(0);
  
  // Fix: Use ReturnType<typeof setInterval> instead of NodeJS.Timeout to avoid namespace errors in browser environments
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadCards();
    
    // Start real-time tracking
    timerRef.current = setInterval(() => {
      setSecondsSpent(prev => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        // Persist even on partial exit
        savePartialStudyTime();
      }
    };
  }, [setId]);

  const loadCards = async () => {
    const sets = await dbService.getStudySets();
    let cardsToReview: Flashcard[] = [];
    
    if (setId) {
      const set = sets.find(s => s.id === setId);
      if (set) cardsToReview = set.flashcards;
    } else {
      cardsToReview = sets.flatMap(s => s.flashcards).filter(c => c.nextReviewDate <= Date.now());
    }
    
    setCards(cardsToReview.sort(() => Math.random() - 0.5));
  };

  const savePartialStudyTime = async () => {
    // We get secondsSpent from state which might be slightly behind during unmount, 
    // but close enough for accuracy.
    const p = await dbService.getProgress();
    // Using a ref or capturing a value is usually safer but here state is updated every 1s
    setSecondsSpent(current => {
       if (current > 0) {
         dbService.updateProgress({ totalStudyTime: p.totalStudyTime + current });
       }
       return 0; // Reset for logic
    });
  };

  const handleSpeech = useCallback((text: string) => {
    if (!settings.textToSpeech) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = settings.ttsSpeed;
    window.speechSynthesis.speak(utterance);
  }, [settings.textToSpeech, settings.ttsSpeed]);

  useEffect(() => {
    if (cards[currentIdx]) {
      handleSpeech(cards[currentIdx].question);
    }
  }, [currentIdx, cards, handleSpeech]);

  const handleScore = async (score: number) => {
    const currentCard = cards[currentIdx];
    let { repetition, interval, easeFactor } = currentCard;

    if (score >= 3) {
      if (repetition === 0) interval = 1;
      else if (repetition === 1) interval = 6;
      else interval = Math.round(interval * easeFactor);
      repetition += 1;
    } else {
      repetition = 0;
      interval = 1;
    }

    easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - score) * (0.08 + (5 - score) * 0.02)));

    const updatedCard = {
      ...currentCard,
      repetition,
      interval,
      easeFactor,
      nextReviewDate: Date.now() + interval * 24 * 60 * 60 * 1000
    };

    const sets = await dbService.getStudySets();
    const updatedSets = sets.map(s => ({
      ...s,
      flashcards: s.flashcards.map(f => f.id === updatedCard.id ? updatedCard : f)
    }));
    
    localStorage.setItem('aisa_study_sets', JSON.stringify(updatedSets));

    if (currentIdx + 1 < cards.length) {
      setCurrentIdx(currentIdx + 1);
      setShowAnswer(false);
    } else {
      setFinished(true);
      if (timerRef.current) clearInterval(timerRef.current);
      
      const p = await dbService.getProgress();
      await dbService.updateProgress({ 
        masteredConcepts: p.masteredConcepts + 1,
        totalStudyTime: p.totalStudyTime + secondsSpent,
        xp: p.xp + (cards.length * 10)
      });
      // Zero out local secondsSpent so unmount doesn't double-save
      setSecondsSpent(0);
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (cards.length === 0 && !finished) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center">
        <div className="p-8 bg-emerald-50 text-emerald-600 rounded-full mb-8 animate-float">
          <CheckCircle size={64} />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">You're Ahead of Schedule!</h2>
        <p className="text-slate-500 mt-2 max-w-sm">No pending reviews. Why not explore a new topic in the Library?</p>
        <Link to="/materials" className="mt-10 bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all">
          Explore Library
        </Link>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="max-w-md mx-auto text-center space-y-8 animate-in zoom-in duration-500 py-12">
        <div className="p-10 bg-white rounded-[3rem] border border-slate-100 shadow-2xl relative">
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center shadow-lg">
            <Award size={40} />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mt-6">Amazing Effort!</h2>
          <p className="text-slate-500 mt-2">Every card reviewed is a step toward mastery.</p>
          
          <div className="mt-10 grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
              <div className="text-3xl font-bold text-indigo-600">+{cards.length * 10}</div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">XP Points</div>
            </div>
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
              <div className="text-3xl font-bold text-emerald-600">{formatTime(secondsSpent)}</div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Focus Time</div>
            </div>
          </div>
        </div>
        <Link to="/" className="block w-full bg-indigo-600 text-white py-5 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 text-center">
          Finish Session
        </Link>
      </div>
    );
  }

  const currentCard = cards[currentIdx];

  return (
    <div className="max-w-3xl mx-auto space-y-8 h-[calc(100vh-12rem)] flex flex-col">
      <header className="flex justify-between items-center">
        <div className="flex items-center space-x-6">
          <Link to="/" className="flex items-center space-x-2 text-slate-500 hover:text-slate-900 transition-colors font-bold">
            <ArrowLeft size={18} />
            <span>Exit</span>
          </Link>
          <div className="flex items-center space-x-2 bg-slate-100 px-3 py-1 rounded-full text-slate-600 font-mono font-bold text-sm">
            <Clock size={14} className="text-indigo-500" />
            <span>{formatTime(secondsSpent)}</span>
          </div>
        </div>
        
        {!settings.lowPressureMode && (
          <div className="flex items-center space-x-6">
            <div className="flex flex-col items-end">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Progress</div>
              <div className="text-sm font-bold text-indigo-600">{currentIdx + 1} / {cards.length}</div>
            </div>
            <div className="w-32 h-2.5 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-600 transition-all duration-300" 
                style={{ width: `${((currentIdx + 1) / cards.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {settings.lowPressureMode && (
          <div className="flex items-center space-x-2 text-emerald-600 font-bold">
             <Heart size={18} />
             <span>Doing great!</span>
          </div>
        )}
      </header>

      {/* Card Container */}
      <div className="flex-1 flex flex-col">
        <div className={`flex-1 bg-white border-2 border-slate-100 rounded-[3rem] p-12 shadow-sm flex flex-col items-center justify-center text-center space-y-8 relative overflow-hidden transition-all duration-500 ${showAnswer ? 'bg-indigo-50/30' : ''}`}>
          
          <div className="absolute top-10 left-10 flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <Brain size={20} className="text-indigo-400" />
            <span>Active Discovery</span>
          </div>

          <button 
            onClick={() => handleSpeech(showAnswer ? currentCard.answer : currentCard.question)}
            className="absolute top-10 right-10 p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-indigo-600 transition-colors"
          >
            <Volume2 size={24} />
          </button>

          <div className="max-w-xl space-y-8">
            <h3 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight">
              {currentCard.question}
            </h3>
            
            {showAnswer && (
              <div className="animate-in fade-in slide-in-from-bottom-6 duration-500">
                <div className="h-px bg-slate-200 w-2/3 mx-auto mb-10" />
                <p className="text-2xl text-slate-800 font-medium leading-relaxed">
                  {currentCard.answer}
                </p>
              </div>
            )}
          </div>

          {!showAnswer && (
            <button 
              onClick={() => {
                setShowAnswer(true);
                handleSpeech(currentCard.answer);
              }}
              className="mt-12 bg-indigo-600 text-white px-10 py-5 rounded-[2rem] font-bold text-xl hover:bg-indigo-700 transition-all flex items-center space-x-3 shadow-2xl shadow-indigo-100 group"
            >
              <Eye size={24} className="group-hover:scale-110 transition-transform" />
              <span>Reveal Discovery</span>
            </button>
          )}
        </div>

        {showAnswer && (
          <div className="mt-10 flex space-x-5 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <button 
              onClick={() => handleScore(1)}
              className="flex-1 group bg-white border border-slate-200 p-6 rounded-[2rem] hover:border-rose-200 transition-all flex flex-col items-center"
            >
              <div className="p-4 bg-rose-50 text-rose-500 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                <RotateCcw size={28} />
              </div>
              <span className="font-bold text-slate-900">Still Learning</span>
            </button>
            <button 
              onClick={() => handleScore(3)}
              className="flex-1 group bg-white border border-slate-200 p-6 rounded-[2rem] hover:border-amber-200 transition-all flex flex-col items-center"
            >
              <div className="p-4 bg-amber-50 text-amber-500 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                <Zap size={28} />
              </div>
              <span className="font-bold text-slate-900">Coming Together</span>
            </button>
            <button 
              onClick={() => handleScore(5)}
              className="flex-1 group bg-indigo-600 p-6 rounded-[2rem] hover:bg-indigo-700 transition-all flex flex-col items-center shadow-xl shadow-indigo-100"
            >
              <div className="p-4 bg-white/20 text-white rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                <CheckCircle size={28} />
              </div>
              <span className="font-bold text-white">Mastered</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
