import { HealthRecord } from './HealthRecord';

//【追加】睡眠ステージの型を定義 (外部からも使えるようにexport)
export type SleepStage = 'deep' | 'light' | 'rem' | 'awake';

//【追加】各ステージの所要時間（分）を保持するオブジェクトの型 (外部からも使えるようにexport)
export type SleepStageDurations = {
  [key in SleepStage]?: number; // deep: 90, light: 240 のような形式。各ステージはオプショナル
};

/**
 * HealthRecordを継承した、具体的な「睡眠記録」クラス。
 * 各睡眠ステージごとの所要時間を保持する。
 */
export class SleepRecord extends HealthRecord {
  //【変更】単純な時間と質から、詳細なステージ記録に変更
  public stageDurations: SleepStageDurations;

  constructor(
    id: string,
    userId: string,
    date: Date,
    stageDurations: SleepStageDurations //【変更】コンストラクタの引数は4つ
  ) {
    super(id, userId, date);
    this.stageDurations = stageDurations;
  }

  /**
   *【追加】記録されているすべてのステージの合計睡眠時間（時間単位）を計算して返す。
   * @returns number 合計睡眠時間 (時間)
   */
  public getTotalHours(): number {
    if (!this.stageDurations) {
      return 0;
    }
    const totalMinutes = Object.values(this.stageDurations).reduce((sum, current) => sum + (current || 0), 0);
    return totalMinutes / 60;
  }
}