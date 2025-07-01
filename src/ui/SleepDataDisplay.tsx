// src/ui/SleepDataDisplay.tsx
import React, { useEffect, useMemo } from 'react';
import { useSleepData, type SleepSegment } from '../hooks/useSleepData';
import type { RecordManager } from '../core/services/RecordManager';
import { SleepRecord } from '../core/models/SleepRecord';
import { buttonStyle } from './styles';

interface SleepDataDisplayProps {
  accessToken: string | null;
  recordManager: RecordManager;
  onSync: () => void;
}

// 1日の睡眠データをグループ化・集計するためのヘルパー
const groupSleepDataByDay = (segments: SleepSegment[]) => {
  const grouped: { [key: string]: { date: Date, totalMinutes: number, stages: { [key: string]: number } } } = {};

  segments.forEach(seg => {
    // 睡眠の終了時刻をその日の日付とするのが一般的
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
  const { sleepSegments, isLoading, error, fetchData } = useSleepData(accessToken);

  useEffect(() => {
    if (accessToken) {
      fetchData();
    }
  }, [accessToken, fetchData]);

  const dailySleepSummary = useMemo(() => groupSleepDataByDay(sleepSegments), [sleepSegments]);

  const handleSyncClick = async () => {
    if (dailySleepSummary.length === 0) {
      alert('同期できる睡眠データがありません。');
      return;
    }
    for (const day of dailySleepSummary) {
      const sleepHours = day.totalMinutes / 60;
      // 質はAPIから取得できないため、合計時間で簡易的に判断
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
      {isLoading && <p>読み込み中...</p>}
      {error && <p style={{ color: 'red' }}>エラー: {error.message}</p>}

      {!isLoading && !error && (
        <>
          {dailySleepSummary.length === 0 ? (
            <p>過去7日間の睡眠データはありません。</p>
          ) : (
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
          <button onClick={handleSyncClick} disabled={dailySleepSummary.length === 0} style={{ ...buttonStyle, width: 'auto', marginTop: '16px' }}>
            このデータをローカルに同期
          </button>
        </>
      )}
    </div>
  );
};