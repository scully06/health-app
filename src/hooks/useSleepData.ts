// src/hooks/useSleepData.ts
import { useState, useCallback } from 'react';
// 【追加】作成した型をインポート
import type { SleepDataResponse } from '../core/types/googleFit';

// 【変更】Google Fit APIが返す睡眠ステージの値を網羅した型
type FitnessApiSleepStage = 1 | 2 | 3 | 4 | 5 | 6; 
type FitnessSleepStage = 'AWAKE' | 'SLEEP' | 'OUT_OF_BED' | 'LIGHT' | 'DEEP' | 'REM';

export interface SleepSegment {
  startTime: Date;
  endTime: Date;
  stage: FitnessApiSleepStage;
  durationMinutes: number;
}
interface SleepDataState {
  sleepSegments: SleepSegment[];
  isLoading: boolean;
  error: Error | null;
  fetchSleepData: (startDate: Date, endDate: Date) => Promise<void>;
}

const FITNESS_API_URL = 'https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate';

export const useSleepData = (accessToken: string | null): SleepDataState => {
  const [sleepSegments, setSleepSegments] = useState<SleepSegment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchSleepData = useCallback(async (startDate: Date, endDate: Date) => {
    if (!accessToken) return;

    setIsLoading(true);
    setError(null);
    setSleepSegments([]);

    const extendedStartDate = new Date(startDate);
    extendedStartDate.setDate(extendedStartDate.getDate() - 1);
    extendedStartDate.setHours(12, 0, 0, 0);

    const extendedEndDate = new Date(endDate);
    extendedEndDate.setDate(extendedEndDate.getDate() + 1);
    extendedEndDate.setHours(12, 0, 0, 0);
    
    const requestBody = {
      aggregateBy: [{ dataTypeName: "com.google.sleep.segment" }],
      startTimeMillis: extendedStartDate.getTime(),
      endTimeMillis: extendedEndDate.getTime(),
    };

    try {
      const response = await fetch(FITNESS_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      // 【変更】any型ではなく、厳格な型を適用
      const responseData: SleepDataResponse = await response.json();
      
      if (!response.ok) {
        // 【変更】より詳細なエラーメッセージを取得
        const errorDetails = (responseData as any).error?.message || `HTTPエラー: ${response.status}`;
        throw new Error(errorDetails);
      }

      const parsedSegments: SleepSegment[] = [];
      if (responseData.bucket) {
        responseData.bucket.forEach((bucket) => {
          bucket.dataset.forEach((dataset) => {
            dataset.point.forEach((point) => {
              // 【変更】より安全な型チェック
              const stageValue = point.value[0]?.intVal;
              if (stageValue !== undefined && point.startTimeNanos && point.endTimeNanos) {
                const start = new Date(parseInt(point.startTimeNanos) / 1e6);
                const end = new Date(parseInt(point.endTimeNanos) / 1e6);
                parsedSegments.push({
                  startTime: start,
                  endTime: end,
                  stage: stageValue as FitnessApiSleepStage,
                  durationMinutes: (end.getTime() - start.getTime()) / (1000 * 60)
                });
              }
            });
          });
        });
      }

      const stageIntMap: Record<FitnessApiSleepStage, FitnessSleepStage> = {
        1: 'AWAKE', 2: 'SLEEP', 3: 'OUT_OF_BED', 4: 'LIGHT', 5: 'DEEP', 6: 'REM'
      };
      
      // `as any`キャストをなくすための準備
      const finalSegments = parsedSegments
        .map(seg => ({
            ...seg,
            stage: stageIntMap[seg.stage] || 'SLEEP'
        }))
        .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

      setSleepSegments(finalSegments as any); // このキャストはgroupSleepDataByNightの入力に合わせていますが、理想はそちらも修正することです

    } catch (err: any) {
      console.error('[useSleepData] fetchSleepDataでエラー:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  return { sleepSegments, isLoading, error, fetchSleepData };
};