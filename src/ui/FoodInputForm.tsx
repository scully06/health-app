// src/ui/FoodInputForm.tsx
import React, { useState, useEffect } from 'react';
import { User } from '../core/models/User';
import { FoodRecord, MealType, type MealTypeValue } from '../core/models/FoodRecord';
import type { RecordManager } from '../core/services/RecordManager';
import { cardStyle, inputStyle, buttonStyle } from './styles';
import { foodDatabaseService, type FoodDataItem } from '../core/services/FoodDatabaseService';
import { HealthRecord } from '../core/models/HealthRecord';

interface FoodInputFormProps {
  user: User;
  recordManager: RecordManager;
  onRecordSaved: () => void;
  currentDate: string;
  editingRecord: HealthRecord | null;
}

export const FoodInputForm: React.FC<FoodInputFormProps> = ({ user, recordManager, onRecordSaved, currentDate, editingRecord }) => {
  const [mealType, setMealType] = useState<MealTypeValue>(MealType.BREAKFAST);
  const [description, setDescription] = useState('');
  const [calories, setCalories] = useState<string>('');
  const [grams, setGrams] = useState<string>('100');
  const [caloriesPer100g, setCaloriesPer100g] = useState<number | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<FoodDataItem[]>([]);
  const [isDbLoading, setIsDbLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    foodDatabaseService.initialize().then(() => {
      setIsDbLoading(false);
      console.log('[FoodInputForm] データベースの準備が完了しました。');
    });
  }, []);
  
  useEffect(() => {
    if (editingRecord && editingRecord instanceof FoodRecord) {
      setMealType(editingRecord.mealType);
      setDescription(editingRecord.description);
      setCalories(editingRecord.calories.toString());
      setGrams('100'); //グラムはリセット
      setCaloriesPer100g(null); // 自動計算はオフ
      setSearchTerm('');
      setSearchResults([]);
      setIsEditing(true);
    } else {
      // 編集モードが解除されたらフォームをリセット
      setIsEditing(false);
      setDescription('');
      setCalories('');
    }
  }, [editingRecord]);

  useEffect(() => {
    if (isDbLoading || searchTerm.length < 1) {
      setSearchResults([]);
      return;
    }
    const results = foodDatabaseService.search(searchTerm);
    setSearchResults(results);
  }, [searchTerm, isDbLoading]);

  const handleSelectProduct = (food: FoodDataItem) => {
    setDescription(food.name);
    setCaloriesPer100g(food.calories);
    setGrams('100');
    setCalories(food.calories.toString());
    setSearchTerm('');
    setSearchResults([]);
  };
  
  useEffect(() => {
    if (caloriesPer100g === null || grams === '') return;
    const gramsValue = parseFloat(grams);
    if (isNaN(gramsValue)) return;
    const calculatedCalories = (caloriesPer100g / 100) * gramsValue;
    setCalories(Math.round(calculatedCalories).toString());
  }, [grams, caloriesPer100g]);

  const handleCaloriesManualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCalories(e.target.value);
    setCaloriesPer100g(null);
  };

  const handleSave = async () => {
    const gramsValue = parseFloat(grams);
    const caloriesValue = parseInt(calories, 10);

    if (!description.trim()) {
      alert('内容を入力してください。');
      return;
    }
    if (isNaN(gramsValue) || gramsValue <= 0) {
      alert('食べた量には0より大きい数値を入力してください。');
      return;
    }
    if (isNaN(caloriesValue) || caloriesValue < 0) {
      alert('合計カロリーには0以上の数値を入力してください。');
      return;
    }

    const recordId = isEditing && editingRecord ? editingRecord.id : `food-${Date.now()}`;
    const newRecord = new FoodRecord(
      recordId,
      user.id,
      new Date(currentDate),
      mealType,
      description.trim(),
      caloriesValue
    );
    
    await recordManager.saveRecord(newRecord);
    
    setDescription('');
    setCalories('');
    setGrams('100');
    setCaloriesPer100g(null);

    onRecordSaved();
  };

  return (
    <div style={isEditing ? {...cardStyle, border: '2px solid #3498db'} : cardStyle}>
      <h3 style={{ marginTop: 0, color: '#2c3e50' }}>{isEditing ? '食事を編集' : '食事を検索・記録'}</h3>
      
      <div style={{ marginBottom: '16px', position: 'relative' }}>
        <label>食品名で検索</label>
        <input 
          type="text" 
          value={searchTerm} 
          onChange={e => setSearchTerm(e.target.value)}
          style={inputStyle} 
          placeholder={isDbLoading ? "データベースを準備中..." : "例: とりむね, ごはん"}
          disabled={isDbLoading}
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
          <input 
            type="number" 
            value={grams} 
            onChange={e => setGrams(e.target.value)} 
            style={inputStyle} 
            min="1"
          />
        </div>
        <div style={{ flex: 1 }}>
          <label>合計カロリー (kcal)</label>
          <input 
            type="number" 
            value={calories} 
            onChange={handleCaloriesManualChange} 
            style={caloriesPer100g !== null ? {...inputStyle, backgroundColor: '#f0f0f0'} : inputStyle}
            min="0"
          />
        </div>
      </div>
      <button onClick={handleSave} style={buttonStyle}>{isEditing ? '更新する' : 'この食事を記録'}</button>
    </div>
  );
};