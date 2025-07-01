// src/core/services/RecordManager.ts

import { SleepRecord } from '../models/SleepRecord';
import { WeightRecord } from '../models/WeightRecord';
import { HealthRecord } from '../models/HealthRecord';
import type { IRecordManager } from './interfaces/IRecordManager';
import { FoodRecord } from '../models/FoodRecord';

export interface IExtendedRecordManager extends IRecordManager {
  deleteRecord(recordId: string): Promise<void>;
}

export class RecordManager implements IExtendedRecordManager {
  private readonly STORAGE_KEY = 'health-app-records';
  private records: HealthRecord[] = [];

  constructor() {
    console.log('[RecordManager] 記録管理者が起動しました。');
    this.loadRecordsFromStorage();
  }

  private loadRecordsFromStorage(): void {
    try {
      const storedData = localStorage.getItem(this.STORAGE_KEY);
      if (storedData) {
        const plainObjects: any[] = JSON.parse(storedData);
        this.records = plainObjects.map(obj => {
          const recordDate = new Date(obj.date);
          if ('weight' in obj) return new WeightRecord(obj.id, obj.userId, recordDate, obj.weight);
          if ('stageDurations' in obj) return new SleepRecord(obj.id, obj.userId, recordDate, obj.stageDurations);
          if ('mealType' in obj) return new FoodRecord(obj.id, obj.userId, recordDate, obj.mealType, obj.description, obj.calories);
          return null;
        }).filter(Boolean) as HealthRecord[];
        
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
  
  /**
   *【重要】重複記録防止ロジックを組み込んだsaveRecordメソッド
   */
  public async saveRecord(record: HealthRecord): Promise<void> {
    const foundIndex = this.records.findIndex(r => r.id === record.id);

    if (foundIndex !== -1) {
      // 既存のIDがあれば、それは「編集」なので上書きする
      this.records[foundIndex] = record;
      console.log(`[RecordManager] 記録を上書きしました (ID: ${record.id})`);
    } else {
      // IDがなければ新規。ただし、手動の体重・睡眠は1日1件の重複チェックを行う
      if (record instanceof WeightRecord || record instanceof SleepRecord) {
        // Google Fitからの同期データ('gf-'で始まるID)は、このチェックをスキップ
        if (!record.id.startsWith('gf-')) {
          const dailyDuplicateIndex = this.records.findIndex(r =>
            !r.id.startsWith('gf-') && // 手動入力同士で比較
            r.constructor === record.constructor && // 同じ種類の記録か(WeightRecord vs WeightRecord)
            new Date(r.date).toDateString() === new Date(record.date).toDateString() // 同じ日付か
          );

          if (dailyDuplicateIndex !== -1) {
            //【重要】重複が見つかった場合はアラートを出し、保存しない
            alert(`この日付の${record instanceof WeightRecord ? '体重' : '睡眠'}記録は既に存在します。既存の記録を上書きします。`);
            this.records[dailyDuplicateIndex] = record; // 重複した古い方を上書きする
          } else {
            this.records.push(record);
          }
        } else {
           this.records.push(record); // Google Fitのデータは重複チェックせず追加
        }
      } else {
        // 食事記録は重複チェックなしで常に追加
        this.records.push(record);
      }
    }

    this.saveRecordsToStorage();
  }

  public async getRecords(userId: string): Promise<HealthRecord[]> {
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