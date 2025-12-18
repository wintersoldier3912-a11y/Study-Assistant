
import { StudySet, UserProgress } from '../types';

const STORAGE_KEY_SETS = 'aisa_study_sets';
const STORAGE_KEY_PROGRESS = 'aisa_user_progress';

export const dbService = {
  async saveStudySet(set: StudySet): Promise<void> {
    const existing = await this.getStudySets();
    const updated = [...existing.filter(s => s.id !== set.id), { ...set, lastAccessed: Date.now() }];
    localStorage.setItem(STORAGE_KEY_SETS, JSON.stringify(updated));
    // Simulate smart sync queue
    this.queueSync(set.id);
  },

  async getStudySets(): Promise<StudySet[]> {
    const data = localStorage.getItem(STORAGE_KEY_SETS);
    const sets: StudySet[] = data ? JSON.parse(data) : [];
    return sets;
  },

  async toggleDownload(id: string): Promise<void> {
    const sets = await this.getStudySets();
    const updated = sets.map(s => s.id === id ? { ...s, isOffline: !s.isOffline } : s);
    localStorage.setItem(STORAGE_KEY_SETS, JSON.stringify(updated));
  },

  async cleanupStorage(): Promise<number> {
    const sets = await this.getStudySets();
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    // Purge sets that aren't pinned for offline and haven't been accessed in 30 days
    const filtered = sets.filter(s => s.isOffline || s.lastAccessed > thirtyDaysAgo);
    localStorage.setItem(STORAGE_KEY_SETS, JSON.stringify(filtered));
    return sets.length - filtered.length;
  },

  async updateProgress(progress: Partial<UserProgress>): Promise<void> {
    const current = await this.getProgress();
    const updated = { ...current, ...progress };
    localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(updated));
  },

  async getProgress(): Promise<UserProgress> {
    const data = localStorage.getItem(STORAGE_KEY_PROGRESS);
    return data ? JSON.parse(data) : {
      totalStudyTime: 0,
      masteredConcepts: 0,
      streak: 0,
      xp: 0,
      lastStudyDate: Date.now(),
      lastSyncTimestamp: Date.now()
    };
  },

  // Fixed: Removed 'private' modifier as it's not allowed in object literal method definitions
  async queueSync(id: string) {
    if (!navigator.onLine) return;
    // Mock delta sync: In a real app, this would push only the changed fields
    console.log(`Syncing set ${id} to cloud...`);
    const sets = await this.getStudySets();
    const updated = sets.map(s => s.id === id ? { ...s, syncStatus: 'synced' as const } : s);
    localStorage.setItem(STORAGE_KEY_SETS, JSON.stringify(updated));
  }
};