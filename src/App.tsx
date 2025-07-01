// src/App.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';

// Models
import { User } from './core/models/User';
import { HealthRecord } from './core/models/HealthRecord';
import { FoodRecord } from './core/models/FoodRecord'; //【追加】

// Services
import { RecordManager } from './core/services/RecordManager';
import { AnalysisEngine } from './core/services/AnalysisEngine';
import { ReminderManager } from './core/services/ReminderManager';

// UI Components
import { AnalysisResult } from './ui/AnalysisResult';
import { WeightInputForm } from './ui/WeightInputForm';
import { SleepInputForm } from './ui/SleepInputForm';
import { FoodInputForm } from './ui/FoodInputForm'; //【追加】
import { WeightChart } from './ui/WeightChart';
import { RecordList } from './ui/RecordList';
import { ReminderSettings } from './ui/ReminderSettings';

// --- アプリケーションのコアインスタンス ---
const user = new User('user-001', '田中 太郎', 1.75);
const recordManager = new RecordManager();
const analysisEngine = new AnalysisEngine();
const reminderManager = new ReminderManager();

function App() {
  const [allRecords, setAllRecords] = useState<HealthRecord[]>([]);
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const updateUI = useCallback(async () => {
    const latestRecords = await recordManager.getRecords(user.id);
    setAllRecords([...latestRecords]); // 新しい配列としてセット
    const resultText = await analysisEngine.analyzeCorrelation(latestRecords);
    setAnalysisResult(resultText);
  }, []);

  useEffect(() => {
    updateUI();
  }, [updateUI]);

  const recordsForSelectedDate = useMemo(() => {
    return allRecords.filter(record => {
      const recordDate = new Date(record.date);
      const selectedDate = new Date(currentDate);
      return (
        recordDate.getFullYear() === selectedDate.getFullYear() &&
        recordDate.getMonth() === selectedDate.getMonth() &&
        recordDate.getDate() === selectedDate.getDate()
      );
    });
  }, [allRecords, currentDate]);

  const handleDeleteRecord = async (recordId: string) => {
    await recordManager.deleteRecord(recordId);
    await updateUI();
    alert('記録を削除しました。');
  };

  return (
    <div className="App" style={{ maxWidth: '960px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <header>
        <h1 style={{ textAlign: 'center', color: '#2c3e50', marginBottom: '16px' }}>健康管理アプリ</h1>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <label htmlFor="current-date-picker" style={{ marginRight: '8px' }}>表示・記録する日付:</label>
          <input 
            id="current-date-picker"
            type="date" 
            value={currentDate} 
            onChange={e => setCurrentDate(e.target.value)}
            style={{ padding: '8px', borderRadius: '8px', border: '1px solid #ccc' }}
          />
        </div>
      </header>
      <main>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}>
          <AnalysisResult analysisText={analysisResult} />
          <ReminderSettings reminderManager={reminderManager} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}>
          <WeightInputForm user={user} recordManager={recordManager} analysisEngine={analysisEngine} onRecordSaved={updateUI} currentDate={currentDate} />
          <SleepInputForm user={user} recordManager={recordManager} onRecordSaved={updateUI} currentDate={currentDate} />
          <FoodInputForm user={user} recordManager={recordManager} onRecordSaved={updateUI} currentDate={currentDate} />
        </div>
        <hr style={{ margin: '32px 0', border: 0, borderTop: '1px solid #eee' }} />
        <div style={{ marginTop: '32px' }}>
          <WeightChart records={allRecords} />
        </div>
        <RecordList records={recordsForSelectedDate} onDeleteRecord={handleDeleteRecord} />
      </main>
    </div>
  );
}

// API連携コードは削除済みなので、Appを直接エクスポート
export default App;