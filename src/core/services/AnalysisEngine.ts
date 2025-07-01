// src/core/services/AnalysisEngine.ts

import { HealthRecord } from '../models/HealthRecord';
import type { IAnalysisEngine } from './interfaces/IAnalysisEngine';

export class AnalysisEngine implements IAnalysisEngine {
  constructor() {
    console.log('[AnalysisEngine] 分析エンジン（APIクライアントモード）が起動しました。');
  }

  /**
   * BMI (Body Mass Index) を計算する
   * このメソッドはローカルで完結するため、変更なし
   */
  public calculateBMI(weight: number, height: number): number | null {
    if (height <= 0 || weight <= 0) {
      return null;
    }
    const bmi = weight / (height * height);
    return Math.round(bmi * 10) / 10;
  }

  /**
   *【変更】バックエンドのAPIを呼び出してAIによる分析を依頼する
   * @param records 健康記録の配列
   * @returns Gemini APIから返された分析結果の文字列
   */
  public async analyze(records: HealthRecord[]): Promise<string> {
    const MIN_DATA_COUNT = 3; // 分析に必要な最小データ数

    // データが少ない場合は、APIを呼び出さずにフロントエンドでメッセージを返す
    if (records.length < MIN_DATA_COUNT) {
      return `記録が${MIN_DATA_COUNT}件以上集まると、GeminiによるAI分析が利用できます。`;
    }

    try {
      console.log('[AnalysisEngine] バックエンドに分析をリクエストします...');
      
      // Viteのプロキシ設定(/api)を経由して、バックエンドサーバーにリクエストを送信
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // bodyには記録データをJSON形式で含める
        body: JSON.stringify({ records }),
      });

      // APIからのレスポンスがエラーだった場合の処理
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData.error || response.statusText);
        throw new Error(`APIサーバーからエラーが返されました: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      console.log('[AnalysisEngine] AIからのレスポンスを受信しました。');
      
      // バックエンドから返された分析テキストを返す
      return data.analysisText;

    } catch (error) {
      console.error('APIへの分析リクエストに失敗しました:', error);
      // ユーザーに表示するエラーメッセージ
      return "AI分析の実行中にエラーが発生しました。バックエンドサーバーが起動しているか、APIキーが正しいか確認してください。";
    }
  }

  /**
   * このメソッドは古い同期的な分析ロジック用。
   * analyzeメソッドが非同期になったため、直接的な互換性はない。
   * エラーやメッセージを返すことで、誤用を防ぐ。
   */
  public analyzeCorrelation(records: HealthRecord[]): string {
    console.warn("[AnalysisEngine] analyzeCorrelationは非推奨です。代わりに非同期のanalyzeメソッドを使用してください。");
    if (records.length === 0) return "";
    return "分析中です..."; // UIに一時的なメッセージを表示させる
  }
}