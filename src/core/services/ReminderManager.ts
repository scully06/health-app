// src/core/services/ReminderManager.ts

export interface ReminderSettings {
  isEnabled: boolean;
  time: string; // "HH:MM" 形式 (例: "21:00")
}

export class ReminderManager {
  private readonly STORAGE_KEY = 'health-app-reminder-settings';
  private settings: ReminderSettings;
  private timerId: number | null = null;

  constructor() {
    this.settings = this.loadSettings();
    console.log('[ReminderManager] リマインダー管理者が起動しました。設定:', this.settings);
    this.setupTimer();
  }

  // 設定をlocalStorageから読み込む
  private loadSettings(): ReminderSettings {
    try {
      const storedData = localStorage.getItem(this.STORAGE_KEY);
      if (storedData) {
        return JSON.parse(storedData);
      }
    } catch (error) {
      console.error('[ReminderManager] 設定の読み込みに失敗しました。', error);
    }
    // デフォルト設定
    return { isEnabled: false, time: '21:00' };
  }

  // 設定をlocalStorageに保存する
  public saveSettings(newSettings: ReminderSettings): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(newSettings));
      this.settings = newSettings;
      console.log('[ReminderManager] 設定を保存しました。', this.settings);
      this.setupTimer(); // 設定が変更されたらタイマーを再設定
    } catch (error) {
      console.error('[ReminderManager] 設定の保存に失敗しました。', error);
    }
  }

  // 現在の設定を取得する
  public getSettings(): ReminderSettings {
    return this.settings;
  }

  // 定期チェックのタイマーを設定/解除する
  private setupTimer(): void {
    // 既存のタイマーがあればクリア
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }

    // リマインダーがオフなら何もしない
    if (!this.settings.isEnabled) {
      console.log('[ReminderManager] リマインダーは無効です。');
      return;
    }

    console.log(`[ReminderManager] リマインダータイマーを設定しました。(${this.settings.time})`);
    // 1分ごとにチェックするタイマーを開始
    this.timerId = window.setInterval(() => {
      this.checkTimeAndNotify();
    }, 60 * 1000); // 60秒 * 1000ミリ秒
  }

  // 時刻をチェックして通知を出す
  private checkTimeAndNotify(): void {
    const now = new Date();
    const [hours, minutes] = this.settings.time.split(':');
    
    // 現在時刻が設定時刻と一致するかチェック
    if (now.getHours() === parseInt(hours) && now.getMinutes() === parseInt(minutes)) {
      console.log('[ReminderManager] 通知時間です！');
      this.showNotification();
    }
  }

  // ブラウザ通知を表示する
  private showNotification(): void {
    // 1. 通知の権限があるか確認
    if (!('Notification' in window)) {
      alert('このブラウザはデスクトップ通知に対応していません。');
      return;
    }

    // 2. 権限が許可されている場合のみ通知を表示
    if (Notification.permission === 'granted') {
      new Notification('健康管理リマインダー', {
        body: '今日の体重を記録しましょう！',
        icon: '/vite.svg' // publicフォルダにあるアイコンなどを指定
      });
    } else if (Notification.permission !== 'denied') {
      // 3. 権限がまだない場合、許可を求める
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          this.showNotification(); // 許可されたら再度通知を試みる
        }
      });
    }
  }
}