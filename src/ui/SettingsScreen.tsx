// src/ui/SettingsScreen.tsx
import React, { useState, useRef } from 'react';
import { User } from '../core/models/User';
import { cardStyle, inputStyle, buttonStyle } from './styles';
import { HealthRecord } from '../core/models/HealthRecord';

interface SettingsScreenProps {
  user: User;
  onBack: () => void;
  onSettingsChange: (settings: { height: number; targetWeight?: number; targetCalories?: number }) => void;
  // 【追加】
  allRecords: HealthRecord[];
  onImportData: (records: HealthRecord[]) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ user, onBack, onSettingsChange, allRecords, onImportData }) => {
  const [height, setHeight] = useState((user.height * 100).toString());
  const [targetWeight, setTargetWeight] = useState(user.targetWeight?.toString() || '');
  const [targetCalories, setTargetCalories] = useState(user.targetCalories?.toString() || '');
  const [feedback, setFeedback] = useState('');
  // 【追加】ファイルインポート用の隠しinputへの参照
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    // ... (既存の保存ロジックは変更なし)
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
    onSettingsChange({
      height: heightValueCm / 100,
      targetWeight: targetWeightValue,
      targetCalories: targetCaloriesValue,
    });
    setFeedback('設定を更新しました！');
    setTimeout(() => setFeedback(''), 3000);
  };
  
  // 【追加】エクスポート処理
  const handleExport = () => {
    if (allRecords.length === 0) {
      alert('エクスポートする記録がありません。');
      return;
    }
    // データをJSON形式の文字列に変換
    const jsonData = JSON.stringify(allRecords, null, 2);
    // Blobオブジェクトを作成
    const blob = new Blob([jsonData], { type: 'application/json' });
    // ダウンロード用のURLを生成
    const url = URL.createObjectURL(blob);
    // aタグを作成してクリックさせ、ダウンロードを実行
    const link = document.createElement('a');
    link.href = url;
    link.download = `health-app-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    // 後片付け
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setFeedback('データをエクスポートしました。');
  };
  
  // 【追加】インポートボタンのクリック処理
  const handleImportClick = () => {
    // 隠したファイルinputをクリック
    fileInputRef.current?.click();
  };

  // 【追加】ファイルが選択された時の処理
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!window.confirm('現在のすべての記録が上書きされます。よろしいですか？')) {
      // inputをリセット
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') throw new Error('File content is not a string');
        const importedRecords = JSON.parse(text);
        // Appコンポーネントに処理を依頼
        onImportData(importedRecords);
      } catch (error) {
        alert('ファイルの読み込みに失敗しました。JSON形式が正しくない可能性があります。');
        console.error(error);
      }
      // inputをリセット
      event.target.value = '';
    };
    reader.readAsText(file);
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
        {/* ... (身長・目標設定フォームは変更なし) ... */}
        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="height-input">身長 (cm)</label>
          <input id="height-input" type="number" step="1" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="例: 175" style={inputStyle} />
        </div>
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
        <button onClick={handleSave} style={buttonStyle}>設定を保存</button>
      </div>

      {/* 【追加】データ管理セクション */}
      <hr style={{ margin: '24px 0', border: 0, borderTop: '1px solid #eee' }} />
      <h3 style={{ marginTop: 0, color: '#2c3e50' }}>データ管理</h3>
      <div style={{display: 'flex', gap: '16px'}}>
          <button onClick={handleImportClick} style={{...buttonStyle, backgroundColor: '#3498db'}}>インポート</button>
          <button onClick={handleExport} style={{...buttonStyle, backgroundColor: '#2ecc71'}}>エクスポート</button>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        accept="application/json"
      />

      {feedback && <p style={{ marginTop: '12px', color: feedback.startsWith('エラー') ? '#e74c3c' : '#27ae60' }}>{feedback}</p>}
    </div>
  );
};