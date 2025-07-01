// src/ui/SleepDataDisplay.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useSleepData, type SleepSegment } from '../hooks/useSleepData';
import type { RecordManager } from '../core/services/RecordManager';
import { SleepRecord } from '../core/models/SleepRecord';
import { buttonStyle } from './styles';

interface SleepDataDisplayProps {
  accessToken: string | null;
  recordManager: RecordManager;
  onSync: () => void;
}

const groupSleepDataByDay = (segments: SleepSegment[]) => {
  const grouped: { [key: string]: { date: Date, totalMinutes: number, stages: { [key: string]: number } } } = {};
  segments.forEach(seg => {
    const dateKey = seg.endTime.toLocaleDateString('ja-JP');
    if (!grouped[dateKey]) {
      grouped[dateKey] = { date: seg.endTime, totalMinutes: 0, stages: {} };
    }
    grouped[dateKey].totalMinutes += seg.durationMinutes;
    grouped[dateKey].stages[seg.stage] = (grouped[dateKey].stages[seg.stage] || 0) + seg.durationMinutes;
  });
  return Object.values(grouped).sort((a, b) => b.date.getTime() - a.date.getTime());
};

export const SleepDataDisplay: React.FC<SleepDataDisplayProps> = ({ accessToken, recordManager, onSync }) => {
  const { sleepSegments, isLoading, error, fetchSleepData } = useSleepData(accessToken);

  const today = new Date();
  const sevenDaysAgo = new Date(new Date().setDate(today.getDate() - 7));
  
  const [startDate, setStartDate] = useState(sevenDaysAgo.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);
  
  useEffect(() => {
    if (accessToken) {
      fetchSleepData(new Date(startDate), new Date(endDate + "T23:59:59"));
    }
  }, [accessToken]);

  const dailySleepSummary = useMemo(() => groupSleepDataByDay(sleepSegments), [sleepSegments]);

  const handleFetchClick = () => {
    fetchSleepData(new Date(startDate), new Date(endDate + "T23:59:59"));
  };

  const handleSyncAllClick = async () => {
    if (dailySleepSummary.length === 0) {
      alert('同期できる睡眠データがありません。');
      return;
    }
    for (const day of dailySleepSummary) {
      const sleepHours = day.totalMinutes / 60;
      const quality = sleepHours > 7 ? '良い' : sleepHours > 5 ? '普通' : '悪い';
      const record = new SleepRecord(`gf-s-${day.date.getTime()}`, 'user-001', day.date, sleepHours, quality);
      await recordManager.saveRecord(record);
    }
    alert(`${dailySleepSummary.length}日分の睡眠データをローカルに同期しました。`);
    onSync();
  };

  return (
    <div style={{ marginTop: '24px' }}>
      <h4>睡眠データ (Google Fit)</h4>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        <span>〜</span>
        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        <button onClick={handleFetchClick} disabled={isLoading || !accessToken} style={{ ...buttonStyle, width: 'auto', marginTop: 0, padding: '8px 12px' }}>
          {isLoading ? '取得中...' : 'この期間のデータを取得'}
        </button>
      </div>

      {error && <p style={{ color: 'red' }}>エラー: {error.message}</p>}

      {!isLoading && !error && (
        <>
          {dailySleepSummary.length === 0 ? (
            <p>指定期間の睡眠データはありません。</p>
          ) : (
            //【重要】このJSX部分が抜けていました
            <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #eee', padding: '8px', borderRadius: '8px' }}>
              <table>
                <thead>
                  <tr>
                    <th>日付</th>
                    <th>合計睡眠時間</th>
                    <th>内訳</th>
                  </tr>
                </thead>
                <tbody>
                  {dailySleepSummary.map(day => (
                    <tr key={day.date.toISOString()}>
                      <td>{day.date.toLocaleDateString()}</td>
                      <td>{(day.totalMinutes / 60).toFixed(1)} 時間</td>
                      <td style={{ fontSize: '12px' }}>
                        {Object.entries(day.stages).map(([stage, mins]) => `${stage}: ${mins.toFixed(0)}分`).join(', ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <button onClick={handleSyncAllClick} disabled={dailySleepSummary.length === 0} style={{ ...buttonStyle, width: 'auto', marginTop: '16px' }}>
            表示中の全データを同期
          </button>
        </>
      )}
    </div>
  );
};