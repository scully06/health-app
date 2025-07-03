// src/ui/SettingsScreen.tsx
import React, { useState } from 'react';
import { User } from '../core/models/User';
import { cardStyle, inputStyle, buttonStyle } from './styles';

interface SettingsScreenProps {
  user: User;
  onBack: () => void; // メイン画面に戻るための関数
  onHeightChange: (newHeight: number) => void; // 身長を更新するための関数
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ user, onBack, onHeightChange }) => {
  // 【変更】propsから受け取った身長(m)をcmに変換して初期値として設定
  const [height, setHeight] = useState((user.height * 100).toString());
  const [feedback, setFeedback] = useState('');

  const handleSave = () => {
    const heightValueCm = parseFloat(height);
    // 【変更】より厳格なバリデーションを追加
    const MIN_HEIGHT = 50; // cm
    const MAX_HEIGHT = 300; // cm
    if (isNaN(heightValueCm) || heightValueCm < MIN_HEIGHT || heightValueCm > MAX_HEIGHT) {
      setFeedback(`エラー: 身長は${MIN_HEIGHT}cmから${MAX_HEIGHT}cmの間で入力してください。`);
      return;
    }

    // 【変更】cmで入力された値をmに変換して親コンポーネントに渡す
    onHeightChange(heightValueCm / 100);
    setFeedback('身長を更新しました！');

    // 3秒後にフィードバックを消す
    setTimeout(() => {
      setFeedback('');
    }, 3000);
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
          {/* 【変更】ラベル、step、placeholderをcm単位に修正 */}
          <label htmlFor="height-input">身長 (cm)</label>
          <input
            id="height-input"
            type="number"
            step="1"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder="例: 175"
            style={inputStyle}
          />
        </div>
        <button onClick={handleSave} style={buttonStyle}>
          身長を保存
        </button>
        {feedback && <p style={{ marginTop: '12px', color: feedback.startsWith('エラー') ? '#e74c3c' : '#27ae60' }}>{feedback}</p>}
      </div>
    </div>
  );
};