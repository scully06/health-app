// src/core/models/HealthRecord.ts

/**
 * すべての健康記録の基盤となる抽象クラス。
 * 「健康記録とは、ユーザーIDと日付を持つものである」というルールを定義する。
 */
export abstract class HealthRecord {
  public readonly id: string;
  public readonly userId: string;
  public date: Date;

  constructor(id: string, userId: string, date: Date) {
    this.id = id;
    this.userId = userId;
    this.date = date;
  }
}