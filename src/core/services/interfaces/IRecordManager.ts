// src/core/services/interfaces/IRecordManager.ts
import { HealthRecord } from '../../models/HealthRecord';

/**
 * RecordManagerが果たすべき責務（インターフェース）。
 * 「記録を保存し、取得できる」という契約を定義する。
 */
// ↓↓↓ ここに export を追加します ↓↓↓
export interface IRecordManager {
  saveRecord(record: HealthRecord): Promise<void>;
  getRecords(userId: string): Promise<HealthRecord[]>;
}