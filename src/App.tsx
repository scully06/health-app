// src/App.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';

import { useAuth } from './hooks/useAuth';
import { User } from './core/models/User';
import { RecordManager } from './core/services/RecordManager';
import { AnalysisEngine } from './core/services/AnalysisEngine';
import { ReminderManager } from './core/services/ReminderManager';
import { HealthRecord } from './core/models/HealthRecord';
import { WeightRecord } from './core/models/WeightRecord';

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
// 【追加】設定画面コンポーネントをインポート
import { SettingsScreen } from './ui/SettingsScreen';

import { buttonStyle, cardStyle, inputStyle } from './ui/styles';

// 【変更】ユーザー情報をStateで管理するように変更
// const user = new User('user-001', '田中 太郎', 1.75);
const recordManager = new RecordManager();
const analysisEngine = new AnalysisEngine();
const reminderManager = new ReminderManager();

// 【追加】画面の種類を定義
type Screen = 'main' | 'settings';

function App() {
  const { accessToken, isLoading: isAuthLoading, login, logout } = useAuth();
  
  // 【追加】ユーザー情報をStateで管理
  const [user, setUser] = useState(() => {
    // localStorageから保存された身長を読み込む
    const savedHeight = localStorage.getItem('userHeight');
    const initialHeight = savedHeight ? parseFloat(savedHeight) : 1.75; // デフォルトは1.75m
    return new User('user-001', '田中 太郎', initialHeight);
  });
  
  const [allRecords, setAllRecords] = useState<HealthRecord[]>([]);
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false);
  
  // 【追加】現在の画面を管理するState
  const [currentScreen, setCurrentScreen] = useState<Screen>('main');

  const updateLocalUI = useCallback(async () => {
    const latestRecords = await recordManager.getRecords(user.id);
    setAllRecords([...latestRecords]);
    
    const resultText = await analysisEngine.analyze(latestRecords);
    setAnalysisResult(resultText);
  }, [user.id]); // user.idを依存配列に追加

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
    setIsDisclaimerOpen(false);
    localStorage.setItem('disclaimerDismissed', 'true');
  };
  
  const handleDeleteRecord = async (recordId: string) => {
    await recordManager.deleteRecord(recordId);
    await updateLocalUI();
    alert('記録を削除しました。');
  };

  // 【追加】身長を更新してlocalStorageに保存する関数
  const handleHeightChange = (newHeight: number) => {
    const updatedUser = new User(user.id, user.name, newHeight);
    setUser(updatedUser);
    localStorage.setItem('userHeight', newHeight.toString());
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

  return (
    <>
      <DisclaimerModal isOpen={isDisclaimerOpen} onClose={handleCloseDisclaimer} />
      <div className="App" style={{ maxWidth: '960px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif' }}>
        <header style={{ borderBottom: '1px solid #ddd', paddingBottom: '20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <h1 style={{ color: '#2c3e50', margin: 0 }}>健康管理アプリ</h1>
            <div>
              {/* 【追加】設定ボタン */}
              {currentScreen === 'main' && (
                <button onClick={() => setCurrentScreen('settings')} style={{ ...buttonStyle, width: 'auto', marginTop: 0, marginRight: '12px', backgroundColor: '#95a5a6' }}>
                  設定
                </button>
              )}
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
        
        {/* 【変更】currentScreenに応じて表示するコンポーネントを切り替える */}
        {currentScreen === 'main' ? (
          <main>
            {accessToken ? (
              <div style={{...cardStyle, marginBottom: '32px' }}>
                <h2 style={{marginTop: 0}}>Google Fit データ連携</h2>
                <WeightDataDisplay accessToken={accessToken} recordManager={recordManager} onSync={updateLocalUI} />
                <SleepDataDisplay accessToken={accessToken} recordManager={recordManager} onSync={updateLocalUI} />
              </div>
            ) : (
              <div style={{...cardStyle, marginBottom: '32px', textAlign: 'center' }}>
                <p>Googleでログインすると、Google Fitのデータを表示・同期したり、AI分析の精度を向上させたりできます。</p>
              </div>
            )}

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
        ) : (
          <SettingsScreen 
            user={user} 
            onBack={() => setCurrentScreen('main')}
            onHeightChange={handleHeightChange}
          />
        )}
      </div>
    </>
  );
}

export default App;