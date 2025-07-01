// src/ui/SleepInputForm.tsx
import React, { useState } from 'react';
import type { User } from '../core/models/User';
import { SleepRecord, type SleepStageDurations } from '../core/models/SleepRecord';
import type { RecordManager } from '../core/services/RecordManager';
import { cardStyle, inputStyle, buttonStyle } from './styles';

interface SleepInputFormProps {
  user: User;
  recordManager: RecordManager;
  onRecordSaved: () => void;
  currentDate: string;
}

export const SleepInputForm: React.FC<SleepInputFormProps> = ({ user, recordManager, onRecordSaved, currentDate }) => {
  const [deep, setDeep] = useState('');
  const [light, setLight] = useState('');
  const [rem, setRem] = useState('');
  const [awake, setAwake] = useState('');
  const [feedback, setFeedback] = useState('');

  const handleSave = async () => {
    const deepMinutes = parseInt(deep, 10) || 0;
    const lightMinutes = parseInt(light, 10) || 0;
    const remMinutes = parseInt(rem, 10) || 0;
    const awakeMinutes = parseInt(awake, 10) || 0;

    if (deepMinutes + lightMinutes + remMinutes + awakeMinutes <= 0) {
      setFeedback('少なくとも1つの睡眠ステージの時間を入力してください。');
      return;
    }

    const stageDurations: SleepStageDurations = {
      deep: deepMinutes, light: lightMinutes, rem: remMinutes, awake: awakeMinutes,
    };

    //【重要】日付に基づいた一意なIDを生成
    const recordId = `manual-sleep-${new Date(currentDate).toISOString().split('T')[0]}`;
    const newRecord = new SleepRecord(recordId, user.id, new Date(currentDate), stageDurations);
    
    try {
      await recordManager.saveRecord(newRecord);
      setFeedback('睡眠記録を保存しました！');
      setDeep(''); setLight(''); setRem(''); setAwake('');
      onRecordSaved();
    } catch (error) {
      setFeedback('エラーが発生しました。');
      console.error(error);
    }
  };

  return (
    <div style={cardStyle}>
      <h3 style={{ marginTop: 0 }}>睡眠記録（手動入力）</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
        <label>深い眠り (分):<input type="number" value={deep} onChange={e => setDeep(e.target.value)} style={inputStyle} /></label>
        <label>浅い眠り (分):<input type="number" value={light} onChange={e => setLight(e.target.value)} style={inputStyle} /></label>
        <label>REM睡眠 (分):<input type="number" value={rem} onChange={e => setRem(e.target.value)} style={inputStyle} /></label>
        <label>目覚め (分):<input type="number" value={awake} onChange={e => setAwake(e.target.value)} style={inputStyle} /></label>
      </div>
      <button onClick={handleSave} style={buttonStyle}>保存する</button>
      {feedback && <p>{feedback}</p>}
    </div>
  );
};