// src/core/services/FoodDatabaseService.ts
import * as XLSX from 'xlsx';

export interface FoodDataItem {
  id: number;
  name: string;
  calories: number;
}

class FoodDatabaseService {
  private foodData: FoodDataItem[] = [];
  // 初期化が完了したか、あるいは進行中かを管理するフラグ
  private initializePromise: Promise<void> | null = null;

  // 初期化処理。一度だけ実行されるように制御する
  public initialize(): Promise<void> {
    if (!this.initializePromise) {
      console.log('[FoodDatabaseService] 初期化を開始します...');
      this.initializePromise = this.loadAndParseExcel();
    }
    return this.initializePromise;
  }

  private async loadAndParseExcel(): Promise<void> {
    try {
      // publicフォルダにあるExcelファイルをfetchで取得
      const response = await fetch('/20230428-mxt_kagsei-mext_00001_012.xlsx'); // publicフォルダ内のファイル名
      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'buffer' });

      // 最初のシートを対象とする (必要に応じて変更)
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // シートをヘッダー付きのJSONに変換
      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

      // データを整形してキャッシュ
      //【重要】Excelのヘッダー名に合わせて、ここのキーを正確に指定してください
      this.foodData = jsonData
        .map(row => ({
          id: Number(row['食品番号']),
          name: String(row['食品名']),
          calories: Number(row['エネルギー\n（kcal）']), // ヘッダーが改行を含んでいる場合も考慮
        }))
        .filter(item => item.name && !isNaN(item.calories)); // 不正なデータを除外

      console.log(`[FoodDatabaseService] ${this.foodData.length}件の食品データを初期化しました。`);
    } catch (error) {
      console.error('[FoodDatabaseService] 食品データベースの読み込みまたは解析に失敗しました。', error);
      // エラーが発生してもアプリがクラッシュしないようにする
      this.foodData = [];
    }
  }

  // 検索メソッド
  public search(term: string): FoodDataItem[] {
    if (this.foodData.length === 0 || term.length < 2) return [];

    const normalizedTerm = term.toLowerCase().normalize("NFKC");
    return this.foodData
      .filter(item => item.name.toLowerCase().normalize("NFKC").includes(normalizedTerm))
      .slice(0, 10); // 候補を10件に制限
  }
}

// シングルトンインスタンスとしてエクスポート
export const foodDatabaseService = new FoodDatabaseService();