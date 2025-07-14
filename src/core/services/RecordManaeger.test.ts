// src/core/services/RecordManager.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RecordManager } from './RecordManager';
import { WeightRecord } from '../models/WeightRecord';
import { SleepRecord } from '../models/SleepRecord';

// --- localStorageのモックを作成 ---
const createLocalStorageMock = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    clear: () => { store = {}; },
    removeItem: (key: string) => { delete store[key]; },
  };
};

// テスト全体でグローバルなlocalStorageをモックに置き換える
vi.stubGlobal('localStorage', createLocalStorageMock());

describe('RecordManager', () => {
  let recordManager: RecordManager;

  beforeEach(() => {
    localStorage.clear();
    recordManager = new RecordManager();
  });

  it('新しい記録を正しく保存できる', async () => {
    const record = new WeightRecord('w1', 'user1', new Date(), 70);
    await recordManager.saveRecord(record);
    const records = await recordManager.getRecords();
    expect(records).toHaveLength(1);
    expect(records[0].id).toBe('w1');
  });

  it('既存の記録をIDで上書き（編集）できる', async () => {
    const initialRecord = new WeightRecord('w1', 'user1', new Date(), 70);
    await recordManager.saveRecord(initialRecord);
    const updatedRecord = new WeightRecord('w1', 'user1', new Date(), 71);
    await recordManager.saveRecord(updatedRecord);

    const records = await recordManager.getRecords();
    expect(records).toHaveLength(1);
    expect((records[0] as WeightRecord).weight).toBe(71);
  });

  it('同じ日に複数の睡眠記録を保存できる', async () => {
    const sleep1 = new SleepRecord('s1', 'user1', new Date('2025-07-10T12:00:00'), { deep: 60 });
    const sleep2 = new SleepRecord('s2', 'user1', new Date('2025-07-10T22:00:00'), { deep: 420 });
    await recordManager.saveRecord(sleep1);
    await recordManager.saveRecord(sleep2);
    const records = await recordManager.getRecords();
    expect(records.filter(r => r instanceof SleepRecord)).toHaveLength(2);
  });

  it('記録を正しく削除できる', async () => {
    const record = new WeightRecord('w1', 'user1', new Date(), 70);
    await recordManager.saveRecord(record);
    
    await recordManager.deleteRecord('w1');
    const records = await recordManager.getRecords();
    expect(records).toHaveLength(0);
  });

  it('インポート時に不正なデータを無視する', async () => {
    const invalidData = [
      { id: '1', userId: 'u1', date: '2025-07-10', weight: 70 }, // 正しい
      { id: '2', userId: 'u1' }, // dateがない
      { id: '3', userId: 'u1', date: 'invalid-date', weight: 70 }, // 無効な日付
      { id: '4', userId: 'u1', date: '2025-07-11' } // 記録タイプがない
    ];
    // 【修正】any型としてキャストすることで、テストコードの型エラーを解決
    await recordManager.overwriteAllRecords(invalidData as any);
    const records = await recordManager.getRecords();
    expect(records).toHaveLength(1);
    expect(records[0].id).toBe('1');
  });
});
