// src/App.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';

import { useAuth } from './hooks/useAuth';
import { User } from './core/models/User';
import { RecordManager } from './core/services/RecordManager';
import { AnalysisEngine } from './core/services/AnalysisEngine';
import { ReminderManager } from './core/services/ReminderManager';
import { HealthRecord } from './core/models/HealthRecord';
import { WeightRecord } from './core/models/WeightRecord';
import { FoodRecord } from './core/models/FoodRecord';
import { SleepRecord } from './core/models/SleepRecord';

import { AnalysisResult } from './ui/AnalysisResult';
import { WeightInputForm } from './ui/WeightInputForm';
import { SleepInputForm } from './ui/SleepInputForm';
import { FoodInputForm } from './ui/FoodInputForm';
import { WeightChart } from './ui/WeightChart';
import { RecordList } from './ui/RecordList';
import { ReminderSettings } from './ui/ReminderSettings';
import { WeightDataDisplay } from './ui/WeightDataDisplay';
import { SleepDataDisplay } from './ui/SleepDataDisplay';
import { DisclaimerModal } from './ui/DisclaimerModal';
import { SettingsScreen } from './ui/SettingsScreen';
import { GoalStatus } from './ui/GoalStatus';
import { SleepChart } from './ui/SleepChart';

import { buttonStyle, cardStyle, inputStyle } from './ui/styles';

const recordManager = new RecordManager();
const analysisEngine = new AnalysisEngine();
const reminderManager = new ReminderManager();

type Screen = 'main' | 'settings';

// Google認証が有効かどうかを判定するフラグ
export const isGoogleAuthEnabled = !!import.meta.env.VITE_GOOGLE_CLIENT_ID;

function App() {
  const { accessToken, isLoading: isAuthLoading, login, logout } = useAuth();
  
  const [user, setUser] = useState(() => {
    const savedHeight = localStorage.getItem('userHeight');
    const savedTargetWeight = localStorage.getItem('userTargetWeight');
    const savedTargetCalories = localStorage.getItem('userTargetCalories');
    
    return new User(
      'user-001', 
      '田中 太郎', 
      savedHeight ? parseFloat(savedHeight) : 1.75,
      savedTargetWeight ? parseFloat(savedTargetWeight) : undefined,
      savedTargetCalories ? parseInt(savedTargetCalories, 10) : undefined
    );
  });
  
  const [allRecords, setAllRecords] = useState<HealthRecord[]>([]);
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<Screen>('main');
  const [editingRecord, setEditingRecord] = useState<HealthRecord | null>(null);

  const updateLocalUI = useCallback(async () => {
    const latestRecords = await recordManager.getRecords(user.id);
    setAllRecords([...latestRecords]);
    const resultText = await analysisEngine.analyze(latestRecords);
    setAnalysisResult(resultText);
    setEditingRecord(null);
  }, [user.id]);

  useEffect(() => {
    updateLocalUI();
  }, [updateLocalUI]);
  
  useEffect(() => {
    const disclaimerDismissed = localStorage.getItem('disclaimerDismissed');
    if (!disclaimerDismissed) {
      setIsDisclaimerOpen(true);
    }
  }, []);

  const handleCloseDisclaimer = () => {
    localStorage.setItem('disclaimerDismissed', 'true');
    setIsDisclaimerOpen(false);
  };
  
  const handleDeleteRecord = async (recordId: string) => {
    await recordManager.deleteRecord(recordId);
    await updateLocalUI();
    alert('記録を削除しました。');
  };

  const handleEditRecord = (record: HealthRecord) => {
    setEditingRecord(record);
    setCurrentDate(new Date(record.date).toISOString().split('T')[0]);
    const dataInputSection = document.getElementById('data-input-section');
    if (dataInputSection) {
      dataInputSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSettingsChange = (settings: { height: number; targetWeight?: number; targetCalories?: number }) => {
    const updatedUser = new User(
      user.id, 
      user.name, 
      settings.height, 
      settings.targetWeight, 
      settings.targetCalories
    );
    setUser(updatedUser);
    
    localStorage.setItem('userHeight', settings.height.toString());
    if (settings.targetWeight) {
      localStorage.setItem('userTargetWeight', settings.targetWeight.toString());
    } else {
      localStorage.removeItem('userTargetWeight');
    }
    if (settings.targetCalories) {
      localStorage.setItem('userTargetCalories', settings.targetCalories.toString());
    } else {
      localStorage.removeItem('userTargetCalories');
    }
  };
  
  const handleImportData = async (importedRecords: HealthRecord[]) => {
    try {
      await recordManager.overwriteAllRecords(importedRecords);
      await updateLocalUI();
      alert('データのインポートが完了しました。');
      setCurrentScreen('main');
    } catch(error: any) {
      alert(error.message);
    }
  };

  const recordsForSelectedDate = useMemo(() => {
    const selectedDate = new Date(currentDate);
    return allRecords.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate.getFullYear() === selectedDate.getFullYear() &&
             recordDate.getMonth() === selectedDate.getMonth() &&
             recordDate.getDate() === selectedDate.getDate();
    });
  }, [allRecords, currentDate]);

  const latestWeightRecord = useMemo(() => {
    return allRecords
      .filter((r): r is WeightRecord => r instanceof WeightRecord)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  }, [allRecords]);

  return (
    <>
      <DisclaimerModal isOpen={isDisclaimerOpen} onClose={handleCloseDisclaimer} />
      <div className="App" style={{ maxWidth: '960px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif' }}>
        <header style={{ borderBottom: '1px solid #ddd', paddingBottom: '20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <h1 style={{ color: '#2c3e50', margin: 0 }}>健康管理アプリ</h1>
            <div>
              {currentScreen === 'main' && (
                <button onClick={() => setCurrentScreen('settings')} style={{ ...buttonStyle, width: 'auto', marginTop: 0, marginRight: '12px', backgroundColor: '#95a5a6' }}>
                  設定
                </button>
              )}
              {isGoogleAuthEnabled && (
                accessToken ? (
                  <button onClick={logout} style={{ ...buttonStyle, width: 'auto', marginTop: 0, backgroundColor: '#e74c3c' }}>ログアウト</button>
                ) : (
                  <button onClick={login} disabled={isAuthLoading} style={{ ...buttonStyle, width: 'auto', marginTop: 0 }}>
                    {isAuthLoading ? '処理中...' : 'Googleでログイン'}
                  </button>
                )
              )}
            </div>
          </div>
        </header>
        
        {currentScreen === 'main' ? (
          <main>
            <GoalStatus user={user} latestWeightRecord={latestWeightRecord} />

            {isGoogleAuthEnabled ? (
              accessToken ? (
                <div style={{...cardStyle, marginTop: '24px', marginBottom: '32px' }}>
                  <h2 style={{marginTop: 0}}>Google Fit データ連携</h2>
                  <WeightDataDisplay accessToken={accessToken} recordManager={recordManager} onSync={updateLocalUI} />
                  <SleepDataDisplay accessToken={accessToken} recordManager={recordManager} onSync={updateLocalUI} />
                </div>
              ) : (
                <div style={{...cardStyle, marginTop: '24px', marginBottom: '32px', textAlign: 'center' }}>
                  <p>Googleでログインすると、Google Fitのデータを表示・同期できます。</p>
                </div>
              )
            ) : (
              <div style={{...cardStyle, marginTop: '24px', marginBottom: '32px', textAlign: 'center', backgroundColor: '#f8f9f9' }}>
                <p style={{margin: 0, color: '#7f8c8d'}}>
                  Google連携機能は現在設定されていません。<br/>
                  利用するには、開発者がアプリケーションにGoogle Client IDを設定する必要があります。
                </p>
              </div>
            )}

            <div style={{ ...cardStyle, marginBottom: '32px' }}>
              <h2 style={{marginTop: 0}}>分析と設定</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                <AnalysisResult analysisText={analysisResult} />
                <ReminderSettings reminderManager={reminderManager} />
              </div>
            </div>
            
            <div id="data-input-section" style={{ ...cardStyle }}>
              <h2 style={{marginTop: 0}}>データ入力</h2>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <label htmlFor="current-date-picker" style={{fontWeight: 'bold'}}>表示・記録する日付:</label>
                <input id="current-date-picker" type="date" value={currentDate} onChange={e => setCurrentDate(e.target.value)} style={{ ...inputStyle, width: 'auto', marginLeft: '8px' }}/>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                <FoodInputForm user={user} recordManager={recordManager} onRecordSaved={updateLocalUI} currentDate={currentDate} editingRecord={editingRecord} />
                <WeightInputForm user={user} recordManager={recordManager} analysisEngine={analysisEngine} onRecordSaved={updateLocalUI} currentDate={currentDate} editingRecord={editingRecord} />
                <SleepInputForm user={user} recordManager={recordManager} onRecordSaved={updateLocalUI} currentDate={currentDate} editingRecord={editingRecord} />
              </div>
            </div>

            <div style={{ marginTop: '32px' }}>
              <WeightChart records={allRecords} />
            </div>
            
            <div style={{ marginTop: '32px' }}>
              <SleepChart records={allRecords} />
            </div>

            <RecordList records={recordsForSelectedDate} onDeleteRecord={handleDeleteRecord} onEditRecord={handleEditRecord} />
          </main>
        ) : (
          <SettingsScreen 
            user={user} 
            onBack={() => setCurrentScreen('main')}
            onSettingsChange={handleSettingsChange}
            allRecords={allRecords}
            onImportData={handleImportData}
          />
        )}
      </div>
    </>
  );
}

export default App;
