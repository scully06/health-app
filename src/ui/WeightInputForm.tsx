// src/ui/WeightInputForm.tsx
import React, { useState, useEffect } from 'react';
import type { User } from '../core/models/User';
import { WeightRecord } from '../core/models/WeightRecord';
import type { RecordManager } from '../core/services/RecordManager';
import type { AnalysisEngine } from '../core/services/AnalysisEngine';
import { cardStyle, inputStyle, buttonStyle } from './styles';
import { HealthRecord } from '../core/models/HealthRecord';

interface WeightInputFormProps {
  user: User;
  recordManager: RecordManager;
  analysisEngine: AnalysisEngine;
  onRecordSaved: () => void;
  currentDate: string;
  editingRecord: HealthRecord | null;
}

export const WeightInputForm: React.FC<WeightInputFormProps> = ({ user, recordManager, analysisEngine, onRecordSaved, currentDate, editingRecord }) => {
  const [weight, setWeight] = useState<string>('');
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (editingRecord && editingRecord instanceof WeightRecord) {
      setWeight(editingRecord.weight.toString());
      setIsEditing(true);
      setFeedbackMessage('記録を編集中...');
    } else {
      setIsEditing(false);
      if (!editingRecord) {
          setWeight('');
          setFeedbackMessage('');
      }
    }
  }, [editingRecord]);

  const handleSaveClick = async () => {
    // 【追加】未来日でないか検証
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const selectedDate = new Date(currentDate.replace(/-/g, '/'));

    if (selectedDate > today) {
      alert('未来の日付の記録はできません。');
      return;
    }

    const weightValue = parseFloat(weight);
    if (isNaN(weightValue) || weightValue <= 0) {
      setFeedbackMessage('エラー: 正しい体重を入力してください。');
      return;
    }

    const recordId = isEditing && editingRecord ? editingRecord.id : `manual-weight-${selectedDate.toISOString().split('T')[0]}`;
    const newRecord = new WeightRecord(recordId, user.id, selectedDate, weightValue);

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
    <div style={isEditing ? {...cardStyle, border: '2px solid #3498db'} : cardStyle}>
      <h3 style={{ marginTop: 0, color: '#2c3e50' }}>{isEditing ? '体重を編集' : '体重を記録'}</h3>
      <div style={{ marginBottom: '16px' }}>
        <label htmlFor="weight-input">体重 (kg)</label>
        <input id="weight-input" type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="例: 65.5" style={inputStyle} />
      </div>
      <button onClick={handleSaveClick} style={buttonStyle}>{isEditing ? '更新する' : '保存する'}</button>
      {feedbackMessage && <p style={{ marginTop: '12px', color: feedbackMessage.startsWith('エラー') ? '#e74c3c' : '#27ae60' }}>{feedbackMessage}</p>}
    </div>
  );
};
