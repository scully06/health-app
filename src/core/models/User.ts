// src/core/models/User.ts

export class User {
  public readonly id: string;
  public name: string;
  public height: number; // メートル単位

  constructor(id: string, name: string, height: number) {
    this.id = id;
    this.name = name;
    this.height = height;
    console.log(`[User] Userオブジェクトが作成されました: ${this.name}`);
  }
}