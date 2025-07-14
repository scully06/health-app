// src/ui/SettingsScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
import { User } from '../core/models/User';
import { cardStyle, inputStyle, buttonStyle } from './styles';
import { HealthRecord } from '../core/models/HealthRecord';
import { getClientIdFromStorage, saveClientIdToStorage } from '../utils/auth';
import { GoogleDriveSync } from '../core/services/GoogleDriveSync';

interface ServerStatus {
  isGoogleAuthReady: boolean;
  isGeminiReady: boolean;
}

interface SettingsScreenProps {
  user: User;
  onBack: () => void;
  onSettingsChange: (settings: { height: number; targetWeight?: number; targetCalories?: number }) => void;
  allRecords: HealthRecord[];
  onImportData: (records: HealthRecord[]) => void;
  accessToken: string | null;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ user, onBack, onSettingsChange, allRecords, onImportData, accessToken }) => {
  const [height, setHeight] = useState((user.height * 100).toString());
  const [targetWeight, setTargetWeight] = useState(user.targetWeight?.toString() || '');
  const [targetCalories, setTargetCalories] = useState(user.targetCalories?.toString() || '');
  const [feedback, setFeedback] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [googleClientId, setGoogleClientId] = useState(getClientIdFromStorage() || '');
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/status');
        if (response.ok) {
          const status = await response.json();
          setServerStatus(status);
        } else {
          setServerStatus({ isGoogleAuthReady: false, isGeminiReady: false });
        }
      } catch (error) {
        console.error("Failed to fetch server status:", error);
        setServerStatus({ isGoogleAuthReady: false, isGeminiReady: false });
      }
    };
    fetchStatus();
  }, []);

  const handleSaveSettings = () => {
    const heightValueCm = parseFloat(height);
    const MIN_HEIGHT = 50;
    const MAX_HEIGHT = 300;
    if (isNaN(heightValueCm) || heightValueCm < MIN_HEIGHT || heightValueCm > MAX_HEIGHT) {
      setFeedback(`エラー: 身長は${MIN_HEIGHT}cmから${MAX_HEIGHT}cmの間で入力してください。`);
      return;
    }
    const targetWeightValue = targetWeight ? parseFloat(targetWeight) : undefined;
    if (targetWeightValue !== undefined && (isNaN(targetWeightValue) || targetWeightValue <= 0)) {
        setFeedback('エラー: 正しい目標体重を入力してください。');
        return;
    }
    const targetCaloriesValue = targetCalories ? parseInt(targetCalories, 10) : undefined;
    if (targetCaloriesValue !== undefined && (isNaN(targetCaloriesValue) || targetCaloriesValue < 0)) {
        setFeedback('エラー: 正しい目標カロリーを入力してください。');
        return;
    }
    onSettingsChange({
      height: heightValueCm / 100,
      targetWeight: targetWeightValue,
      targetCalories: targetCaloriesValue,
    });

    saveClientIdToStorage(googleClientId);

    setFeedback('設定を保存しました。クライアントIDを変更した場合は、ページのリロードが必要です。');
    setTimeout(() => setFeedback(''), 5000);
  };
  
  const handleExport = () => {
    if (allRecords.length === 0) {
      alert('エクスポートする記録がありません。');
      return;
    }
    const jsonData = JSON.stringify(allRecords, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `health-app-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setFeedback('データをエクスポートしました。');
  };
  
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!window.confirm('現在のすべての記録が上書きされます。よろしいですか？')) {
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') throw new Error('File content is not a string');
        const importedRecords = JSON.parse(text);
        onImportData(importedRecords);
      } catch (error) {
        alert('ファイルの読み込みに失敗しました。JSON形式が正しくない可能性があります。');
        console.error(error);
      }
      event.target.value = '';
    };
    reader.readAsText(file);
  };

  const handleGoogleDriveSync = async () => {
    if (!accessToken) {
      alert('Googleにログインしていません。');
      return;
    }
    if (allRecords.length === 0) {
      alert('バックアップする記録がありません。');
      return;
    }

    setIsSyncing(true);
    setFeedback('Google Driveにバックアップ中...');
    try {
      const driveSync = new GoogleDriveSync(accessToken);
      await driveSync.saveBackup(allRecords);
      setFeedback('Google Driveへのバックアップが完了しました！');
    } catch (error: any) {
      setFeedback(`エラー: ${error.message}`);
      console.error(error);
    } finally {
      setIsSyncing(false);
      setTimeout(() => setFeedback(''), 5000);
    }
  };


  const StatusIndicator: React.FC<{isReady: boolean; label: string}> = ({ isReady, label }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #eee' }}>
      <span>{label}</span>
      <span style={{ color: isReady ? '#27ae60' : '#c0392b', fontWeight: 'bold', fontSize: '14px' }}>
        {isReady ? '✔ 設定済み' : '✖ 未設定'}
      </span>
    </div>
  );

  return (
    <div style={{ ...cardStyle, maxWidth: '600px', margin: '40px auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
        <button onClick={onBack} style={{ ...buttonStyle, width: 'auto', padding: '8px 16px', marginTop: 0, marginRight: '16px', backgroundColor: '#7f8c8d' }}>
          ← 戻る
        </button>
        <h2 style={{ margin: 0 }}>設定</h2>
      </div>

      <div>
        <h3 style={{ marginTop: 0, color: '#2c3e50' }}>APIキーとIDの設定</h3>
        <div style={{ padding: '16px', backgroundColor: '#f8f9f9', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
          <h4 style={{marginTop: 0, marginBottom: '12px'}}>設定状況の診断</h4>
          {!serverStatus ? (
            <p>サーバーの状態を確認中...</p>
          ) : (
            <>
              <StatusIndicator isReady={!!googleClientId} label="Google Client ID (ブラウザ側)" />
              <StatusIndicator isReady={serverStatus.isGoogleAuthReady} label="Google Client Secret (サーバー側)" />
              <StatusIndicator isReady={serverStatus.isGeminiReady} label="Gemini API Key (サーバー側)" />
              
              {(!serverStatus.isGoogleAuthReady || !serverStatus.isGeminiReady || !googleClientId) && (
                <div style={{fontSize: '13px', color: '#34495e', marginTop: '16px', padding: '12px', backgroundColor: '#fffbe6', border: '1px solid #ffe58f', borderRadius: '8px'}}>
                  <strong>アクションが必要です:</strong><br/>
                  未設定の項目があります。以下の手順に従って設定してください。
                </div>
              )}
            </>
          )}
        </div>

        <div style={{ marginTop: '16px' }}>
          <label htmlFor="google-client-id-input">1. Google Client ID を入力</label>
          <input id="google-client-id-input" type="text" value={googleClientId} onChange={(e) => setGoogleClientId(e.target.value)} placeholder="Google Cloudで取得したID" style={inputStyle} />
          <p style={{fontSize: '12px', color: '#666', margin: '4px 0 0'}}>このIDは安全なため、ブラウザに保存されます。</p>
        </div>

         <div style={{ marginTop: '16px' }}>
          <label>2. サーバー側のキーを設定</label>
           <div style={{fontSize: '13px', color: '#34495e', padding: '12px', backgroundColor: '#f8f9f9', border: '1px solid #e0e0e0', borderRadius: '8px'}}>
              <p style={{marginTop: 0}}>
                <code>GOOGLE_CLIENT_SECRET</code>と<code>GEMINI_API_KEY</code>は、セキュリティのためサーバーでのみ設定します。
              </p>
              プロジェクトのルートに <code>.env</code> ファイルを作成し、以下の内容を記述してサーバーを再起動してください。
              <pre style={{backgroundColor: '#e9ecef', padding: '8px', borderRadius: '4px', marginTop: '8px', whiteSpace: 'pre-wrap', wordBreak: 'break-all'}}>
                <code>
                  VITE_GOOGLE_CLIENT_ID="{googleClientId || 'ここにクライアントID'}"<br/>
                  GOOGLE_CLIENT_SECRET="ここにシークレットを貼り付け"<br/>
                  GEMINI_API_KEY="ここにAPIキーを貼り付け"
                </code>
              </pre>
            </div>
        </div>
      </div>

      <hr style={{ margin: '24px 0', border: 0, borderTop: '1px solid #eee' }} />
      
      <div>
        <h3 style={{ marginTop: 0, color: '#2c3e50' }}>ユーザー情報</h3>
        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="height-input">身長 (cm)</label>
          <input id="height-input" type="number" step="1" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="例: 175" style={inputStyle} />
        </div>
        <div style={{ marginBottom: '16px' }}>
            <label htmlFor="target-weight-input">目標体重 (kg)</label>
            <input id="target-weight-input" type="number" step="0.1" value={targetWeight} onChange={e => setTargetWeight(e.target.value)} placeholder="未設定" style={inputStyle} />
        </div>
        <div style={{ marginBottom: '16px' }}>
            <label htmlFor="target-calories-input">1日の目標摂取カロリー (kcal)</label>
            <input id="target-calories-input" type="number" step="10" value={targetCalories} onChange={e => setTargetCalories(e.target.value)} placeholder="未設定" style={inputStyle} />
        </div>
      </div>

      <hr style={{ margin: '24px 0', border: 0, borderTop: '1px solid #eee' }} />
      <h3 style={{ marginTop: 0, color: '#2c3e50' }}>データ管理</h3>
      <div style={{display: 'flex', gap: '16px', flexWrap: 'wrap'}}>
          <button onClick={handleImportClick} style={{...buttonStyle, flex: 1, minWidth: '120px'}}>インポート</button>
          <button onClick={handleExport} style={{...buttonStyle, flex: 1, minWidth: '120px', backgroundColor: '#2ecc71'}}>エクスポート</button>
          <button 
            onClick={handleGoogleDriveSync} 
            style={{...buttonStyle, flex: '1 1 100%', backgroundColor: '#4285F4'}}
            disabled={!accessToken || isSyncing}
          >
            {isSyncing ? 'バックアップ中...' : 'Google Driveにバックアップ'}
          </button>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        accept="application/json"
      />

      <button onClick={handleSaveSettings} style={{...buttonStyle, marginTop: '24px'}}>すべての設定を保存</button>
      {feedback && <p style={{ marginTop: '12px', color: feedback.startsWith('エラー') ? '#c0392b' : '#27ae60' }}>{feedback}</p>}
    </div>
  );
};
