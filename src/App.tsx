import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './hooks/useAuth';
import { useFitData, type WeightDataPoint, type SleepDataPoint } from './hooks/useFitData';

// Core Services & Models
import { User } from './core/models/User';
import { RecordManager } from './core/services/RecordManager';
import { AnalysisEngine } from './core/services/AnalysisEngine';
import { ReminderManager } from './core/services/ReminderManager';
import { HealthRecord } from './core/models/HealthRecord';
import { WeightRecord } from './core/models/WeightRecord';
import { SleepRecord } from './core/models/SleepRecord';

// UI Components
import { AnalysisResult } from './ui/AnalysisResult';
import { WeightInputForm } from './ui/WeightInputForm';
import { SleepInputForm } from './ui/SleepInputForm';
import { FoodInputForm } from './ui/FoodInputForm';
import { WeightChart } from './ui/WeightChart';
import { RecordList } from './ui/RecordList';
import { ReminderSettings } from './ui/ReminderSettings';

// --- アプリケーションのコアインスタンス ---
const user = new User('user-001', '田中 太郎', 1.75);
const recordManager = new RecordManager();
const analysisEngine = new AnalysisEngine();
const reminderManager = new ReminderManager();

function App() {
  const { accessToken, isLoading: isAuthLoading, login, logout } = useAuth();
  const { weightData, sleepData, isLoading: isFitDataLoading, error: fitDataError, fetchData: fetchFitData } = useFitData(accessToken);

  const [allRecords, setAllRecords] = useState<HealthRecord[]>([]);
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const updateLocalUI = useCallback(async () => {
    const latestRecords = await recordManager.getRecords(user.id);
    setAllRecords([...latestRecords]);
    const resultText = analysisEngine.analyzeCorrelation(latestRecords);
    setAnalysisResult(resultText);
  }, []);

  useEffect(() => {
    updateLocalUI();
  }, [updateLocalUI]);
  
  // Google Fitデータ取得後にローカルDBに保存
  const syncFitDataToLocal = async () => {
    if(weightData.length === 0 && sleepData.length === 0) return;
    
    for (const w of weightData) {
      const record = new WeightRecord(`gf-w-${w.date.getTime()}`, user.id, w.date, w.weightKg);
      await recordManager.saveRecord(record);
    }
    for (const s of sleepData) {
      const record = new SleepRecord(`gf-s-${s.date.getTime()}`, user.id, s.date, s.sleepHours, SleepRecord.Quality.NORMAL);
      await recordManager.saveRecord(record);
    }
    await updateLocalUI(); // ローカルUIを更新
    alert('Google Fitデータの同期が完了しました。');
  };

  const recordsForSelectedDate = useMemo(() => {
    return allRecords.filter(r => new Date(r.date).toDateString() === new Date(currentDate).toDateString());
  }, [allRecords, currentDate]);

  const handleDeleteRecord = async (recordId: string) => {
    await recordManager.deleteRecord(recordId);
    await updateLocalUI();
    alert('記録を削除しました。');
  };

  return (
    <div className="App" style={{ maxWidth: '960px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
        <h1 style={{ color: '#2c3e50' }}>健康管理アプリ</h1>
        <div>
          {accessToken ? (
            <>
              <button onClick={fetchFitData} disabled={isFitDataLoading} style={{marginRight: '8px'}}>
                {isFitDataLoading ? 'Fitデータ更新中...' : 'Fitデータ手動更新'}
              </button>
              <button onClick={syncFitDataToLocal}>Fitデータをローカルに同期</button>
              <button onClick={logout} style={{marginLeft: '8px'}}>ログアウト</button>
            </>
          ) : (
            <button onClick={login} disabled={isAuthLoading}>
              {isAuthLoading ? '処理中...' : 'Googleでログイン'}
            </button>
          )}
        </div>
      </header>
      <main>
        <AnalysisResult analysisText={analysisResult} />
        <ReminderSettings reminderManager={reminderManager} />
        <hr style={{ margin: '32px 0', border: 0, borderTop: '1px solid #eee' }} />
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <label htmlFor="current-date-picker">表示・記録する日付:</label>
          <input id="current-date-picker" type="date" value={currentDate} onChange={e => setCurrentDate(e.target.value)} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}>
          <FoodInputForm user={user} recordManager={recordManager} onRecordSaved={updateLocalUI} currentDate={currentDate} />
          <WeightInputForm user={user} recordManager={recordManager} analysisEngine={analysisEngine} onRecordSaved={updateLocalUI} currentDate={currentDate} />
          <SleepInputForm user={user} recordManager={recordManager} onRecordSaved={updateLocalUI} currentDate={currentDate} />
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

export default App;