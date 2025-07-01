import { useState, useEffect, useCallback } from 'react';

// 型定義
export interface WeightDataPoint { date: Date; weightKg: number; }
export interface SleepDataPoint { date: Date; sleepHours: number; }

interface FitData {
  weightData: WeightDataPoint[];
  sleepData: SleepDataPoint[];
  isLoading: boolean;
  error: Error | null;
  fetchData: () => void;
}

export const useFitData = (accessToken: string | null): FitData => {
  const [weightData, setWeightData] = useState<WeightDataPoint[]>([]);
  const [sleepData, setSleepData] = useState<SleepDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!accessToken) return;

    setIsLoading(true);
    setError(null);

    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 30); // 過去30日間

      // 体重データ取得
      const weightResponse = await fetch('https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aggregateBy: [{ dataTypeName: "com.google.weight" }],
          bucketByTime: { durationMillis: 86400000 },
          startTimeMillis: startDate.getTime(),
          endTimeMillis: endDate.getTime(),
        })
      });
      if (!weightResponse.ok) throw new Error('Failed to fetch weight data');
      const weightJson = await weightResponse.json();
      const formattedWeightData: WeightDataPoint[] = weightJson.bucket
        .map((b: any) => {
          const point = b.dataset[0]?.point[0];
          if (!point || !point.value[0]?.fpVal) return null;
          return { date: new Date(parseInt(b.startTimeMillis)), weightKg: point.value[0].fpVal };
        }).filter((p: WeightDataPoint | null): p is WeightDataPoint => p !== null);
      setWeightData(formattedWeightData);

      // 睡眠データ取得
      const sleepResponse = await fetch(`https://www.googleapis.com/fitness/v1/users/me/sessions?startTime=${startDate.toISOString()}&endTime=${endDate.toISOString()}&activityType=72`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (!sleepResponse.ok) throw new Error('Failed to fetch sleep sessions');
      const sleepJson = await sleepResponse.json();
      const formattedSleepData: SleepDataPoint[] = sleepJson.session
        .map((s: any) => ({
          date: new Date(Number(s.startTimeMillis)),
          sleepHours: (Number(s.endTimeMillis) - Number(s.startTimeMillis)) / 3600000,
        })).filter((s: SleepDataPoint) => s.sleepHours > 0);
      setSleepData(formattedSleepData);

    } catch (e) {
      setError(e as Error);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  return { weightData, sleepData, isLoading, error, fetchData };
};