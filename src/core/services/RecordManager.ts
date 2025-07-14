// src/core/services/RecordManager.ts

import { SleepRecord } from '../models/SleepRecord';
import { WeightRecord } from '../models/WeightRecord';
import { HealthRecord } from '../models/HealthRecord';
import type { IRecordManager } from './interfaces/IRecordManager';
import { FoodRecord } from '../models/FoodRecord';

export interface IExtendedRecordManager extends IRecordManager {
  deleteRecord(recordId: string): Promise<void>;
  overwriteAllRecords(records: HealthRecord[]): Promise<void>;
}

/**
 * JSONオブジェクトを検証し、HealthRecordインスタンスに変換するヘルパー関数
 * @param obj - JSONからパースされたプレーンなオブジェクト
 * @returns HealthRecordのインスタンス、または無効なデータの場合はnull
 */
const recordReviver = (obj: any): HealthRecord | null => {
  if (!obj || typeof obj.id !== 'string' || typeof obj.userId !== 'string' || !obj.date) {
    console.warn('Skipping invalid record object:', obj);
    return null;
  }

  // 【修正】Safariやテスト環境でも安全な日付解析を行う
  const dateString = typeof obj.date === 'string' ? obj.date.replace(/-/g, '/') : obj.date;
  const recordDate = new Date(dateString);
  
  if (isNaN(recordDate.getTime())) {
    console.warn('Skipping record with invalid date:', obj);
    return null;
  }

  if ('weight' in obj && typeof obj.weight === 'number') {
    return new WeightRecord(obj.id, obj.userId, recordDate, obj.weight);
  }
  if ('stageDurations' in obj && typeof obj.stageDurations === 'object') {
    return new SleepRecord(obj.id, obj.userId, recordDate, obj.stageDurations);
  }
  if ('mealType' in obj && typeof obj.mealType === 'string' && typeof obj.description === 'string' && typeof obj.calories === 'number') {
    return new FoodRecord(obj.id, obj.userId, recordDate, obj.mealType, obj.description, obj.calories);
  }

  console.warn('Skipping unknown record type:', obj);
  return null;
};


export class RecordManager implements IExtendedRecordManager {
  private readonly STORAGE_KEY = 'health-app-records';
  private records: HealthRecord[] = [];

  constructor() {
    console.log('[RecordManager] 記録管理者が起動しました。');
    this.loadRecordsFromStorage();
  }
  
  public async overwriteAllRecords(newRecords: any[]): Promise<void> {
    try {
      this.records = newRecords.map(recordReviver).filter((r): r is HealthRecord => r !== null);
      this.saveRecordsToStorage();
      console.log(`[RecordManager] 全記録をインポートデータで上書きしました。件数: ${this.records.length}`);
    } catch(error) {
      console.error('[RecordManager] データのインポートに失敗しました。', error);
      throw new Error('インポートに失敗しました。ファイルの形式が正しくない可能性があります。');
    }
  }

  private loadRecordsFromStorage(): void {
    try {
      const storedData = localStorage.getItem(this.STORAGE_KEY);
      if (storedData) {
        const plainObjects: any[] = JSON.parse(storedData);
        this.records = plainObjects.map(recordReviver).filter((r): r is HealthRecord => r !== null);
        console.log('[RecordManager] localStorageからデータを読み込みました。');
      }
    } catch (error) {
      console.error('[RecordManager] localStorageからのデータ読み込みに失敗しました。', error);
      this.records = [];
    }
  }

  private saveRecordsToStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.records));
    } catch (error) {
      console.error('[RecordManager] localStorageへのデータ保存に失敗しました。', error);
    }
  }
  
  public async saveRecord(record: HealthRecord): Promise<void> {
    const foundIndex = this.records.findIndex(r => r.id === record.id);

    if (foundIndex !== -1) {
      this.records[foundIndex] = record;
      console.log(`[RecordManager] 記録を上書きしました (ID: ${record.id})`);
    } else {
      if (record instanceof WeightRecord && !record.id.startsWith('gf-')) {
          const dailyDuplicateIndex = this.records.findIndex(r =>
            !r.id.startsWith('gf-') &&
            r instanceof WeightRecord &&
            new Date(r.date).toDateString() === new Date(record.date).toDateString()
          );

          if (dailyDuplicateIndex !== -1) {
            alert(`この日付の体重記録は既に存在します。既存の記録を上書きします。`);
            this.records[dailyDuplicateIndex] = record;
          } else {
            this.records.push(record);
          }
      } else {
        this.records.push(record);
      }
    }

    this.saveRecordsToStorage();
  }

  public async getRecords(): Promise<HealthRecord[]> {
    return [...this.records];
  }

  public async deleteRecord(recordId: string): Promise<void> {
    const initialLength = this.records.length;
    this.records = this.records.filter(r => r.id !== recordId);

    if (this.records.length < initialLength) {
      this.saveRecordsToStorage();
      console.log(`[RecordManager] 記録を削除しました (ID: ${recordId})`);
    } else {
      console.warn(`[RecordManager] 削除対象の記録が見つかりませんでした (ID: ${recordId})`);
    }
  }
}
