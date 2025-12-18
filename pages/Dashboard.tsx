
import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { UserProgress, StudySet } from '../types';
import { 
  TrendingUp, 
  CheckCircle2, 
  Calendar, 
  Clock,
  ArrowRight,
  Plus,
  BookOpen,
  Trophy,
  Flame,
  Star,
  Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';

const StatCard = ({ label, value, icon: Icon, color, extra }: any) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
    <div className={`absolute -right-4 -bottom-4 w-24 h-24 ${color} opacity-5 rounded-full group-hover:scale-125 transition-transform duration-500`} />
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-${color.split('-')[1]}-600`}>
        <Icon size={24} />
      </div>
      {extra && <div className="text-xs font-bold text-slate-400">{extra}</div>}
    </div>
    <div className="text-2xl font-bold text-slate-900">{value}</div>
    <div className="text-sm text-slate-500 font-medium">{label}</div>
  </div>
);

export default function Dashboard() {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [recentSets, setRecentSets] = useState<StudySet[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const p = await dbService.getProgress();
      const s = await dbService.getStudySets();
      setProgress(p);
      setRecentSets(s.slice(0, 3));
    };
    loadData();
  }, []);

  if (!progress) return <div className="p-8 text-center text-slate-400 animate-pulse">Initializing AISA intelligence...</div>;

  const formatStudyTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m`;
    return `${seconds}s`;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Hey Scholar! <span className="animate-bounce">👋</span>
          </h1>
          <p className="text-slate-500 mt-1">Ready for some productive discovery today?</p>
        </div>
        
        <div className="bg-white px-6 py-3 rounded-2xl border border-slate-100 flex items-center space-x-6 shadow-sm">
          <div className="flex items-center space-x-2">
            <Flame size={20} className="text-orange-500" />
            <span className="font-bold text-slate-900">{progress.streak} Day Streak</span>
          </div>
          <div className="h-8 w-px bg-slate-100" />
          <div className="flex items-center space-x-2">
            <Star size={20} className="text-amber-500" />
            <span className="font-bold text-slate-900">{progress.xp} XP Earned</span>
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Concepts Mastered" value={progress.masteredConcepts} icon={CheckCircle2} color="bg-emerald-500" extra="Keep it up!" />
        <StatCard label="Global Rank" value="#42" icon={Trophy} color="bg-indigo-500" extra="Top 5%" />
        <StatCard label="Study Time" value={formatStudyTime(progress.totalStudyTime)} icon={Clock} color="bg-amber-500" extra="Weekly Goal" />
        <StatCard label="Next Review" value="In 4 Hours" icon={Calendar} color="bg-blue-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-900">Your Study Piles</h2>
            <Link to="/materials" className="text-sm text-indigo-600 font-bold hover:underline">Manage Library</Link>
          </div>
          
          <div className="space-y-4">
            {recentSets.length > 0 ? recentSets.map((set) => (
              <div key={set.id} className="bg-white p-5 rounded-3xl border border-slate-100 flex items-center justify-between hover:border-indigo-200 transition-all group shadow-sm">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                    <BookOpen size={28} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">{set.title}</h3>
                    <div className="flex items-center space-x-3 text-xs text-slate-400 font-medium">
                       <span>{set.flashcards.length} Cards</span>
                       <span>•</span>
                       <span className={set.syncStatus === 'synced' ? 'text-emerald-500' : 'text-amber-500'}>
                         {set.syncStatus === 'synced' ? 'Synced' : 'Pending'}
                       </span>
                    </div>
                  </div>
                </div>
                <Link to={`/review?id=${set.id}`} className="p-3 rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <ArrowRight size={24} />
                </Link>
              </div>
            )) : (
              <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center">
                <p className="text-slate-500 font-medium mb-6">Your library is empty. Let's start a new journey!</p>
                <Link to="/materials" className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all inline-flex items-center gap-2">
                  <Plus size={20} />
                  New Module
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Growth Mindset Card */}
        <div className="space-y-6">
           <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
             <Star className="absolute -right-4 -top-4 w-24 h-24 text-white opacity-10 animate-pulse" />
             <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Trophy size={20} />
                Daily Challenge
             </h2>
             <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-6">
                <p className="text-indigo-50 font-medium leading-relaxed italic">
                  "Mistakes are simply proof that you're challenging yourself. Keep going, the breakthrough is near!"
                </p>
             </div>
             <button className="w-full bg-white text-indigo-600 py-4 rounded-xl font-bold hover:bg-opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg">
                <Zap size={20} />
                Power Session (+50 XP)
             </button>
           </div>
           
           {/* Quick Sync Action */}
           <div className="bg-white p-6 rounded-3xl border border-slate-100 flex items-center justify-between shadow-sm">
              <div className="flex items-center space-x-3">
                 <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                    <CheckCircle2 size={20} />
                 </div>
                 <div>
                    <div className="text-sm font-bold text-slate-900">Local Cache Ready</div>
                    <div className="text-xs text-slate-400">Ready for offline focus</div>
                 </div>
              </div>
              <button className="text-xs font-bold text-indigo-600 hover:underline">Sync Status</button>
           </div>
        </div>
      </div>
    </div>
  );
}
