// src/ui/WeightDataDisplay.tsx
import React, { useEffect } from 'react';
import { useWeightData, type WeightDataPoint } from '../hooks/useWeightData';
import type { RecordManager } from '../core/services/RecordManager';
import { WeightRecord } from '../core/models/WeightRecord';
import { buttonStyle } from './styles';

interface WeightDataDisplayProps {
  accessToken: string | null;
  recordManager: RecordManager;
  onSync: () => void; // 同期完了を親に通知するコールバック
}

export const WeightDataDisplay: React.FC<WeightDataDisplayProps> = ({ accessToken, recordManager, onSync }) => {
  const { weightData, isLoading, error, fetchData } = useWeightData(accessToken);

  // コンポーネントが表示された時、またはaccessTokenが変わった時にデータを取得
  useEffect(() => {
    if (accessToken) {
      fetchData();
    }
  }, [accessToken, fetchData]);

  const handleSyncClick = async () => {
    if (weightData.length === 0) {
      alert('同期できる体重データがありません。');
      return;
    }
    for (const w of weightData) {
      const record = new WeightRecord(`gf-w-${w.date.getTime()}`, 'user-001', w.date, w.weightKg);
      await recordManager.saveRecord(record);
    }
    alert(`${weightData.length}件の体重データをローカルに同期しました。`);
    onSync(); // 親コンポーネントにUI更新を依頼
  };

  return (
    <div style={{ marginTop: '24px' }}>
      <h4>体重データ (Google Fit)</h4>
      {isLoading && <p>読み込み中...</p>}
      {error && <p style={{ color: 'red' }}>エラー: {error.message}</p>}
      
      {!isLoading && !error && (
        <>
          {weightData.length === 0 ? (
            <p>過去1ヶ月の体重データはありません。</p>
          ) : (
            <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #eee', padding: '8px', borderRadius: '8px' }}>
              <table>
                <thead>
                  <tr>
                    <th>日付</th>
                    <th>平均体重 (kg)</th>
                  </tr>
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
          <button onClick={handleSyncClick} disabled={weightData.length === 0} style={{ ...buttonStyle, width: 'auto', marginTop: '16px' }}>
            このデータをローカルに同期
          </button>
        </>
      )}
    </div>
  );
};