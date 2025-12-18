
export enum Confidence {
  High = 'High',
  Medium = 'Medium',
  Low = 'Low'
}

export interface Source {
  uri: string;
  title: string;
}

export interface AccessibilitySettings {
  dyslexiaFont: boolean;
  highContrast: boolean;
  textToSpeech: boolean;
  ttsSpeed: number;
  adhdFocusMode: boolean; // 15 min cycles
  lowPressureMode: boolean; // hide progress/scores
  extendedTime: boolean;
  showBreakPrompts: boolean;
}

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  confidence: Confidence;
  sources: Source[];
  nextReviewDate: number; 
  interval: number;
  repetition: number;
  easeFactor: number;
}

export interface Concept {
  id: string;
  name: string;
  description: string;
  prerequisites: string[];
}

export type StudyCategory = 'Engineering' | 'Medical' | 'Geography' | 'Science' | 'Arts' | 'Other';

export interface StudySet {
  id: string;
  title: string;
  topic: string;
  category: StudyCategory;
  flashcards: Flashcard[];
  concepts: Concept[];
  createdAt: number;
  lastAccessed: number;
  isOffline: boolean; // pinned for offline use
  syncStatus: 'synced' | 'pending' | 'error';
}

export interface UserProgress {
  totalStudyTime: number; // Stored in seconds
  masteredConcepts: number;
  streak: number;
  xp: number;
  lastStudyDate: number;
  lastSyncTimestamp: number;
}

export interface ChatMessage {
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: number;
  isSocraticHint?: boolean;
}
