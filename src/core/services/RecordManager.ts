// src/core/services/RecordManager.ts

import { SleepRecord } from '../models/SleepRecord';
import { WeightRecord } from '../models/WeightRecord';
import { HealthRecord } from '../models/HealthRecord';
import type { IRecordManager } from './interfaces/IRecordManager';

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
    console.log(`[RecordManager] 記録の保存を試みます... ID: ${record.id}`);

    let foundIndex = -1;

    // Google Fit由来のデータか (IDで簡易判定)
    if (record.id.startsWith('gf-')) {
      // Google FitのデータはIDが同じなら同一とみなす
      foundIndex = this.records.findIndex(r => r.id === record.id);
    } else {
      // 手動入力のデータは、日付と種類で重複を判定
      foundIndex = this.records.findIndex(
        (r) => 
          r.userId === record.userId &&
          r.date.getFullYear() === record.date.getFullYear() &&
          r.date.getMonth() === record.date.getMonth() &&
          r.date.getDate() === record.date.getDate() &&
          r.constructor === record.constructor &&
          !r.id.startsWith('gf-') // 手動入力同士のみを比較対象とする
      );
    }

    if (foundIndex !== -1) {
      console.log(`[RecordManager] 既存の記録を上書きします。ID: ${record.id}`);
      this.records[foundIndex] = record;
    } else {
      console.log(`[RecordManager] 新しい記録を追加します。ID: ${record.id}`);
      this.records.push(record);
    }

    //【重要】処理の最後に必ずlocalStorageへの書き込みを行う
    this.saveRecordsToStorage();
  }

  public async getRecords(userId: string): Promise<HealthRecord[]> {
    return [...this.records]; // 念のためコピーを返す
  }

  /**
   * 【追加】指定されたIDの記録を削除するメソッド
   * @param recordId 削除する記録のID
   */
  public async deleteRecord(recordId: string): Promise<void> {
    console.log(`[RecordManager] 記録の削除を試みます... ID: ${recordId}`);
    const initialLength = this.records.length;
    this.records = this.records.filter(r => r.id !== recordId);

    if (this.records.length < initialLength) {
      console.log(`[RecordManager] 記録ID: ${recordId} の削除が完了しました。`);
      this.saveRecordsToStorage(); // 変更があったのでlocalStorageにも保存
    } else {
      console.warn(`[RecordManager] 削除対象の記録ID: ${recordId} が見つかりませんでした。`);
    }
  }
}