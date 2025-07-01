// src/ui/SleepInputForm.tsx

import React, { useState } from 'react';
import { User } from '../core/models/User';
import { SleepRecord } from '../core/models/SleepRecord';
import type { RecordManager } from '../core/services/RecordManager';

interface SleepInputFormProps {
  user: User;
  recordManager: RecordManager;
  onRecordSaved: () => void;
}

export const SleepInputForm: React.FC<SleepInputFormProps> = ({ user, recordManager, onRecordSaved }) => {
  const [sleepTime, setSleepTime] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [quality, setQuality] = useState<typeof SleepRecord.Quality[keyof typeof SleepRecord.Quality]>(SleepRecord.Quality.NORMAL);

  const handleSaveClick = async () => {
    const sleepTimeValue = parseFloat(sleepTime);
    if (isNaN(sleepTimeValue) || sleepTimeValue <= 0 || sleepTimeValue > 24) {
      alert('正しい睡眠時間を入力してください。');
      return;
    }

    const newRecord = new SleepRecord(
      `rec-sleep-${Date.now()}`,
      user.id,
      new Date(date),
      sleepTimeValue,
      quality
    );

    try {
      await recordManager.saveRecord(newRecord);
      alert('睡眠時間を保存しました！');
      setSleepTime('');
      onRecordSaved();
    } catch (error) {
      alert('保存に失敗しました。');
    }
  };

  return (
    <div style={{ border: '1px solid #ccc', padding: '16px', borderRadius: '8px', marginTop: '24px' }}>
      <h4>睡眠を記録しましょう</h4>
      <label>日付: <input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
      <br />
      <label>睡眠時間 (h): <input type="number" step="0.5" value={sleepTime} onChange={(e) => setSleepTime(e.target.value)} placeholder="例: 7.5" /></label>
      <br />
      <label>睡眠の質: 
        <select value={quality} onChange={(e) => setQuality(e.target.value as any)}>
          {Object.values(SleepRecord.Quality).map(q => <option key={q} value={q}>{q}</option>)}
        </select>
      </label>
      <br />
      <button onClick={handleSaveClick} style={{ marginTop: '16px' }}>保存する</button>
    </div>
  );
};