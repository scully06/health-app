// src/core/services/RecordManager.ts

import { SleepRecord } from '../models/SleepRecord';
import { WeightRecord } from '../models/WeightRecord';
import { HealthRecord } from '../models/HealthRecord';
import type { IRecordManager } from './interfaces/IRecordManager';
import { FoodRecord } from '../models/FoodRecord';

//【修正】IRecordManagerインターフェースにもdeleteRecordを追加
export interface IExtendedRecordManager extends IRecordManager {
  deleteRecord(recordId: string): Promise<void>;
}

export class RecordManager implements IRecordManager { // IExtendedRecordManager を実装
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
          obj.date = new Date(obj.date); 
          if ('weight' in obj) {
            return new WeightRecord(obj.id, obj.userId, obj.date, obj.weight);
          }
          if ('sleepTime' in obj) {
            return new SleepRecord(obj.id, obj.userId, obj.date, obj.sleepTime, obj.quality);
          }
          //【追加】FoodRecordの読み込みロジック
          if ('mealType' in obj) {
            return new FoodRecord(obj.id, obj.userId, obj.date, obj.mealType, obj.description, obj.calories);
          }
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
      console.log('[RecordManager] データをlocalStorageに保存しました。');
    } catch (error) {
      console.error('[RecordManager] localStorageへのデータ保存に失敗しました。', error);
    }
  }

  public async saveRecord(record: HealthRecord): Promise<void> {
    //【修正】食事記録は1日に複数回あるため、IDで重複を判定する
    let foundIndex = this.records.findIndex(r => r.id === record.id);

    // 手動入力の体重・睡眠記録の場合のみ、日付と種類で重複を探す
    if (!(record instanceof FoodRecord) && !record.id.startsWith('gf-')) {
       foundIndex = this.records.findIndex(
         (r) => 
           r.userId === record.userId &&
           r.date.getFullYear() === record.date.getFullYear() &&
           r.date.getMonth() === record.date.getMonth() &&
           r.date.getDate() === record.date.getDate() &&
           r.constructor === record.constructor &&
           !r.id.startsWith('gf-')
       );
    }

    if (foundIndex !== -1) {
      this.records[foundIndex] = record;
    } else {
      this.records.push(record);
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
    }
  }
}