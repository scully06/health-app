// src/ui/SleepInputForm.tsx
import React, { useState, useEffect } from 'react';
import type { User } from '../core/models/User';
import { SleepRecord, type SleepStageDurations } from '../core/models/SleepRecord';
import type { RecordManager } from '../core/services/RecordManager';
import { cardStyle, inputStyle, buttonStyle } from './styles';
import { HealthRecord } from '../core/models/HealthRecord';

interface SleepInputFormProps {
  user: User;
  recordManager: RecordManager;
  onRecordSaved: () => void;
  currentDate: string;
  editingRecord: HealthRecord | null;
}

export const SleepInputForm: React.FC<SleepInputFormProps> = ({ user, recordManager, onRecordSaved, currentDate, editingRecord }) => {
  const [deep, setDeep] = useState('');
  const [light, setLight] = useState('');
  const [rem, setRem] = useState('');
  const [awake, setAwake] = useState('');
  const [feedback, setFeedback] = useState('');
  const [unit, setUnit] = useState<'minutes' | 'hours'>('minutes');
  const [isEditing, setIsEditing] = useState(false);

  // 【バグ修正】編集状態の管理ロジックを修正
  useEffect(() => {
    if (editingRecord && editingRecord instanceof SleepRecord) {
      const { stageDurations } = editingRecord;
      setDeep(stageDurations.deep?.toString() || '');
      setLight(stageDurations.light?.toString() || '');
      setRem(stageDurations.rem?.toString() || '');
      setAwake(stageDurations.awake?.toString() || '');
      setIsEditing(true);
      setUnit('minutes');
      setFeedback('記録を編集中...');
    } else {
      setDeep('');
      setLight('');
      setRem('');
      setAwake('');
      setIsEditing(false);
      setFeedback('');
    }
  }, [editingRecord]);


  const handleSave = async () => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const selectedDate = new Date(currentDate.replace(/-/g, '/'));

    if (selectedDate > today) {
      alert('未来の日付の記録はできません。');
      return;
    }

    const deepValue = parseFloat(deep) || 0;
    const lightValue = parseFloat(light) || 0;
    const remValue = parseFloat(rem) || 0;
    const awakeValue = parseFloat(awake) || 0;

    if (deepValue + lightValue + remValue + awakeValue <= 0) {
      setFeedback('少なくとも1つの睡眠ステージの時間を入力してください。');
      return;
    }

    const conversionFactor = unit === 'hours' ? 60 : 1;
    const deepMinutes = Math.round(deepValue * conversionFactor);
    const lightMinutes = Math.round(lightValue * conversionFactor);
    const remMinutes = Math.round(remValue * conversionFactor);
    const awakeMinutes = Math.round(awakeValue * conversionFactor);

    const stageDurations: SleepStageDurations = {
      deep: deepMinutes, light: lightMinutes, rem: remMinutes, awake: awakeMinutes,
    };

    const recordId = isEditing && editingRecord ? editingRecord.id : `manual-sleep-${Date.now()}`;
    const newRecord = new SleepRecord(recordId, user.id, selectedDate, stageDurations);
    
    try {
      await recordManager.saveRecord(newRecord);
      setFeedback('睡眠記録を保存しました！');
      onRecordSaved();
      setTimeout(() => setFeedback(''), 3000);
    } catch (error) {
      setFeedback('エラーが発生しました。');
      console.error(error);
    }
  };
  
  const unitButtonStyle: React.CSSProperties = {
    padding: '6px 12px',
    border: '1px solid #3498db',
    cursor: 'pointer',
    backgroundColor: 'white',
    color: '#3498db',
    fontSize: '14px',
  };

  const activeUnitButtonStyle: React.CSSProperties = {
    ...unitButtonStyle,
    backgroundColor: '#3498db',
    color: 'white',
  };

  const unitLabel = unit === 'minutes' ? '分' : '時間';
  const inputStep = unit === 'minutes' ? '1' : '0.1';

  return (
    <div style={isEditing ? {...cardStyle, border: '2px solid #3498db'} : cardStyle}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <h3 style={{ marginTop: 0, marginBottom: 0 }}>{isEditing ? '睡眠を編集' : '睡眠記録（手動入力）'}</h3>
        {!isEditing && (
          <div>
            <button 
              style={{ ... (unit === 'minutes' ? activeUnitButtonStyle : unitButtonStyle), borderTopLeftRadius: '6px', borderBottomLeftRadius: '6px' }}
              onClick={() => setUnit('minutes')}
            >
              分
            </button>
            <button 
              style={{ ... (unit === 'hours' ? activeUnitButtonStyle : unitButtonStyle), borderTopRightRadius: '6px', borderBottomRightRadius: '6px', borderLeft: 'none' }}
              onClick={() => setUnit('hours')}
            >
              時間
            </button>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
        <label>深い眠り ({isEditing ? '分' : unitLabel}):
          <input type="number" value={deep} onChange={e => setDeep(e.target.value)} style={inputStyle} step={isEditing ? '1' : inputStep} min="0" />
        </label>
        <label>浅い眠り ({isEditing ? '分' : unitLabel}):
          <input type="number" value={light} onChange={e => setLight(e.target.value)} style={inputStyle} step={isEditing ? '1' : inputStep} min="0" />
        </label>
        <label>REM睡眠 ({isEditing ? '分' : unitLabel}):
          <input type="number" value={rem} onChange={e => setRem(e.target.value)} style={inputStyle} step={isEditing ? '1' : inputStep} min="0" />
        </label>
        <label>目覚め ({isEditing ? '分' : unitLabel}):
          <input type="number" value={awake} onChange={e => setAwake(e.target.value)} style={inputStyle} step={isEditing ? '1' : inputStep} min="0" />
        </label>
      </div>
      <button onClick={handleSave} style={buttonStyle}>{isEditing ? '更新する' : '保存する'}</button>
      {feedback && <p style={{ marginTop: '12px', color: feedback.startsWith('エラー') ? '#e74c3c' : '#27ae60' }}>{feedback}</p>}
    </div>
  );
};
