// src/core/models/FoodRecord.ts
import { HealthRecord } from './HealthRecord';

// 食事の区分を定義 (外部からも使えるようにexport)
export const MealType = {
  BREAKFAST: '朝食',
  LUNCH: '昼食',
  DINNER: '夕食',
  SNACK: '間食',
} as const;

// 型定義もexport
export type MealTypeKey = keyof typeof MealType;
export type MealTypeValue = typeof MealType[MealTypeKey];

/**
 * HealthRecordを継承した、具体的な「食事記録」クラス。
 */
export class FoodRecord extends HealthRecord {
  public mealType: MealTypeValue; // 食事の区分
  public description: string;    // 食べたものの内容 (例: ラーメン、サラダ)
  public calories: number;       // カロリー (kcal)

  constructor(
    id: string,
    userId: string,
    date: Date,
    mealType: MealTypeValue,
    description: string,
    calories: number
  ) {
    super(id, userId, date);
    this.mealType = mealType;
    this.description = description;
    this.calories = calories;
  }
}