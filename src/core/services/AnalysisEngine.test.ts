// src/core/services/AnalysisEngine.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AnalysisEngine } from './AnalysisEngine';
import { HealthRecord } from '../models/HealthRecord';

// --- fetchのモック ---
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('AnalysisEngine', () => {
  let analysisEngine: AnalysisEngine;

  beforeEach(() => {
    analysisEngine = new AnalysisEngine();
    mockFetch.mockClear();
  });

  describe('calculateBMI', () => {
    it('正しくBMIを計算する', () => {
      expect(analysisEngine.calculateBMI(70, 1.75)).toBe(22.9);
    });

    it('不正な入力値に対してnullを返す', () => {
      expect(analysisEngine.calculateBMI(0, 1.75)).toBeNull();
      expect(analysisEngine.calculateBMI(70, 0)).toBeNull();
    });
  });

  describe('analyze', () => {
    it('記録が3件未満の場合、APIを呼ばずにメッセージを返す', async () => {
      const records: HealthRecord[] = [];
      const result = await analysisEngine.analyze(records);
      expect(result).toContain('3件以上集まると');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('APIが成功した場合、分析結果のテキストを返す', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ analysisText: '素晴らしいですね！' }),
      });

      const records = [{}, {}, {}] as HealthRecord[]; // 3件以上のダミーデータ
      const result = await analysisEngine.analyze(records);
      
      expect(mockFetch).toHaveBeenCalledWith('/api/analyze', expect.any(Object));
      expect(result).toBe('素晴らしいですね！');
    });

    it('APIが失敗した場合、エラーメッセージを返す', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({ error: 'サーバーエラー' }),
      });

      const records = [{}, {}, {}] as HealthRecord[];
      const result = await analysisEngine.analyze(records);
      expect(result).toContain('AI分析でエラーが発生しました: サーバーエラー');
    });
  });
});
