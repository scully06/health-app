// src/ui/SettingsScreen.tsx
import React, { useState } from 'react';
import { User } from '../core/models/User';
import { cardStyle, inputStyle, buttonStyle } from './styles';

interface SettingsScreenProps {
  user: User;
  onBack: () => void;
  // 【確認】propsの型定義
  onSettingsChange: (settings: { height: number; targetWeight?: number; targetCalories?: number }) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ user, onBack, onSettingsChange }) => {
  const [height, setHeight] = useState((user.height * 100).toString());
  const [targetWeight, setTargetWeight] = useState(user.targetWeight?.toString() || '');
  const [targetCalories, setTargetCalories] = useState(user.targetCalories?.toString() || '');
  const [feedback, setFeedback] = useState('');

  const handleSave = () => {
    const heightValueCm = parseFloat(height);
    const MIN_HEIGHT = 50;
    const MAX_HEIGHT = 300;
    if (isNaN(heightValueCm) || heightValueCm < MIN_HEIGHT || heightValueCm > MAX_HEIGHT) {
      setFeedback(`エラー: 身長は${MIN_HEIGHT}cmから${MAX_HEIGHT}cmの間で入力してください。`);
      return;
    }

    const targetWeightValue = targetWeight ? parseFloat(targetWeight) : undefined;
    if (targetWeightValue !== undefined && (isNaN(targetWeightValue) || targetWeightValue <= 0)) {
        setFeedback('エラー: 正しい目標体重を入力してください。');
        return;
    }
    
    const targetCaloriesValue = targetCalories ? parseInt(targetCalories, 10) : undefined;
    if (targetCaloriesValue !== undefined && (isNaN(targetCaloriesValue) || targetCaloriesValue < 0)) {
        setFeedback('エラー: 正しい目標カロリーを入力してください。');
        return;
    }

    // 【確認】設定変更を親コンポーネントに通知
    onSettingsChange({
      height: heightValueCm / 100,
      targetWeight: targetWeightValue,
      targetCalories: targetCaloriesValue,
    });
    
    setFeedback('設定を更新しました！');
    setTimeout(() => setFeedback(''), 3000);
  };

  return (
    <div style={{ ...cardStyle, maxWidth: '600px', margin: '40px auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
        <button onClick={onBack} style={{ ...buttonStyle, width: 'auto', padding: '8px 16px', marginTop: 0, marginRight: '16px', backgroundColor: '#7f8c8d' }}>
          ← 戻る
        </button>
        <h2 style={{ margin: 0 }}>設定</h2>
      </div>

      <div>
        <h3 style={{ marginTop: 0, color: '#2c3e50' }}>ユーザー情報</h3>
        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="height-input">身長 (cm)</label>
          <input id="height-input" type="number" step="1" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="例: 175" style={inputStyle} />
        </div>
        
        {/* 【確認】目標設定フォーム */}
        <hr style={{ margin: '24px 0', border: 0, borderTop: '1px solid #eee' }} />
        <h3 style={{ marginTop: 0, color: '#2c3e50' }}>目標設定</h3>
        <div style={{ marginBottom: '16px' }}>
            <label htmlFor="target-weight-input">目標体重 (kg)</label>
            <input id="target-weight-input" type="number" step="0.1" value={targetWeight} onChange={e => setTargetWeight(e.target.value)} placeholder="未設定" style={inputStyle} />
        </div>
        <div style={{ marginBottom: '16px' }}>
            <label htmlFor="target-calories-input">1日の目標摂取カロリー (kcal)</label>
            <input id="target-calories-input" type="number" step="10" value={targetCalories} onChange={e => setTargetCalories(e.target.value)} placeholder="未設定" style={inputStyle} />
        </div>

        <button onClick={handleSave} style={buttonStyle}>
          設定を保存
        </button>
        {feedback && <p style={{ marginTop: '12px', color: feedback.startsWith('エラー') ? '#e74c3c' : '#27ae60' }}>{feedback}</p>}
      </div>
    </div>
  );
};