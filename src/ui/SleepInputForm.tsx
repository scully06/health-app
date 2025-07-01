// src/ui/SleepInputForm.tsx
import React, { useState } from 'react';
import type { User } from '../core/models/User';
import { SleepRecord } from '../core/models/SleepRecord';
import type { RecordManager } from '../core/services/RecordManager';
import { cardStyle, inputStyle, buttonStyle } from './styles';

interface SleepInputFormProps {
  user: User;
  recordManager: RecordManager;
  onRecordSaved: () => void;
  currentDate: string; //【追加】
}

export const SleepInputForm: React.FC<SleepInputFormProps> = ({ user, recordManager, onRecordSaved, currentDate }) => {
  const [sleepTime, setSleepTime] = useState<string>('');
  //【削除】const [date, setDate] = useState<string>(...);
  const [quality, setQuality] = useState<typeof SleepRecord.Quality[keyof typeof SleepRecord.Quality]>(SleepRecord.Quality.NORMAL);

  const handleSaveClick = async () => {
    const sleepTimeValue = parseFloat(sleepTime);
    if (isNaN(sleepTimeValue) || sleepTimeValue <= 0 || sleepTimeValue > 24) {
      alert('正しい睡眠時間を入力してください。');
      return;
    }

    const newRecord = new SleepRecord(`sleep-${new Date(currentDate).getTime()}`, user.id, new Date(currentDate), sleepTimeValue, quality);
    
    await recordManager.saveRecord(newRecord);
    setSleepTime('');
    onRecordSaved();
    alert('睡眠時間を保存しました！');
  };

  return (
    <div style={cardStyle}>
      <h4 style={{ marginTop: 0, color: '#2c3e50' }}>睡眠を記録</h4>
      {/*【削除】日付入力欄を削除*/}
      <div style={{ marginBottom: '16px' }}>
        <label>睡眠時間 (h)</label>
        <input type="number" step="0.5" value={sleepTime} onChange={(e) => setSleepTime(e.target.value)} placeholder="例: 7.5" style={inputStyle} />
      </div>
      <div style={{ marginBottom: '16px' }}>
        <label>睡眠の質</label> 
        <select value={quality} onChange={(e) => setQuality(e.target.value as any)} style={inputStyle}>
          {Object.values(SleepRecord.Quality).map(q => <option key={q} value={q}>{q}</option>)}
        </select>
      </div>
      <button onClick={handleSaveClick} style={buttonStyle}>保存する</button>
    </div>
  );
};