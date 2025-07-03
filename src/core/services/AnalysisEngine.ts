// src/core/services/AnalysisEngine.ts

import { HealthRecord } from '../models/HealthRecord';
import type { IAnalysisEngine } from './interfaces/IAnalysisEngine';

export class AnalysisEngine implements IAnalysisEngine {
  constructor() {
    console.log('[AnalysisEngine] 分析エンジン（APIクライアントモード）が起動しました。');
  }

  public calculateBMI(weight: number, height: number): number | null {
    if (height <= 0 || weight <= 0) {
      return null;
    }
    const bmi = weight / (height * height);
    return Math.round(bmi * 10) / 10;
  }

  public async analyze(records: HealthRecord[]): Promise<string> {
    const MIN_DATA_COUNT = 3;

    if (records.length < MIN_DATA_COUNT) {
      return `記録が${MIN_DATA_COUNT}件以上集まると、GeminiによるAI分析が利用できます。`;
    }

    try {
      console.log('[AnalysisEngine] バックエンドに分析をリクエストします...');
      
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ records }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error || response.statusText;
        console.error('API Error:', errorMessage);
        // 【変更】エラーを投げるのではなく、ユーザーフレンドリーなメッセージを返す
        return `AI分析でエラーが発生しました: ${errorMessage}`;
      }

      const data = await response.json();
      console.log('[AnalysisEngine] AIからのレスポンスを受信しました。');
      
      return data.analysisText;

    } catch (error) {
      console.error('APIへの分析リクエストに失敗しました:', error);
      return "AI分析の実行中にエラーが発生しました。バックエンドサーバーが起動しているか確認してください。";
    }
  }

  public analyzeCorrelation(records: HealthRecord[]): string {
    console.warn("[AnalysisEngine] analyzeCorrelationは非推奨です。代わりに非同期のanalyzeメソッドを使用してください。");
    if (records.length === 0) return "";
    return "分析中です...";
  }
}