// src/core/models/User.ts

export class User {
  public readonly id: string;
  public name: string;
  public height: number; // メートル単位
  
  // 【確認】目標体重と目標カロリーのプロパティ
  public targetWeight?: number;
  public targetCalories?: number;

  constructor(
    id: string, 
    name: string, 
    height: number,
    targetWeight?: number,
    targetCalories?: number
  ) {
    this.id = id;
    this.name = name;
    this.height = height;
    this.targetWeight = targetWeight;
    this.targetCalories = targetCalories;
    console.log(`[User] Userオブジェクトが作成/更新されました: ${this.name}`);
  }
}