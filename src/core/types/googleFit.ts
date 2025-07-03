// src/core/types/googleFit.ts

// APIレスポンスのBucket構造
interface ApiBucket {
  startTimeMillis: string;
  endTimeMillis: string;
  dataset: {
    dataSourceId: string;
    point: ApiDataPoint[];
  }[];
}

// データポイントの基本構造
interface ApiDataPoint {
  startTimeNanos: string;
  endTimeNanos: string;
  dataTypeName: string;
  originDataSourceId: string;
  value: {
    fpVal?: number; // 体重などで使用
    intVal?: number; // 睡眠ステージなどで使用
  }[];
}

// 体重データAPIのレスポンス型
export interface WeightDataResponse {
  bucket: ApiBucket[];
}

// 睡眠セグメントAPIのレスポンス型
export interface SleepDataResponse {
  bucket: ApiBucket[];
}