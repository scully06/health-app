// src/App.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';

// --- Hooks ---
import { useAuth } from './hooks/useAuth';

// --- Core Services & Models ---
import { User } from './core/models/User';
import { RecordManager } from './core/services/RecordManager';
import { AnalysisEngine } from './core/services/AnalysisEngine';
import { ReminderManager } from './core/services/ReminderManager';
import { HealthRecord } from './core/models/HealthRecord';

// --- UI Components ---
import { AnalysisResult } from './ui/AnalysisResult';
import { WeightInputForm } from './ui/WeightInputForm';
import { SleepInputForm } from './ui/SleepInputForm';
import { FoodInputForm } from './ui/FoodInputForm';
import { WeightChart } from './ui/WeightChart';
import { RecordList } from './ui/RecordList';
import { ReminderSettings } from './ui/ReminderSettings';
import { WeightDataDisplay } from './ui/WeightDataDisplay';
import { SleepDataDisplay } from './ui/SleepDataDisplay';

// --- Styles ---
import { buttonStyle, cardStyle, inputStyle } from './ui/styles';

// --- アプリケーションのコアインスタンス ---
const user = new User('user-001', '田中 太郎', 1.75);
const recordManager = new RecordManager();
const analysisEngine = new AnalysisEngine();
const reminderManager = new ReminderManager();

function App() {
  const { accessToken, isLoading: isAuthLoading, login, logout } = useAuth();
  
  const [allRecords, setAllRecords] = useState<HealthRecord[]>([]);
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // ローカルDBからデータを読み込み、UIの状態を更新する中央集権的な関数
  const updateLocalUI = useCallback(async () => {
    const latestRecords = await recordManager.getRecords(user.id);
    setAllRecords([...latestRecords]);
    const resultText = analysisEngine.analyzeCorrelation(latestRecords);
    setAnalysisResult(resultText);
  }, []);

  // アプリ起動時に一度だけローカルデータを読み込む
  useEffect(() => {
    updateLocalUI();
  }, [updateLocalUI]);
  
  // 記録削除ハンドラ
  const handleDeleteRecord = async (recordId: string) => {
    await recordManager.deleteRecord(recordId);
    await updateLocalUI();
    alert('記録を削除しました。');
  };

  // 表示する日付の記録をフィルタリング
  const recordsForSelectedDate = useMemo(() => {
    // 選択された日付をDateオブジェクトに変換 (UTCとして解釈されないように時刻を追加)
    const selectedDate = new Date(currentDate + 'T00:00:00');

    return allRecords.filter(record => {
      // 記録のdateプロパティもDateオブジェクトに変換
      const recordDate = new Date(record.date);
      
      // 年、月、日がすべて一致するかをチェック
      return (
        recordDate.getFullYear() === selectedDate.getFullYear() &&
        recordDate.getMonth() === selectedDate.getMonth() &&
        recordDate.getDate() === selectedDate.getDate()
      );
    });
  }, [allRecords, currentDate]);

  return (
    <div className="App" style={{ maxWidth: '960px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif' }}>
      {/* ================= HEADER ================= */}
      <header style={{ borderBottom: '1px solid #ddd', paddingBottom: '20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <h1 style={{ color: '#2c3e50', margin: 0 }}>健康管理アプリ</h1>
          <div>
            {accessToken ? (
              <button onClick={logout} style={{ ...buttonStyle, width: 'auto', marginTop: 0, backgroundColor: '#e74c3c' }}>ログアウト</button>
            ) : (
              <button onClick={login} disabled={isAuthLoading} style={{ ...buttonStyle, width: 'auto', marginTop: 0 }}>
                {isAuthLoading ? '処理中...' : 'Googleでログイン'}
              </button>
            )}
          </div>
        </div>
      </header>
      
      <main>
        {/* ================= GOOGLE FIT SECTION ================= */}
        {accessToken ? (
          <div style={{...cardStyle, marginBottom: '32px' }}>
            <h2 style={{marginTop: 0}}>Google Fit データ連携</h2>
            <p style={{color: 'green'}}>ログイン済みです。過去のデータを表示・同期できます。</p>
            <WeightDataDisplay accessToken={accessToken} recordManager={recordManager} onSync={updateLocalUI} />
            <SleepDataDisplay accessToken={accessToken} recordManager={recordManager} onSync={updateLocalUI} />
          </div>
        ) : (
          <div style={{...cardStyle, marginBottom: '32px', textAlign: 'center' }}>
            <p>Googleでログインすると、Google Fitのデータを表示・同期できます。</p>
          </div>
        )}

        {/* ================= LOCAL DATA SECTION ================= */}
        <div style={{ ...cardStyle, marginBottom: '32px' }}>
          <h2 style={{marginTop: 0}}>分析と設定</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            <AnalysisResult analysisText={analysisResult} />
            <ReminderSettings reminderManager={reminderManager} />
          </div>
        </div>
        
        <div style={{ ...cardStyle }}>
          <h2 style={{marginTop: 0}}>データ入力</h2>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <label htmlFor="current-date-picker" style={{fontWeight: 'bold'}}>表示・記録する日付:</label>
            <input id="current-date-picker" type="date" value={currentDate} onChange={e => setCurrentDate(e.target.value)} style={{ ...inputStyle, width: 'auto', marginLeft: '8px' }}/>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            <FoodInputForm user={user} recordManager={recordManager} onRecordSaved={updateLocalUI} currentDate={currentDate} />
            <WeightInputForm user={user} recordManager={recordManager} analysisEngine={analysisEngine} onRecordSaved={updateLocalUI} currentDate={currentDate} />
            <SleepInputForm user={user} recordManager={recordManager} onRecordSaved={updateLocalUI} currentDate={currentDate} />
          </div>
        </div>

        <div style={{ marginTop: '32px' }}>
          <WeightChart records={allRecords} />
        </div>

        <RecordList records={recordsForSelectedDate} onDeleteRecord={handleDeleteRecord} />
      </main>
    </div>
  );
}

export default App;