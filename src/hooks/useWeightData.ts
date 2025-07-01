// src/hooks/useWeightData.ts
import { useState, useCallback } from 'react';

export interface WeightDataPoint {
  date: Date;
  weightKg: number;
}

interface WeightDataState {
  weightData: WeightDataPoint[];
  isLoading: boolean;
  error: Error | null;
  fetchWeightData: (startDate: Date, endDate: Date) => Promise<void>;
}

export const useWeightData = (accessToken: string | null): WeightDataState => {
  const [weightData, setWeightData] = useState<WeightDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchWeightData = useCallback(async (startDate: Date, endDate: Date) => {
    if (!accessToken) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aggregateBy: [{
            dataTypeName: "com.google.weight",
            dataSourceId: "derived:com.google.weight:com.google.android.gms:merge_weight"
          }],
          bucketByTime: { durationMillis: 86400000 },
          startTimeMillis: startDate.getTime(),
          endTimeMillis: endDate.getTime(),
        })
      });

      if (!response.ok) {
        throw new Error(`体重データの取得に失敗: ${response.statusText}`);
      }
      const data = await response.json();
      
      const formattedData: WeightDataPoint[] = data.bucket
       .map((b: any) => {
          const point = b.dataset[0]?.point[0];
          if (!point || !point.value || point.value.length === 0) return null;
          
          return {
            date: new Date(parseInt(b.startTimeMillis)),
            weightKg: point.value[0].fpVal,
          };
        })
       .filter((p: WeightDataPoint | null): p is WeightDataPoint => p !== null && p.weightKg > 0);

      setWeightData(formattedData);
    } catch (e) {
      setError(e as Error);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  return { weightData, isLoading, error, fetchWeightData };
};