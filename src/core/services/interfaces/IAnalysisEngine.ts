// src/core/services/interfaces/IAnalysisEngine.ts
import { HealthRecord } from '../../models/HealthRecord';

/**
 * AnalysisEngineが果たすべき責務（インターフェース）。
 * 「BMIを計算し、データを分析できる」という契約を定義する。
 */
// ↓↓↓ ここに export を追加します ↓↓↓
export interface IAnalysisEngine {
  calculateBMI(weight: number, height: number): number | null;
  analyze(records: HealthRecord[]): Promise<string>; // 分析結果を文字列で返す
}