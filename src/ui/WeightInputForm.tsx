// src/ui/WeightInputForm.tsx
import React, { useState } from 'react';
import type { User } from '../core/models/User';
import { WeightRecord } from '../core/models/WeightRecord';
import type { RecordManager } from '../core/services/RecordManager';
import type { AnalysisEngine } from '../core/services/AnalysisEngine';
import { cardStyle, inputStyle, buttonStyle } from './styles';

interface WeightInputFormProps {
  user: User;
  recordManager: RecordManager;
  analysisEngine: AnalysisEngine;
  onRecordSaved: () => void;
  currentDate: string;
}

export const WeightInputForm: React.FC<WeightInputFormProps> = ({ user, recordManager, analysisEngine, onRecordSaved, currentDate }) => {
  const [weight, setWeight] = useState<string>('');
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');

  const handleSaveClick = async () => {
    const weightValue = parseFloat(weight);
    if (isNaN(weightValue) || weightValue <= 0) {
      setFeedbackMessage('エラー: 正しい体重を入力してください。');
      return;
    }

    //【重要】日付に基づいた一意なIDを生成
    const recordId = `manual-weight-${new Date(currentDate).toISOString().split('T')[0]}`;
    const newRecord = new WeightRecord(recordId, user.id, new Date(currentDate), weightValue);

    try {
      await recordManager.saveRecord(newRecord);
      const bmi = analysisEngine.calculateBMI(newRecord.weight, user.height);
      const bmiFeedback = bmi !== null ? `あなたのBMIは ${bmi} です。` : '';
      setFeedbackMessage(`保存しました！ ${bmiFeedback}`);
      setWeight('');
      onRecordSaved();
    } catch (error) {
      setFeedbackMessage('エラー: 保存に失敗しました。');
      console.error(error);
    }
  };

  return (
    <div style={cardStyle}>
      <h3 style={{ marginTop: 0, color: '#2c3e50' }}>体重を記録</h3>
      <div style={{ marginBottom: '16px' }}>
        <label htmlFor="weight-input">体重 (kg)</label>
        <input id="weight-input" type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="例: 65.5" style={inputStyle} />
      </div>
      <button onClick={handleSaveClick} style={buttonStyle}>保存する</button>
      {feedbackMessage && <p style={{ marginTop: '12px', color: feedbackMessage.startsWith('エラー') ? '#e74c3c' : '#27ae60' }}>{feedbackMessage}</p>}
    </div>
  );
};