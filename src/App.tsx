// src/App.tsx
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

import { useAuth } from './hooks/useAuth';
import { User } from './core/models/User';
import { RecordManager } from './core/services/RecordManager';
import { AnalysisEngine } from './core/services/AnalysisEngine';
import { ReminderManager } from './core/services/ReminderManager';
import { AchievementManager,type Achievement } from './core/services/AchievementManager';
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
import { SettingsScreen } from './ui/SettingsScreen';
import { GoalStatus } from './ui/GoalStatus';
import { SleepChart } from './ui/SleepChart';
import { TutorialWrapper, TutorialTrigger } from './ui/Tutorial';
import { Achievements } from './ui/Achievements';
import { ShareableRecord } from './ui/ShareableRecord';
import html2canvas from 'html2canvas';

import { buttonStyle, cardStyle, inputStyle } from './ui/styles';
import type { StepType } from '@reactour/tour';

const recordManager = new RecordManager();
const analysisEngine = new AnalysisEngine();
const reminderManager = new ReminderManager();
const achievementManager = new AchievementManager();

type Screen = 'main' | 'settings';

export const isGoogleAuthEnabled = !!import.meta.env.VITE_GOOGLE_CLIENT_ID;

const tutorialSteps: StepType[] = [
  {
    selector: 'body',
    content: 'ようこそ！健康管理アプリの基本的な使い方をご案内します。',
  },
  {
    selector: '#date-picker-step',
    content: 'ここで日付を選択します。過去の記録を見たり、未来の予定を入力したりできます。',
  },
  {
    selector: '#data-input-section',
    content: '食事、体重、睡眠など、日々の健康データをここから入力します。',
  },
  {
    selector: '#ai-analysis-step',
    content: '記録が溜まったら、このボタンを押してAIによる健康アドバイスを受け取ってみましょう。',
  },
  {
    selector: '#google-fit-step',
    content: 'Googleアカウントでログインすると、Google Fitに記録された体重や睡眠データを自動で同期できます。',
  },
  {
    selector: '#settings-button-step',
    content: '身長や目標体重の変更、データのエクスポートなどはここから行えます。',
  },
];


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
  const [analysisResult, setAnalysisResult] = useState<string>('下のボタンを押して、AI分析を開始してください。');
  const [currentDate, setCurrentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<Screen>('main');
  const [editingRecord, setEditingRecord] = useState<HealthRecord | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [runTutorial, setRunTutorial] = useState(false);
  const [unlockedAchievements, setUnlockedAchievements] = useState<Achievement[]>([]);

  const [shareData, setShareData] = useState<{ records: HealthRecord[]; date: string } | null>(null);
  const shareableRef = useRef<HTMLDivElement>(null);

  const updateLocalUI = useCallback(async () => {
    try {
      const latestRecords = await recordManager.getRecords();
      setAllRecords([...latestRecords]);
      setEditingRecord(null);

      const newlyUnlocked = achievementManager.checkAchievements(latestRecords);
      if (newlyUnlocked.length > 0) {
        alert(`新しい実績を解除しました: ${newlyUnlocked.map(a => a.title).join(', ')}`);
      }
      setUnlockedAchievements(achievementManager.getUnlockedAchievements());

    } catch (error) {
      console.error("UIの更新中にエラーが発生しました:", error);
    }
  }, []);

  const handleRequestAnalysis = useCallback(async () => {
    if (allRecords.length < 3) {
      alert('分析するには、3件以上の記録が必要です。');
      return;
    }
    setIsAnalyzing(true);
    setAnalysisResult("AIが分析中です...");
    try {
        const resultText = await analysisEngine.analyze(allRecords);
        setAnalysisResult(resultText);
    } catch (error) {
        console.error("AI分析リクエスト中にエラーが発生しました:", error);
        setAnalysisResult("AI分析中にエラーが発生しました。");
    } finally {
        setIsAnalyzing(false);
    }
  }, [allRecords]);

  useEffect(() => {
    updateLocalUI();
  }, [updateLocalUI]);
  
  useEffect(() => {
    const disclaimerDismissed = localStorage.getItem('disclaimerDismissed');
    if (!disclaimerDismissed) {
      setIsDisclaimerOpen(true);
    } else {
      const tutorialCompleted = localStorage.getItem('tutorialCompleted');
      if (!tutorialCompleted) {
        setTimeout(() => setRunTutorial(true), 500);
      }
    }
  }, []);

  const handleCloseDisclaimer = () => {
    localStorage.setItem('disclaimerDismissed', 'true');
    setIsDisclaimerOpen(false);
    
    const tutorialCompleted = localStorage.getItem('tutorialCompleted');
    if (!tutorialCompleted) {
        setTimeout(() => setRunTutorial(true), 300);
    }
  };

  const handleTutorialFinish = () => {
    setRunTutorial(false);
    localStorage.setItem('tutorialCompleted', 'true');
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
    const selectedDate = new Date(currentDate.replace(/-/g, '/'));
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

  const handleShareDay = () => {
    if (recordsForSelectedDate.length > 0) {
      setShareData({ records: recordsForSelectedDate, date: currentDate });
    } else {
      alert('共有する記録がありません。');
    }
  };

  useEffect(() => {
    if (shareData && shareableRef.current) {
      const shareImage = async () => {
        const element = shareableRef.current!;
        try {
          const canvas = await html2canvas(element, {
            backgroundColor: null,
            scale: 2,
          });
          canvas.toBlob(async (blob) => {
            if (blob) {
              const fileName = `health-summary-${shareData.date}.png`;
              const file = new File([blob], fileName, { type: 'image/png' });

              if (navigator.share && navigator.canShare({ files: [file] })) {
                await navigator.share({
                  title: '今日の健康記録',
                  text: `${shareData.date}の健康記録を共有します！`,
                  files: [file],
                });
              } else {
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = fileName;
                link.click();
                URL.revokeObjectURL(link.href);
              }
            }
          }, 'image/png');
        } catch (error) {
          console.error('画像の生成または共有に失敗しました。', error);
          alert('画像の共有に失敗しました。');
        } finally {
          setShareData(null);
        }
      };
      setTimeout(shareImage, 100);
    }
  }, [shareData, user.name]);

  const maxDate = new Date().toISOString().split('T')[0];

  return (
    <TutorialWrapper steps={tutorialSteps} run={runTutorial} onTutorialFinish={handleTutorialFinish}>
      {shareData && (
        <div style={{ position: 'fixed', left: '-9999px', top: '-9999px' }}>
          <div ref={shareableRef}>
            <ShareableRecord
              records={shareData.records}
              date={shareData.date}
              userName={user.name}
            />
          </div>
        </div>
      )}
      <DisclaimerModal isOpen={isDisclaimerOpen} onClose={handleCloseDisclaimer} />
      <div className="App" style={{ maxWidth: '960px', margin: '0 auto', padding: '1rem', fontFamily: 'sans-serif' }}>
        <header style={{ borderBottom: '1px solid #ddd', paddingBottom: '20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <h1 style={{ color: '#2c3e50', margin: 0, fontSize: 'clamp(1.5rem, 5vw, 2rem)' }}>健康管理アプリ</h1>
            <div>
              {currentScreen === 'main' && (
                <button id="settings-button-step" onClick={() => setCurrentScreen('settings')} style={{ ...buttonStyle, width: 'auto', marginTop: 0, marginRight: '12px', backgroundColor: '#95a5a6' }}>
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
            
            <Achievements unlockedAchievements={unlockedAchievements} />

            <div id="google-fit-step" style={{...cardStyle, marginTop: '24px', marginBottom: '32px' }}>
              {isGoogleAuthEnabled ? (
                accessToken ? (
                  <>
                    <h2 style={{marginTop: 0}}>Google Fit データ連携</h2>
                    <WeightDataDisplay accessToken={accessToken} recordManager={recordManager} onSync={updateLocalUI} />
                    <SleepDataDisplay accessToken={accessToken} recordManager={recordManager} onSync={updateLocalUI} />
                  </>
                ) : (
                  <div style={{textAlign: 'center' }}>
                    <p>Googleでログインすると、Google Fitのデータを表示・同期できます。</p>
                  </div>
                )
              ) : (
                <div style={{textAlign: 'center', backgroundColor: '#f8f9f9' }}>
                  <p style={{margin: 0, color: '#7f8c8d'}}>
                    Google連携機能は現在設定されていません。<br/>
                    利用するには、開発者がアプリケーションにGoogle Client IDを設定する必要があります。
                  </p>
                </div>
              )}
            </div>

            <div style={{ ...cardStyle, marginBottom: '32px' }}>
              <h2 style={{marginTop: 0}}>分析と設定</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                <div id="ai-analysis-step">
                    <AnalysisResult 
                      analysisText={analysisResult} 
                      onAnalyzeClick={handleRequestAnalysis}
                      isAnalyzing={isAnalyzing}
                    />
                </div>
                <ReminderSettings reminderManager={reminderManager} />
              </div>
            </div>
            
            <div id="data-input-section" style={{ ...cardStyle }}>
              <h2 style={{marginTop: 0}}>データ入力</h2>
              <div id="date-picker-step" style={{ textAlign: 'center', marginBottom: '24px' }}>
                <label htmlFor="current-date-picker" style={{fontWeight: 'bold'}}>表示・記録する日付:</label>
                <input 
                  id="current-date-picker" 
                  type="date" 
                  value={currentDate} 
                  onChange={e => setCurrentDate(e.target.value)} 
                  style={{ ...inputStyle, width: 'auto', marginLeft: '8px' }}
                  max={maxDate}
                />
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

            <RecordList 
              records={recordsForSelectedDate} 
              onDeleteRecord={handleDeleteRecord} 
              onEditRecord={handleEditRecord} 
              onShareDay={handleShareDay}
            />
            
            <div style={{textAlign: 'center', marginTop: '2rem'}}>
                <TutorialTrigger />
            </div>
          </main>
        ) : (
          <SettingsScreen 
            user={user} 
            accessToken={accessToken}
            onBack={() => setCurrentScreen('main')}
            onSettingsChange={handleSettingsChange}
            allRecords={allRecords}
            onImportData={handleImportData}
          />
        )}
      </div>
    </TutorialWrapper>
  );
}

export default App;
