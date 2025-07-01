// src/core/services/FoodDatabaseService.ts
import * as XLSX from 'xlsx';
// publicフォルダにあるExcelファイルのURLをViteの機能を使って取得
import foodDataUrl from '/20230428-mxt_kagsei-mext_00001_012.xlsx?url';

export interface FoodDataItem {
  id: number;
  name: string;
  calories: number;
}

class FoodDatabaseService {
  private foodData: FoodDataItem[] = [];
  private initializePromise: Promise<void> | null = null;

  // 初期化処理。アプリ起動時に一度だけ実行されることを保証する
  public initialize(): Promise<void> {
    if (!this.initializePromise) {
      console.log('[FoodDatabaseService] 初期化を開始します...');
      this.initializePromise = this.loadAndParseExcel();
    }
    return this.initializePromise;
  }

  // Excelファイルを非同期で読み込み、解析してメモリにキャッシュするメソッド
  private async loadAndParseExcel(): Promise<void> {
    try {
      const response = await fetch(foodDataUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch Excel file: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0]; // 最初のシートを対象とする
      const worksheet = workbook.Sheets[sheetName];
      
      // ヘッダーを無視し、指定した範囲のデータを配列の配列として取得する
      const data: any[][] = XLSX.utils.sheet_to_json(worksheet, {
        header: 1, // ヘッダーを自動認識せず、生の配列としてデータを取得
        range: 'A13:Z3000' //【調整ポイント】データが始まる行から十分な終わりまでを指定
      });

      // 取得した生の配列データを、扱いやすいオブジェクトの配列に変換する
      this.foodData = data
        .map(row => {
          //【調整ポイント】列番号（インデックス）でデータを指定
          const foodId = row[1];      // C列: 食品番号
          const foodName = row[3];    // E列: 食品名
          const calories = row[6];    // H列: エネルギー(kcal)

          // 必須のデータが存在し、かつ数値データが有効かチェック
          if (foodId && foodName && calories && !isNaN(Number(calories))) {
            return {
              id: Number(foodId),
              name: String(foodName),
              calories: Number(calories),
            };
          }
          return null; // データが不完全な行はnullを返す
        })
        .filter((item): item is FoodDataItem => item !== null); // nullになった行を最終的なデータから除外

      if (this.foodData.length === 0) {
        console.warn('[FoodDatabaseService] Excelから食品データを抽出できませんでした。ファイルの範囲や列のインデックスが正しいか確認してください。');
      }
      console.log(`[FoodDatabaseService] ${this.foodData.length}件の食品データを初期化しました。`);
      
    } catch (error) {
      console.error('[FoodDatabaseService] 食品データベースの読み込みまたは解析に失敗しました。', error);
      this.foodData = []; // エラー時もアプリがクラッシュしないように空にする
    }
  }

  // メモリにキャッシュされた食品データから検索を行うメソッド
  public search(term: string): FoodDataItem[] {
    if (this.foodData.length === 0 || term.length < 1) {
      return [];
    }

    // 全角/半角、大文字/小文字を区別せずに検索するための正規化処理
    const normalizedTerm = term
      .toLowerCase()
      .trim()
      .normalize("NFKC");

    if (!normalizedTerm) return [];

    // データベースの各食品名も同様に正規化してから比較
    const results = this.foodData.filter(item => {
      const normalizedItemName = item.name.toLowerCase().normalize("NFKC");
      return normalizedItemName.includes(normalizedTerm);
    });

    return results.slice(0, 10); // 検索結果が多すぎないように10件に制限して返す
  }
}

// アプリ全体で共有するシングルトンインスタンスとしてエクスポート
export const foodDatabaseService = new FoodDatabaseService();