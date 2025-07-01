// src/core/models/SleepRecord.ts
import { HealthRecord } from './HealthRecord';

/**
 * HealthRecordを継承した、具体的な「睡眠記録」クラス。
 */
export class SleepRecord extends HealthRecord {
  // 睡眠の質を表現するための型（enum）を定義
  public static readonly Quality = {
    POOR: '悪い',
    NORMAL: '普通',
    GOOD: '良い',
  } as const;

  public sleepTime: number; // 睡眠時間 (時間単位、例: 7.5)
  public quality: typeof SleepRecord.Quality[keyof typeof SleepRecord.Quality];

  constructor(
    id: string,
    userId: string,
    date: Date,
    sleepTime: number,
    quality: typeof SleepRecord.Quality[keyof typeof SleepRecord.Quality]
  ) {
    super(id, userId, date);
    this.sleepTime = sleepTime;
    this.quality = quality;
    console.log(`[SleepRecord] SleepRecordオブジェクトが作成されました: ${this.sleepTime}h`);
  }
}