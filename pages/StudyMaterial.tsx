
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { geminiService } from '../services/geminiService';
import { dbService } from '../services/dbService';
import { StudySet, Confidence, StudyCategory } from '../types';
import { 
  FileText, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Trash2,
  ExternalLink,
  Zap,
  Download,
  CloudCheck,
  Cpu,
  Stethoscope,
  Globe2,
  FlaskConical,
  Palette,
  Layers,
  Search,
  Filter
} from 'lucide-react';

const CATEGORIES: { id: StudyCategory; label: string; icon: any; color: string }[] = [
  { id: 'Engineering', label: 'Engineering', icon: Cpu, color: 'text-blue-600 bg-blue-50' },
  { id: 'Medical', label: 'Medical', icon: Stethoscope, color: 'text-rose-600 bg-rose-50' },
  { id: 'Geography', label: 'Geography', icon: Globe2, color: 'text-emerald-600 bg-emerald-50' },
  { id: 'Science', label: 'Science', icon: FlaskConical, color: 'text-purple-600 bg-purple-50' },
  { id: 'Arts', label: 'Arts', icon: Palette, color: 'text-amber-600 bg-amber-50' },
  { id: 'Other', label: 'Other', icon: Layers, color: 'text-slate-600 bg-slate-50' },
];

export default function StudyMaterial() {
  const [topic, setTopic] = useState('');
  const [rawText, setRawText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<StudyCategory>('Other');
  const [loading, setLoading] = useState(false);
  const [sets, setSets] = useState<StudySet[]>([]);
  const [filterCategory, setFilterCategory] = useState<StudyCategory | 'All'>('All');
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  useEffect(() => {
    loadSets();
  }, []);

  const loadSets = async () => {
    const s = await dbService.getStudySets();
    setSets(s.sort((a, b) => b.createdAt - a.createdAt));
  };

  const handleGenerate = async () => {
    if (!topic || !rawText) return;
    setLoading(true);
    setStatus(null);
    try {
      const generated = await geminiService.generateStudyContent(topic, rawText, selectedCategory);
      const newSet: StudySet = {
        id: crypto.randomUUID(),
        title: generated.title || topic,
        topic: generated.topic || topic,
        category: selectedCategory,
        flashcards: (generated.flashcards || []).map((f: any) => ({
          ...f,
          nextReviewDate: Date.now(),
          interval: 0,
          repetition: 0,
          easeFactor: 2.5
        })),
        concepts: generated.concepts || [],
        createdAt: Date.now(),
        lastAccessed: Date.now(),
        isOffline: false,
        syncStatus: 'pending'
      };
      await dbService.saveStudySet(newSet);
      setSets([newSet, ...sets]);
      setTopic('');
      setRawText('');
      setSelectedCategory('Other');
      setStatus({ type: 'success', msg: 'Discovery set created and queued for sync!' });
    } catch (error) {
      console.error(error);
      setStatus({ type: 'error', msg: 'Failed to connect to the discovery network.' });
    } finally {
      setLoading(false);
    }
  };

  const toggleOffline = async (id: string) => {
    await dbService.toggleDownload(id);
    loadSets();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this pack?')) {
      const existing = await dbService.getStudySets();
      const updated = existing.filter(s => s.id !== id);
      localStorage.setItem('aisa_study_sets', JSON.stringify(updated));
      loadSets();
    }
  };

  const filteredSets = filterCategory === 'All' 
    ? sets 
    : sets.filter(s => s.category === filterCategory);

  const getCategoryDetails = (catId: string) => {
    return CATEGORIES.find(c => c.id === catId) || CATEGORIES[5];
  };

  return (
    <div className="space-y-10 max-w-5xl mx-auto pb-12">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Discovery Library</h1>
          <p className="text-slate-500 mt-1 font-medium">Build your verified knowledge base with AI assistance.</p>
        </div>
        <div className="hidden md:flex items-center space-x-2 bg-white border border-slate-200 px-4 py-2 rounded-2xl shadow-sm">
          <Search size={18} className="text-slate-400" />
          <input type="text" placeholder="Search library..." className="outline-none text-sm font-medium w-40" />
        </div>
      </header>

      {/* Input Section */}
      <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 text-indigo-600">
            <div className="p-2.5 bg-indigo-50 rounded-xl">
               <Zap size={22} />
            </div>
            <h2 className="font-bold text-xl">New Knowledge Pack</h2>
          </div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-full">
            AI-Powered Extraction
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <label className="block text-sm font-bold text-slate-700 ml-1">Topic Information</label>
            <input 
              type="text" 
              className="w-full px-6 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium text-slate-800"
              placeholder="Module Title (e.g. Quantum Mechanics)"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
            
            <div className="space-y-3">
              <label className="block text-sm font-bold text-slate-700 ml-1">Subject Category</label>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all ${
                      selectedCategory === cat.id 
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-600 shadow-sm' 
                        : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'
                    }`}
                  >
                    <cat.icon size={20} className="mb-1" />
                    <span className="text-[10px] font-bold uppercase tracking-tight">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4 flex flex-col">
            <label className="block text-sm font-bold text-slate-700 ml-1">Source Material</label>
            <textarea 
              className="flex-1 w-full px-6 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none resize-none font-medium text-slate-800 leading-relaxed min-h-[200px]"
              placeholder="Paste notes, textbook excerpts, or video transcripts here. The AI will extract core concepts and flashcards."
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
            />
          </div>
        </div>

        {status && (
          <div className={`p-4 rounded-2xl flex items-center space-x-3 animate-in fade-in slide-in-from-top-4 ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
            {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span className="text-sm font-bold">{status.msg}</span>
          </div>
        )}

        <button 
          onClick={handleGenerate}
          disabled={loading || !topic || !rawText}
          className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-bold text-lg flex items-center justify-center space-x-3 hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-xl shadow-indigo-100"
        >
          {loading ? <Loader2 className="animate-spin" /> : <Zap size={22} />}
          <span>{loading ? 'Analyzing Content...' : 'Build Discovery Set'}</span>
        </button>
      </section>

      {/* Categories & Filter */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
          <div className="flex items-center space-x-3">
             <Filter size={20} className="text-slate-400" />
             <h2 className="text-2xl font-bold text-slate-900">Your Knowledge Vault</h2>
          </div>
          
          <div className="flex items-center space-x-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            <button
              onClick={() => setFilterCategory('All')}
              className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                filterCategory === 'All' 
                  ? 'bg-slate-900 text-white shadow-lg' 
                  : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50'
              }`}
            >
              All Packs
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFilterCategory(cat.id)}
                className={`flex items-center space-x-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                  filterCategory === cat.id 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                    : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50'
                }`}
              >
                <cat.icon size={16} />
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
        
        {filteredSets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSets.map((set) => {
              const cat = getCategoryDetails(set.category);
              const Icon = cat.icon;
              return (
                <div key={set.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 flex flex-col justify-between group shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <div className={`p-3 rounded-2xl ${cat.color}`}>
                        <Icon size={24} />
                      </div>
                      <div className="flex space-x-1">
                        <button 
                          onClick={() => toggleOffline(set.id)}
                          className={`p-2 rounded-xl transition-all ${set.isOffline ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-300 hover:text-indigo-600'}`}
                          title={set.isOffline ? 'Available Offline' : 'Make Offline'}
                        >
                          {set.isOffline ? <CloudCheck size={18} /> : <Download size={18} />}
                        </button>
                        <button 
                          onClick={() => handleDelete(set.id)}
                          className="p-2 bg-slate-50 rounded-xl text-slate-300 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
                      {set.category}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2 leading-tight min-h-[3rem] line-clamp-2">
                      {set.title}
                    </h3>
                    <div className="flex items-center space-x-4 text-xs font-bold text-slate-400 mb-6">
                      <span className="flex items-center gap-1.5">
                        <Layers size={14} className="text-slate-300" />
                        {set.flashcards.length} Cards
                      </span>
                      <span className="flex items-center gap-1.5">
                        <CheckCircle size={14} className="text-slate-300" />
                        {set.concepts.length} Concepts
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-3 pt-4 border-t border-slate-50">
                    <Link to={`/review?id=${set.id}`} className="flex-1 bg-indigo-600 text-white font-bold py-3.5 rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 text-center text-sm">
                      Study
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-[3rem] p-20 text-center">
             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                <FileText size={40} />
             </div>
             <h3 className="text-xl font-bold text-slate-900 mb-2">No Study Packs Found</h3>
             <p className="text-slate-500 max-w-sm mx-auto">
               {filterCategory === 'All' 
                 ? "You haven't created any study packs yet. Start by uploading some notes above!"
                 : `You don't have any packs in the ${filterCategory} category yet.`}
             </p>
          </div>
        )}
      </section>
    </div>
  );
}
