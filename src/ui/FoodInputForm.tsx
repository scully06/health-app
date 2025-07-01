// src/ui/FoodInputForm.tsx
import React, { useState } from 'react';
import { User } from '../core/models/User';
import { FoodRecord, MealType} from '../core/models/FoodRecord';
import type {MealTypeValue} from '../core/models/FoodRecord';
import type { RecordManager } from '../core/services/RecordManager';
import { cardStyle, inputStyle, buttonStyle } from './styles';

interface FoodInputFormProps {
  user: User;
  recordManager: RecordManager;
  onRecordSaved: () => void;
  currentDate: string; // 親から日付を受け取る
}

export const FoodInputForm: React.FC<FoodInputFormProps> = ({ user, recordManager, onRecordSaved, currentDate }) => {
  const [mealType, setMealType] = useState<MealTypeValue>(MealType.BREAKFAST);
  const [description, setDescription] = useState('');
  const [calories, setCalories] = useState<string>('');

  const handleSave = async () => {
    const caloriesValue = parseInt(calories, 10);
    if (!description || isNaN(caloriesValue) || caloriesValue < 0) {
      alert('内容と正しいカロリーを入力してください。');
      return;
    }
    
    // IDはユニークにするために現在時刻のミリ秒を使う
    const newRecord = new FoodRecord(
      `food-${Date.now()}`,
      user.id,
      new Date(currentDate),
      mealType,
      description,
      caloriesValue
    );
    
    await recordManager.saveRecord(newRecord);

    // 保存後にフォームをリセット
    setDescription('');
    setCalories('');
    
    // 親コンポーネントに保存完了を通知
    onRecordSaved();
  };

  return (
    <div style={cardStyle}>
      <h3 style={{ marginTop: 0, color: '#2c3e50' }}>食事を記録</h3>
      <div style={{ marginBottom: '16px' }}>
        <label>食事の区分</label>
        <select value={mealType} onChange={e => setMealType(e.target.value as MealTypeValue)} style={inputStyle}>
          {Object.values(MealType).map(type => <option key={type} value={type}>{type}</option>)}
        </select>
      </div>
      <div style={{ marginBottom: '16px' }}>
        <label>内容</label>
        <input type="text" value={description} onChange={e => setDescription(e.target.value)} style={inputStyle} placeholder="例: 鶏胸肉のサラダ" />
      </div>
      <div style={{ marginBottom: '16px' }}>
        <label>カロリー (kcal)</label>
        <input type="number" value={calories} onChange={e => setCalories(e.target.value)} style={inputStyle} placeholder="例: 350" />
      </div>
      <button onClick={handleSave} style={buttonStyle}>この食事を記録</button>
    </div>
  );
};