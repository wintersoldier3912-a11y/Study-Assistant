
import React from 'react';
import { useSettings } from '../App';
import { 
  Type, 
  Contrast, 
  Volume2, 
  Zap, 
  Clock, 
  ShieldCheck,
  MousePointer2,
  Bell
} from 'lucide-react';

const Toggle = ({ active, onToggle }: { active: boolean, onToggle: () => void }) => (
  <button 
    onClick={onToggle}
    className={`w-14 h-8 rounded-full transition-all relative ${active ? 'bg-indigo-600' : 'bg-slate-200'}`}
  >
    <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${active ? 'translate-x-6' : 'translate-x-0'}`} />
  </button>
);

const SettingItem = ({ icon: Icon, label, description, active, onToggle }: any) => (
  <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-white shadow-sm">
    <div className="flex items-center space-x-4">
      <div className={`p-2.5 rounded-xl ${active ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400'}`}>
        <Icon size={22} />
      </div>
      <div>
        <div className="font-bold text-slate-900">{label}</div>
        <div className="text-xs text-slate-500">{description}</div>
      </div>
    </div>
    <Toggle active={active} onToggle={onToggle} />
  </div>
);

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings();

  return (
    <div className="max-w-3xl mx-auto space-y-10 pb-12">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">Accessibility & Neurodiversity</h1>
        <p className="text-slate-500 mt-1">Personalize AISA to match your unique learning style.</p>
      </header>

      {/* Visual Support */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
          <Type size={20} className="text-indigo-600" />
          <span>Visual Support</span>
        </h2>
        <div className="grid grid-cols-1 gap-4">
          <SettingItem 
            icon={Type} 
            label="Dyslexia-Friendly Font" 
            description="Use Lexend font designed for improved reading speed." 
            active={settings.dyslexiaFont}
            onToggle={() => updateSettings({ dyslexiaFont: !settings.dyslexiaFont })}
          />
          <SettingItem 
            icon={Contrast} 
            label="High Contrast Mode" 
            description="Increase contrast for better text clarity." 
            active={settings.highContrast}
            onToggle={() => updateSettings({ highContrast: !settings.highContrast })}
          />
        </div>
      </section>

      {/* Cognitive Support */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
          <Zap size={20} className="text-indigo-600" />
          <span>ADHD & Focus Support</span>
        </h2>
        <div className="grid grid-cols-1 gap-4">
          <SettingItem 
            icon={Clock} 
            label="Focus Cycles" 
            description="Automatic break prompts every 15 minutes." 
            active={settings.adhdFocusMode}
            onToggle={() => updateSettings({ adhdFocusMode: !settings.adhdFocusMode })}
          />
          <SettingItem 
            icon={Volume2} 
            label="Assistive Voice (TTS)" 
            description="Read study materials aloud automatically." 
            active={settings.textToSpeech}
            onToggle={() => updateSettings({ textToSpeech: !settings.textToSpeech })}
          />
          <div className="p-4 rounded-2xl border border-slate-100 bg-white flex flex-col space-y-3">
             <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-700">Reading Speed</span>
                <span className="text-xs font-bold bg-slate-100 px-2 py-1 rounded-md">{settings.ttsSpeed}x</span>
             </div>
             <input 
              type="range" min="0.5" max="2.0" step="0.1" 
              value={settings.ttsSpeed} 
              onChange={(e) => updateSettings({ ttsSpeed: parseFloat(e.target.value) })}
              className="w-full accent-indigo-600"
             />
          </div>
        </div>
      </section>

      {/* Emotional Support */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
          <ShieldCheck size={20} className="text-indigo-600" />
          <span>Anxiety & Processing Support</span>
        </h2>
        <div className="grid grid-cols-1 gap-4">
          <SettingItem 
            icon={MousePointer2} 
            label="Low Pressure Mode" 
            description="Hide timers and performance scores during study." 
            active={settings.lowPressureMode}
            onToggle={() => updateSettings({ lowPressureMode: !settings.lowPressureMode })}
          />
          <SettingItem 
            icon={Bell} 
            label="Growth Mindset Messaging" 
            description="Replace scores with effort-based celebrations." 
            active={settings.extendedTime}
            onToggle={() => updateSettings({ extendedTime: !settings.extendedTime })}
          />
        </div>
      </section>
    </div>
  );
}
