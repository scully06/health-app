// src/ui/ViewController.ts
import type { IAnalysisEngine } from '../core/services/interfaces/IAnalysisEngine';
import type { IRecordManager } from '../core/services/interfaces/IRecordManager';
import { User } from '../core/models/User';

/**
 * ユーザーとのやり取り（UI）を担当するクラス。
 * 必要なサービス（専門家）への指示を出す司令塔の役割。
 */
export class ViewController {
  private user: User;
  private recordManager: IRecordManager;
  private analysisEngine: IAnalysisEngine;

  constructor(
    user: User,
    recordManager: IRecordManager,
    analysisEngine: IAnalysisEngine
  ) {
    this.user = user;
    this.recordManager = recordManager;
    this.analysisEngine = analysisEngine;
    console.log(`[ViewController] 画面担当が起動しました。担当ユーザー: ${user.name}`);
  }

  public display(): void {
    console.log(`[ViewController] 画面を表示します...`);
    // --- フェーズ2以降で、Reactコンポーネントの描画ロジックを実装 ---
  }

  public handleUserInput(): void {
    console.log(`[ViewController] ユーザー入力を処理します...`);
    // --- フェーズ2以降で、ボタンクリックなどのイベント処理を実装 ---
    // 例: this.recordManager.saveRecord(...) を呼び出す
  }
}