// src/hooks/useWeightData.ts
import { useState, useEffect, useCallback } from 'react';

// このフックが返すデータの型を定義
export interface WeightDataPoint {
  date: Date;
  weightKg: number;
}

interface WeightDataState {
  weightData: WeightDataPoint[];
  isLoading: boolean;
  error: Error | null;
  fetchData: () => void; // 手動でデータ更新をトリガーするための関数
}

export const useWeightData = (accessToken: string | null): WeightDataState => {
  const [weightData, setWeightData] = useState<WeightDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    // アクセストークンがなければ何もしない
    if (!accessToken) {
      setWeightData([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(endDate.getMonth() - 1); // 過去1ヶ月のデータを対象

      const response = await fetch('https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          aggregateBy: [{
            dataTypeName: "com.google.weight",
            dataSourceId: "derived:com.google.weight:com.google.android.gms:merge_weight"
          }],
          bucketByTime: { durationMillis: 86400000 }, // 1日ごとに集計
          startTimeMillis: startDate.getTime(),
          endTimeMillis: endDate.getTime(),
        })
      });

      if (!response.ok) {
        throw new Error(`体重データの取得に失敗しました: ${response.statusText}`);
      }
      const data = await response.json();
      
      const formattedData: WeightDataPoint[] = data.bucket
       .map((b: any) => {
          // データポイントが存在するかを安全にチェック
          const point = b.dataset[0]?.point[0];
          if (!point || !point.value || point.value.length === 0) return null;
          
          return {
            date: new Date(parseInt(b.startTimeMillis)),
            weightKg: point.value[0].fpVal,
          };
        })
       .filter((p: WeightDataPoint | null): p is WeightDataPoint => p !== null && p.weightKg > 0); // 不正なデータや0kgのデータを除外

      setWeightData(formattedData);
    } catch (e) {
      setError(e as Error);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]); // accessTokenが変更された時のみ関数を再生成

  return { weightData, isLoading, error, fetchData };
};