// src/App.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';

import { User } from './core/models/User';
import { RecordManager } from './core/services/RecordManager';
import { AnalysisEngine } from './core/services/AnalysisEngine';
import { WeightRecord } from './core/models/WeightRecord';
import { SleepRecord } from './core/models/SleepRecord';
import type { HealthRecord } from './core/models/HealthRecord';

import { AnalysisResult } from './ui/AnalysisResult';
import { WeightInputForm } from './ui/WeightInputForm';
import { SleepInputForm } from './ui/SleepInputForm';
import { WeightChart } from './ui/WeightChart';
import { RecordList } from './ui/RecordList';
import { ReminderManager } from './core/services/ReminderManager'; //【追加】
import { ReminderSettings } from './ui/ReminderSettings'; //【追加】

const GOOGLE_CLIENT_ID = "94773352736-k2jbq7iafh98322ce2vdkievtsnhug82.apps.googleusercontent.com";

const user = new User('user-001', '田中 太郎', 1.75);
const recordManager = new RecordManager();
const analysisEngine = new AnalysisEngine();
const reminderManager = new ReminderManager(); //【追加】ReminderManagerのインスタンス化


// Google Fitと同期するためのボタンコンポーネント
function GoogleFitSyncButton({ onSyncSuccess }: { onSyncSuccess: (data: any) => void }) {
  const handleSuccess = async (codeResponse: any) => {
    try {
      console.log('[GoogleFit] 認証コードを取得しました:', codeResponse.code);
      alert('サーバーと通信してGoogle Fitデータを取得します...');
      
      const serverRes = await fetch('/api/google-fit/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeResponse.code }),
      });

      if (!serverRes.ok) {
        const errorData = await serverRes.json();
        throw new Error(errorData.error || 'サーバーとの同期に失敗しました。');
      }

      const data = await serverRes.json();
      onSyncSuccess(data); // 親コンポーネントにデータを渡す
      alert('Google Fitとの同期が完了しました！');
    } catch (error: any) {
      console.error(error);
      alert(`同期に失敗しました: ${error.message}`);
    }
  };

  const login = useGoogleLogin({
    onSuccess: handleSuccess,
    onError: (error) => console.error('Google Login Failed:', error),
    flow: 'auth-code',
    //【修正】スコープをより広範なものに
    scope: [
      'https://www.googleapis.com/auth/fitness.activity.read', // 睡眠など
      'https://www.googleapis.com/auth/fitness.body.read',       // 体重など
      'https://www.googleapis.com/auth/fitness.location.read',    // 位置情報
      'https://www.googleapis.com/auth/fitness.nutrition.read',   // 栄養情報
    ].join(' '), // 配列をスペースで結合
  });

  return <button onClick={() => login()}>Google Fitと同期する</button>;
}


// メインのアプリケーションコンポーネント
function App() {
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [analysisResult, setAnalysisResult] = useState<string>('分析結果を読み込み中...');

  /**
   *【最重要修正】UIの再描画を確実にトリガーする関数
   * この関数が呼ばれるたびに、必ずUIが更新されるようにする
   */
  const forceUpdateUI = useCallback(async () => {
    console.log('[App] UIの強制更新を開始します...');
    
    // 1. RecordManagerから最新のデータを取得
    const latestRecords = await recordManager.getRecords(user.id);
    
    // 2.【重要】新しい配列としてコピーを作成する
    // これにより、Reactは「参照が変更された」と確実に認識し、再描画を行う
    const newRecordsArray = [...latestRecords];
    setRecords(newRecordsArray);
    
    // 3. AI分析を実行
    const resultText = await analysisEngine.analyze(newRecordsArray);
    setAnalysisResult(resultText);

    console.log('[App] UIの強制更新が完了しました。');
  }, []); // 依存配列は空

  // 初回ロード時にデータを取得してUIを更新する
  useEffect(() => {
    forceUpdateUI();
  }, [forceUpdateUI]);

  // 同期成功時のデータ処理
  const handleSyncSuccess = async (data: { weights: any[], sleeps: any[] }) => {
    console.log('[App] 同期データを受信:', data);
    if (!data || (!data.weights?.length && !data.sleeps?.length)) {
      alert('Google Fitから取得できる新しいデータはありませんでした。');
      return;
    }
    
    // データを一括で保存
    for (const w of data.weights) {
      const record = new WeightRecord(`gf-w-${new Date(w.date).getTime()}`, user.id, new Date(w.date), w.weight);
      await recordManager.saveRecord(record);
    }
    for (const s of data.sleeps) {
      const record = new SleepRecord(`gf-s-${new Date(s.date).getTime()}`, user.id, new Date(s.date), s.sleepTime, SleepRecord.Quality.NORMAL);
      await recordManager.saveRecord(record);
    }
    
    //【重要】UIの強制更新関数を呼び出す
    await forceUpdateUI();
    
    alert('Google Fitとの同期と記録の更新が完了しました！');
  };

  // 手動保存後の処理
  const handleRecordSaved = async () => {
    // UIの強制更新関数を呼び出す
    await forceUpdateUI();
  };

  // 削除後の処理
  const handleDeleteRecord = async (recordId: string) => {
    await recordManager.deleteRecord(recordId);
    // UIの強制更新関数を呼び出す
    await forceUpdateUI();
    alert('記録を削除しました。');
  };

  return (
    <div className="App" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <header>
        <h1 style={{ textAlign: 'center', color: '#2c3e50' }}>健康管理アプリ</h1>
        <div style={{ textAlign: 'center', margin: '16px 0' }}>
          <GoogleFitSyncButton onSyncSuccess={handleSyncSuccess} />
        </div>
      </header>
      <main>
        <AnalysisResult analysisText={analysisResult} />
        <hr style={{ margin: '32px 0', border: 0, borderTop: '1px solid #eee' }} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
          <div style={{ flex: '1 1 300px' }}>
            {/*【修正】onRecordSavedには新しいハンドラを渡す*/}
            <WeightInputForm user={user} recordManager={recordManager} analysisEngine={analysisEngine} onRecordSaved={handleRecordSaved} />
          </div>
          {/*【追加】リマインダー設定コンポーネント */}
        <ReminderSettings reminderManager={reminderManager} />

        <hr style={{ margin: '32px 0', border: 0, borderTop: '1px solid #eee' }} />
          <div style={{ flex: '1 1 300px' }}>
            {/*【修正】onRecordSavedには新しいハンドラを渡す*/}
            <SleepInputForm user={user} recordManager={recordManager} onRecordSaved={handleRecordSaved} />
          </div>
        </div>
        <hr style={{ margin: '32px 0', border: 0, borderTop: '1px solid #eee' }} />
        <div style={{ marginBottom: '24px' }}>
          <WeightChart records={records} />
        </div>
        {/*【修正】onDeleteRecordには新しいハンドラを渡す*/}
        <RecordList records={records} onDeleteRecord={handleDeleteRecord} />
      </main>
    </div>
  );
}


export default function AppWrapper() {
  if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === "ここにあなたのGoogle Client IDを貼り付けてください") {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'red', fontFamily: 'sans-serif' }}>
        <h1>設定エラー</h1>
        <p>Google Client IDがApp.tsxファイルに設定されていません。</p>
        <p>GCPでクライアントIDを取得し、コード内のプレースホルダーを置き換えてください。</p>
      </div>
    );
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  );
}