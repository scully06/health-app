// src/core/services/AchievementManager.ts
import { FoodRecord } from '../models/FoodRecord';
import { HealthRecord } from '../models/HealthRecord';
import { SleepRecord } from '../models/SleepRecord';
import { WeightRecord } from '../models/WeightRecord';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string; // Emoji
}

// アプリで獲得できる実績の定義リスト
const ALL_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_step', title: 'はじめの一歩', description: '最初の健康記録を保存しました！', icon: '🎉' },
  { id: 'weight_watcher_1', title: '体重ウォッチャー', description: '体重を10回記録しました。', icon: '⚖️' },
  { id: 'weight_watcher_2', title: '体重マスター', description: '体重を30回記録しました。', icon: '🏆' },
  { id: 'foodie_1', title: '食の探求者', description: '食事を20回記録しました。', icon: '🍎' },
  { id: 'foodie_2', title: 'グルメ', description: '食事を50回記録しました。', icon: '🍱' },
  { id: 'sleep_pro', title: '睡眠のプロ', description: '睡眠を30回記録しました。', icon: '😴' },
  { id: 'consistent_logger', title: '継続は力なり', description: '7日間連続で記録をつけました。', icon: '🗓️' },
];

const STORAGE_KEY = 'health-app-unlocked-achievements';

export class AchievementManager {
  private unlockedAchievementIds: Set<string>;

  constructor() {
    this.unlockedAchievementIds = this.loadUnlockedAchievements();
    console.log('[AchievementManager] 実績管理者が起動しました。');
  }

  private loadUnlockedAchievements(): Set<string> {
    try {
      const storedData = localStorage.getItem(STORAGE_KEY);
      if (storedData) {
        return new Set(JSON.parse(storedData));
      }
    } catch (error) {
      console.error('解除済み実績の読み込みに失敗しました。', error);
    }
    return new Set();
  }

  private saveUnlockedAchievements(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(this.unlockedAchievementIds)));
    } catch (error) {
      console.error('解除済み実績の保存に失敗しました。', error);
    }
  }

  /**
   * 現在の記録データから、新たに達成された実績をチェックして返す
   * @param records 全ての健康記録
   * @returns 新たに解除された実績の配列
   */
  public checkAchievements(records: HealthRecord[]): Achievement[] {
    const newlyUnlocked: Achievement[] = [];

    if (records.length === 0) {
      return [];
    }

    for (const achievement of ALL_ACHIEVEMENTS) {
      if (this.unlockedAchievementIds.has(achievement.id)) {
        continue; // すでに解除済みならスキップ
      }

      let isAchieved = false;
      switch (achievement.id) {
        case 'first_step':
          isAchieved = records.length >= 1;
          break;
        case 'weight_watcher_1':
          isAchieved = records.filter(r => r instanceof WeightRecord).length >= 10;
          break;
        case 'weight_watcher_2':
          isAchieved = records.filter(r => r instanceof WeightRecord).length >= 30;
          break;
        // 【追加】食事と睡眠の実績判定ロジック
        case 'foodie_1':
          isAchieved = records.filter(r => r instanceof FoodRecord).length >= 20;
          break;
        case 'foodie_2':
          isAchieved = records.filter(r => r instanceof FoodRecord).length >= 50;
          break;
        case 'sleep_pro':
          isAchieved = records.filter(r => r instanceof SleepRecord).length >= 30;
          break;
        // 【追加】7日間連続記録の判定ロジック
        case 'consistent_logger': {
          const uniqueDates = [
            ...new Set(
              records.map(r => new Date(r.date).toISOString().split('T')[0])
            ),
          ].map(d => new Date(d));
          uniqueDates.sort((a, b) => a.getTime() - b.getTime());

          if (uniqueDates.length >= 7) {
            let consecutiveDays = 1;
            for (let i = 1; i < uniqueDates.length; i++) {
              const diffTime = uniqueDates[i].getTime() - uniqueDates[i - 1].getTime();
              const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
              if (diffDays === 1) {
                consecutiveDays++;
              } else if (diffDays > 1) {
                consecutiveDays = 1; // 連続が途切れたらリセット
              }
              if (consecutiveDays >= 7) {
                isAchieved = true;
                break;
              }
            }
          }
          break;
        }
      }

      if (isAchieved) {
        this.unlockedAchievementIds.add(achievement.id);
        newlyUnlocked.push(achievement);
      }
    }

    if (newlyUnlocked.length > 0) {
      this.saveUnlockedAchievements();
    }

    return newlyUnlocked;
  }

  /**
   * 解除済みのすべての実績を返す
   */
  public getUnlockedAchievements(): Achievement[] {
    return ALL_ACHIEVEMENTS.filter(ach => this.unlockedAchievementIds.has(ach.id));
  }
}
