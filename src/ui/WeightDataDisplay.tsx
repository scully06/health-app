// src/ui/WeightDataDisplay.tsx
import React, { useState } from 'react';
import { useWeightData } from '../hooks/useWeightData';
import type { RecordManager } from '../core/services/RecordManager';
import { WeightRecord } from '../core/models/WeightRecord';
import { buttonStyle } from './styles';

interface WeightDataDisplayProps {
  accessToken: string | null;
  recordManager: RecordManager;
  onSync: () => void;
}

export const WeightDataDisplay: React.FC<WeightDataDisplayProps> = ({ accessToken, recordManager, onSync }) => {
  const { weightData, isLoading, error, fetchWeightData } = useWeightData(accessToken);
  
  const today = new Date();
  const thirtyDaysAgo = new Date(new Date().setDate(today.getDate() - 30));

  const [startDate, setStartDate] = useState(thirtyDaysAgo.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);

  const handleFetchClick = () => {
    fetchWeightData(new Date(startDate), new Date(endDate + "T23:59:59"));
  };
  
  const handleSyncAllClick = async () => {
    if (weightData.length === 0) {
      alert('同期できる体重データがありません。');
      return;
    }
    for (const w of weightData) {
      const record = new WeightRecord(`gf-w-${w.date.getTime()}`, 'user-001', w.date, w.weightKg);
      await recordManager.saveRecord(record);
    }
    alert(`${weightData.length}件の体重データをローカルに同期しました。`);
    onSync();
  };

  return (
    <div style={{ marginTop: '24px' }}>
      <h4>体重データ (Google Fit)</h4>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        <span>〜</span>
        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        <button onClick={handleFetchClick} disabled={isLoading} style={{ ...buttonStyle, width: 'auto', marginTop: 0, padding: '8px 12px' }}>
          {isLoading ? '取得中...' : 'この期間のデータを取得'}
        </button>
      </div>
      
      {error && <p style={{ color: 'red' }}>エラー: {error.message}</p>}
      
      {!isLoading && !error && (
        <>
          {weightData.length === 0 ? (
            <p>指定期間の体重データはありません。</p>
          ) : (
            <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #eee', padding: '8px', borderRadius: '8px' }}>
              <table>
                <thead>
                  <tr><th>日付</th><th>平均体重 (kg)</th></tr>
                </thead>
                <tbody>
                  {weightData.map((point) => (
                    <tr key={point.date.toISOString()}>
                      <td>{point.date.toLocaleDateString()}</td>
                      <td>{point.weightKg.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <button onClick={handleSyncAllClick} disabled={weightData.length === 0} style={{ ...buttonStyle, width: 'auto', marginTop: '16px' }}>
            表示中の全データを同期
          </button>
        </>
      )}
    </div>
  );
};