// src/ui/WeightInputForm.tsx

import React, { useState } from 'react';
import { User } from '../core/models/User';
import { WeightRecord } from '../core/models/WeightRecord';
import type { RecordManager } from '../core/services/RecordManager';
import type { AnalysisEngine } from '../core/services/AnalysisEngine';
import { cardStyle, inputStyle, buttonStyle } from './styles';

// --- Propsの型定義を修正 ---
interface WeightInputFormProps {
  user: User;
  recordManager: RecordManager;
  analysisEngine: AnalysisEngine;
  onRecordSaved: () => void; //【追加】保存成功を通知する関数の型
}

export const WeightInputForm: React.FC<WeightInputFormProps> = ({
  user,
  recordManager,
  analysisEngine,
  onRecordSaved, //【追加】Propsから関数を受け取る
}) => {
  // (Stateの定義は変更なし)
  const [weight, setWeight] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');

  const handleSaveClick = async () => {
    // (バリデーション、オブジェクト生成は変更なし)
    const weightValue = parseFloat(weight);
    if (isNaN(weightValue) || weightValue <= 0) {
      setFeedbackMessage('エラー: 正しい体重を入力してください。');
      return;
    }
    const newRecord = new WeightRecord(
      `rec-${Date.now()}`, // 1. 一意なIDを生成
      user.id,             // 2. 現在のユーザーのID
      new Date(date),      // 3. 入力された日付
      weightValue          // 4. 入力された体重
    );

    try {
      await recordManager.saveRecord(newRecord);
      const bmi = analysisEngine.calculateBMI(newRecord.weight, user.height);
      const bmiFeedback = bmi !== null ? `あなたのBMIは ${bmi} です。` : '';
      setFeedbackMessage(`保存しました！ ${bmiFeedback}`);
      setWeight('');

      //【追加】親コンポーネントに保存成功を通知する
      onRecordSaved();

    } catch (error) {
      console.error(error);
      setFeedbackMessage('エラー: 保存に失敗しました。');
    }
  };

  // --- UIの描画 (View) ---
  return (
    <div style={cardStyle}>
      <h3 style={{ marginTop: 0, color: '#2c3e50' }}>体重を記録</h3>
      <div style={{ marginBottom: '16px' }}>
        <label htmlFor="date-input-weight">日付</label>
        <input id="date-input-weight" type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
      </div>
      <div style={{ marginBottom: '16px' }}>
        <label htmlFor="weight-input">体重 (kg)</label>
        <input id="weight-input" type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="例: 65.5" style={inputStyle} />
      </div>
      <button onClick={handleSaveClick} style={buttonStyle}>保存する</button>
      {feedbackMessage && <p style={{ marginTop: '12px', color: feedbackMessage.startsWith('エラー') ? '#e74c3c' : '#27ae60' }}>{feedbackMessage}</p>}
    </div>
  );
};