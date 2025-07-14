// src/core/services/AchievementManager.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AchievementManager } from './AchievementManager';
import { HealthRecord } from '../models/HealthRecord';
import { WeightRecord } from '../models/WeightRecord';
import { FoodRecord } from '../models/FoodRecord';
import { SleepRecord } from '../models/SleepRecord';

// --- localStorageのモックを作成 ---
const createLocalStorageMock = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
    removeItem: (key: string) => {
      delete store[key];
    },
  };
};

// 【修正】テスト全体でグローバルなlocalStorageをモックに置き換える
vi.stubGlobal('localStorage', createLocalStorageMock());


// モックデータを作成
const createRecord = (type: 'weight' | 'food' | 'sleep', date: string): HealthRecord => {
  const common = { id: `id-${Math.random()}`, userId: 'test-user', date: new Date(date) };
  if (type === 'weight') return new WeightRecord(common.id, common.userId, common.date, 60);
  if (type === 'food') return new FoodRecord(common.id, common.userId, common.date, '朝食', 'test', 100);
  return new SleepRecord(common.id, common.userId, common.date, { deep: 240, light: 240 });
};

describe('AchievementManager', () => {
  let achievementManager: AchievementManager;

  beforeEach(() => {
    // 各テストの前にモックのlocalStorageをクリアし、新しいインスタンスを作成
    localStorage.clear();
    achievementManager = new AchievementManager();
  });

  it('最初の記録で「はじめの一歩」を解除する', () => {
    const records = [createRecord('weight', '2025-07-10')];
    const newAchievements = achievementManager.checkAchievements(records);
    expect(newAchievements).toHaveLength(1);
    expect(newAchievements[0].id).toBe('first_step');
  });

  it('体重を10回記録すると「体重ウォッチャー」を解除する', () => {
    const records: HealthRecord[] = [];
    for (let i = 0; i < 10; i++) {
      records.push(createRecord('weight', `2025-07-${10 + i}`));
    }
    const newAchievements = achievementManager.checkAchievements(records);
    expect(newAchievements.some(a => a.id === 'weight_watcher_1')).toBe(true);
  });

  it('7日間連続で記録すると「継続は力なり」を解除する', () => {
    const records: HealthRecord[] = [];
    for (let i = 0; i < 7; i++) {
      records.push(createRecord('sleep', `2025-07-${10 + i}`));
    }
    const newAchievements = achievementManager.checkAchievements(records);
    expect(newAchievements.some(a => a.id === 'consistent_logger')).toBe(true);
  });
  
  it('途中で途切れた場合は連続記録とみなさない', () => {
    const records: HealthRecord[] = [
        createRecord('weight', '2025-07-10'),
        createRecord('weight', '2025-07-11'),
        createRecord('weight', '2025-07-13'), // 1日空く
        createRecord('weight', '2025-07-14'),
        createRecord('weight', '2025-07-15'),
        createRecord('weight', '2025-07-16'),
        createRecord('weight', '2025-07-17'),
    ];
    const newAchievements = achievementManager.checkAchievements(records);
    expect(newAchievements.some(a => a.id === 'consistent_logger')).toBe(false);
  });

  it('一度解除した実績は再度解除しない', () => {
    const records = [createRecord('weight', '2025-07-10')];
    // 1回目
    achievementManager.checkAchievements(records);
    // 2回目
    const newAchievements = achievementManager.checkAchievements(records);
    expect(newAchievements).toHaveLength(0);
  });
});
