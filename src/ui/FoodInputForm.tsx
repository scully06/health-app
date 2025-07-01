// src/ui/FoodInputForm.tsx
// src/ui/FoodInputForm.tsx
import React, { useState, useEffect } from 'react';
import { User } from '../core/models/User';
import { FoodRecord, MealType} from '../core/models/FoodRecord';
import type { MealTypeValue } from '../core/models/FoodRecord';
import type { RecordManager } from '../core/services/RecordManager';
import { cardStyle, inputStyle, buttonStyle } from './styles';
import { foodDatabaseService, type FoodDataItem } from '../core/services/FoodDatabaseService'; //【修正】

interface FoodInputFormProps {
  user: User;
  recordManager: RecordManager;
  onRecordSaved: () => void;
  currentDate: string;
}

export const FoodInputForm: React.FC<FoodInputFormProps> = ({ user, recordManager, onRecordSaved, currentDate }) => {
  const [mealType, setMealType] = useState<MealTypeValue>(MealType.BREAKFAST);
  const [description, setDescription] = useState('');
  const [calories, setCalories] = useState<string>('');
  const [grams, setGrams] = useState<string>('100');
  const [caloriesPer100g, setCaloriesPer100g] = useState<number | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<FoodDataItem[]>([]);
  const [isDbLoading, setIsDbLoading] = useState(true); //【追加】DB読み込み中フラグ

  //【追加】初回に一度だけデータベースを初期化する
  useEffect(() => {
    foodDatabaseService.initialize().then(() => {
      setIsDbLoading(false);
    });
  }, []);

  //【修正】検索ロジックをサービス呼び出しに変更
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    if (term.length > 1) {
      const results = foodDatabaseService.search(term);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };
  
  const handleSelectProduct = (food: FoodDataItem) => {
    setDescription(food.name);
    setCaloriesPer100g(food.calories);
    setGrams('100');
    setCalories(food.calories.toString());
    setSearchTerm('');
    setSearchResults([]);
  };

  // グラム数または100gあたりのカロリーが変更されたら、合計カロリーを再計算する
  useEffect(() => {
    if (caloriesPer100g === null || grams === '') {
      return;
    }
    const gramsValue = parseFloat(grams);
    if (isNaN(gramsValue)) {
      return;
    }
    const calculatedCalories = (caloriesPer100g / 100) * gramsValue;
    setCalories(Math.round(calculatedCalories).toString());
  }, [grams, caloriesPer100g]);

  // 合計カロリー欄を手動で編集した時の処理
  const handleCaloriesManualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCalories(e.target.value);
    setCaloriesPer100g(null); // 自動計算をオフにする
  };
  
  // 保存処理
  const handleSave = async () => {
    const caloriesValue = parseInt(calories, 10);
    if (!description || isNaN(caloriesValue) || caloriesValue < 0) {
      alert('内容と正しいカロリーを入力してください。');
      return;
    }
    
    const newRecord = new FoodRecord(
      `food-${Date.now()}`,
      user.id,
      new Date(currentDate),
      mealType,
      description,
      caloriesValue
    );
    
    await recordManager.saveRecord(newRecord);
    
    // フォームをリセット
    setDescription('');
    setCalories('');
    setGrams('100');
    setCaloriesPer100g(null);

    onRecordSaved();
  };

  return (
    <div style={cardStyle}>
      <h3 style={{ marginTop: 0, color: '#2c3e50' }}>食事を検索・記録</h3>
      
      <div style={{ marginBottom: '16px', position: 'relative' }}>
        <label>食品名で検索</label>
        <input 
          type="text" 
          value={searchTerm} 
          onChange={handleSearchChange} 
          style={inputStyle} 
          placeholder={isDbLoading ? "データベースを準備中..." : "例: とりむね, ごはん"}
          disabled={isDbLoading} // 準備中は入力を無効化
        />
        {searchResults.length > 0 && (
          <ul style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'white', border: '1px solid #ccc', listStyle: 'none', padding: 0, margin: '4px 0 0', zIndex: 10, borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
            {searchResults.map(item => (
              <li key={item.id} onClick={() => handleSelectProduct(item)} style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #eee' }}>
                {item.name} <span style={{ color: '#7f8c8d', fontSize: '12px' }}>({item.calories}kcal/100g)</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <hr style={{ margin: '24px 0', border: 0, borderTop: '1px solid #eee' }} />

      <div style={{ marginBottom: '16px' }}>
        <label>食事の区分</label>
        <select value={mealType} onChange={e => setMealType(e.target.value as MealTypeValue)} style={inputStyle}>
          {Object.values(MealType).map(type => <option key={type} value={type}>{type}</option>)}
        </select>
      </div>
      <div style={{ marginBottom: '16px' }}>
        <label>内容</label>
        <input type="text" value={description} onChange={e => setDescription(e.target.value)} style={inputStyle} placeholder="検索するか、手動で入力" />
      </div>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
        <div style={{ flex: 1 }}>
          <label>食べた量 (g)</label>
          <input type="number" value={grams} onChange={e => setGrams(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ flex: 1 }}>
          <label>合計カロリー (kcal)</label>
          <input type="number" value={calories} onChange={handleCaloriesManualChange} style={caloriesPer100g !== null ? {...inputStyle, backgroundColor: '#f0f0f0'} : inputStyle} />
        </div>
      </div>
      <button onClick={handleSave} style={buttonStyle}>この食事を記録</button>
    </div>
  );
};