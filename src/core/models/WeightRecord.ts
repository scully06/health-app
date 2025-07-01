// src/core/models/WeightRecord.ts
import { HealthRecord } from './HealthRecord';

/**
 * HealthRecordを継承した、具体的な「体重記録」クラス。
 */
export class WeightRecord extends HealthRecord {
  public weight: number; // kg単位

  constructor(id: string, userId: string, date: Date, weight: number) {
    super(id, userId, date);
    this.weight = weight;
    console.log(`[WeightRecord] WeightRecordオブジェクトが作成されました: ${this.date.toLocaleDateString()} - ${this.weight}kg`);
  }
}