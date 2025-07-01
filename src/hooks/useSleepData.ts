// src/hooks/useSleepData.ts
import { useState, useCallback } from 'react';

// 型定義は変更なし
type FitnessSleepStage = 'AWAKE' | 'SLEEP' | 'OUT_OF_BED' | 'LIGHT' | 'DEEP' | 'REM';
export interface SleepSegment {
  startTime: Date;
  endTime: Date;
  stage: FitnessSleepStage;
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

    //【アルゴリズム実装】ステップ1 & 2: リクエスト期間を前後に拡張する
    // 開始日は前日の昼12時に設定
    const extendedStartDate = new Date(startDate);
    extendedStartDate.setDate(extendedStartDate.getDate() - 1);
    extendedStartDate.setHours(12, 0, 0, 0);

    // 終了日は翌日の昼12時に設定
    const extendedEndDate = new Date(endDate);
    extendedEndDate.setDate(extendedEndDate.getDate() + 1);
    extendedEndDate.setHours(12, 0, 0, 0);
    
    console.log(`[useSleepData] 拡張されたリクエスト期間 (JST): ${extendedStartDate.toLocaleString('ja-JP')} - ${extendedEndDate.toLocaleString('ja-JP')}`);

    const startTimeMillis = extendedStartDate.getTime();
    const endTimeMillis = extendedEndDate.getTime();

    const requestBody = {
      aggregateBy: [{ dataTypeName: "com.google.sleep.segment" }],
      startTimeMillis: startTimeMillis,
      endTimeMillis: endTimeMillis,
    };

    try {
      console.log('[useSleepData] Fitness APIへのリクエストボディ:', JSON.stringify(requestBody, null, 2));
      const response = await fetch(FITNESS_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      const responseData = await response.json();
      console.log('[useSleepData] Fitness APIからのレスポンス (生):', responseData);
      
      if (!response.ok) {
        throw new Error(responseData.error?.message || `HTTPエラー: ${response.status}`);
      }

      const parsedSegments: SleepSegment[] = [];
      if (responseData.bucket) {
        responseData.bucket.forEach((bucket: any) => {
          bucket.dataset.forEach((dataset: any) => {
            dataset.point.forEach((point: any) => {
              if (point.value && point.value[0]?.intVal) {
                const start = new Date(parseInt(point.startTimeNanos) / 1e6);
                const end = new Date(parseInt(point.endTimeNanos) / 1e6);
                parsedSegments.push({
                  startTime: start,
                  endTime: end,
                  stage: point.value[0].intVal as any,
                  durationMinutes: (end.getTime() - start.getTime()) / (1000 * 60)
                });
              }
            });
          });
        });
      }

      const stageIntMap: { [key: number]: FitnessSleepStage } = {
        1: 'AWAKE', 2: 'SLEEP', 3: 'OUT_OF_BED', 4: 'LIGHT', 5: 'DEEP', 6: 'REM'
      };
      
      //【重要】取得したデータを開始時間でソートしておく（アルゴリズムのステップ4の準備）
      const finalSegments = parsedSegments
        .map(seg => ({
            ...seg,
            stage: stageIntMap[seg.stage as any] || 'SLEEP'
        }))
        .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

      console.log(`[useSleepData] 解析・ソートされた睡眠セグメント: ${finalSegments.length}件`, finalSegments);
      setSleepSegments(finalSegments);

    } catch (err: any) {
      console.error('[useSleepData] fetchSleepDataでエラー:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  return { sleepSegments, isLoading, error, fetchSleepData };
};