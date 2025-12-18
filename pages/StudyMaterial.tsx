
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { geminiService } from '../services/geminiService';
import { dbService } from '../services/dbService';
import { StudySet, Confidence } from '../types';
import { 
  FileText, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Trash2,
  ExternalLink,
  Zap,
  Download,
  CloudCheck
} from 'lucide-react';

export default function StudyMaterial() {
  const [topic, setTopic] = useState('');
  const [rawText, setRawText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sets, setSets] = useState<StudySet[]>([]);
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
      const generated = await geminiService.generateStudyContent(topic, rawText);
      const newSet: StudySet = {
        id: crypto.randomUUID(),
        title: generated.title || topic,
        topic: generated.topic || topic,
        flashcards: generated.flashcards.map((f: any) => ({
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

  return (
    <div className="space-y-10 max-w-4xl mx-auto pb-12">
      <header>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Discovery Library</h1>
        <p className="text-slate-500 mt-1 font-medium">Build your verified knowledge base with AI assistance.</p>
      </header>

      {/* Input Section */}
      <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
        <div className="flex items-center space-x-3 text-indigo-600 mb-2">
          <div className="p-2.5 bg-indigo-50 rounded-xl">
             <FileText size={22} />
          </div>
          <h2 className="font-bold text-xl">Material Ingestion</h2>
        </div>

        <div className="space-y-4">
          <input 
            type="text" 
            className="w-full px-6 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium text-slate-800"
            placeholder="Topic name (e.g. Cognitive Psychology)"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
          <textarea 
            className="w-full px-6 py-4 rounded-2xl border border-slate-200 h-56 focus:ring-2 focus:ring-indigo-500 outline-none resize-none font-medium text-slate-800 leading-relaxed"
            placeholder="Paste notes or text to analyze..."
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
          />
        </div>

        {status && (
          <div className={`p-4 rounded-2xl flex items-center space-x-3 ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
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
          <span>{loading ? 'Processing Insights...' : 'Create Study Set'}</span>
        </button>
      </section>

      {/* List */}
      <section className="space-y-6">
        <div className="flex justify-between items-center px-2">
          <h2 className="text-2xl font-bold text-slate-900">Your Discovery Piles</h2>
          <div className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full uppercase tracking-widest">
            {sets.length} Collections
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sets.map((set) => (
            <div key={set.id} className="bg-white p-8 rounded-[2rem] border border-slate-100 flex flex-col justify-between group shadow-sm hover:shadow-md transition-shadow">
              <div>
                <div className="flex justify-between items-start mb-6">
                  <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold uppercase tracking-widest">
                    {set.topic}
                  </span>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => toggleOffline(set.id)}
                      className={`p-2.5 rounded-xl transition-all ${set.isOffline ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400 hover:text-indigo-600'}`}
                      title={set.isOffline ? 'Available Offline' : 'Make Offline'}
                    >
                      {set.isOffline ? <CloudCheck size={20} /> : <Download size={20} />}
                    </button>
                    <button className="p-2.5 bg-slate-50 rounded-xl text-slate-300 hover:text-rose-500 transition-colors">
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2 leading-tight">{set.title}</h3>
                <p className="text-sm font-medium text-slate-400 mb-8">
                  {set.flashcards.length} Discoveries • {set.concepts.length} Core Concepts
                </p>
              </div>
              <div className="flex space-x-3">
                <button className="flex-1 bg-slate-50 text-slate-700 font-bold py-3.5 rounded-2xl hover:bg-slate-100 transition-colors flex items-center justify-center space-x-2 border border-slate-100">
                  <ExternalLink size={18} />
                  <span>Explore</span>
                </button>
                <Link to={`/review?id=${set.id}`} className="flex-1 bg-indigo-600 text-white font-bold py-3.5 rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 text-center">
                  Review
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}