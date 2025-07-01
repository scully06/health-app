// src/hooks/useSleepData.ts
import { useState, useEffect, useCallback } from 'react';

// 型定義
export interface SleepSegment {
  stage: string;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
}

// 睡眠段階のマッピング
const sleepStageMap: { [key: number]: string } = {
  1: '覚醒',
  2: '睡眠(不明)',
  3: '離床',
  4: '浅い睡眠',
  5: '深い睡眠',
  6: 'レム睡眠',
};

interface SleepDataState {
  sleepSegments: SleepSegment[];
  isLoading: boolean;
  error: Error | null;
  fetchData: () => void;
}

export const useSleepData = (accessToken: string | null): SleepDataState => {
  const [sleepSegments, setSleepSegments] = useState<SleepSegment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!accessToken) {
      setSleepSegments([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 7); // 過去7日間を対象

      // 1. 睡眠セッションの取得
      const sessionsResponse = await fetch(`https://www.googleapis.com/fitness/v1/users/me/sessions?startTime=${startDate.toISOString()}&endTime=${endDate.toISOString()}&activityType=72`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (!sessionsResponse.ok) throw new Error(`睡眠セッションの取得に失敗: ${sessionsResponse.statusText}`);
      const sessionsData = await sessionsResponse.json();

      if (!sessionsData.session || sessionsData.session.length === 0) {
        setSleepSegments([]);
        setIsLoading(false);
        return;
      }

      // 2. 各セッションのセグメントを取得
      const allSegments: SleepSegment[] = [];
      for (const session of sessionsData.session) {
        const segmentsResponse = await fetch('https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            aggregateBy: [{ dataTypeName: "com.google.sleep.segment" }],
            startTimeMillis: session.startTimeMillis,
            endTimeMillis: session.endTimeMillis,
          })
        });
        if (!segmentsResponse.ok) continue;
        const segmentsData = await segmentsResponse.json();
        
        segmentsData.bucket.forEach((b: any) => {
          b.dataset[0]?.point.forEach((p: any) => {
            const startTime = new Date(parseInt(p.startTimeNanos) / 1e6);
            const endTime = new Date(parseInt(p.endTimeNanos) / 1e6);
            allSegments.push({
              stage: sleepStageMap[p.value[0].intVal] || '不明',
              startTime,
              endTime,
              durationMinutes: (endTime.getTime() - startTime.getTime()) / 60000,
            });
          });
        });
      }
      setSleepSegments(allSegments);
    } catch (e) {
      setError(e as Error);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  return { sleepSegments, isLoading, error, fetchData };
};