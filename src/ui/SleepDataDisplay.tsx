// src/ui/SleepDataDisplay.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useSleepData, type SleepSegment } from '../hooks/useSleepData';
import type { RecordManager } from '../core/services/RecordManager';
import { SleepRecord, type SleepStage, type SleepStageDurations } from '../core/models/SleepRecord';
import { buttonStyle } from './styles';

interface SleepDataDisplayProps {
  accessToken: string | null;
  recordManager: RecordManager;
  onSync: () => void;
}

const stageNameMapping: { [key: string]: SleepStage } = {
  'AWAKE': 'awake', 'SLEEP': 'light', 'LIGHT': 'light', 'DEEP': 'deep', 'REM': 'rem', 'OUT_OF_BED': 'awake',
};

//【アルゴリズム実装】ステップ4〜7: 睡眠セグメントを連結して「一晩の睡眠」にグループ化する
const groupSleepDataByNight = (segments: SleepSegment[]) => {
  if (segments.length === 0) return [];

  const sleepSessions: { date: Date, totalMinutes: number, stages: SleepStageDurations }[] = [];
  let currentSession: { date: Date, totalMinutes: number, stages: SleepStageDurations, lastEndTime: Date } | null = null;

  // 8時間の閾値（ミリ秒）。これ以上離れていたら別の睡眠と判断
  const SESSION_BREAK_THRESHOLD_MS = 8 * 60 * 60 * 1000;

  for (const segment of segments) {
    const mappedStage = stageNameMapping[segment.stage as keyof typeof stageNameMapping];
    if (!mappedStage) continue; // マッピングできないステージは無視

    if (currentSession === null) {
      // 最初のセッションを開始
      currentSession = {
        date: segment.endTime, // 仮の日付として終了時刻を設定
        totalMinutes: segment.durationMinutes,
        stages: { [mappedStage]: segment.durationMinutes },
        lastEndTime: segment.endTime,
      };
    } else {
      const timeDiff = segment.startTime.getTime() - currentSession.lastEndTime.getTime();
      
      if (timeDiff < SESSION_BREAK_THRESHOLD_MS) {
        // ステップ7: 時間差が小さいので、セッションを連結する
        currentSession.totalMinutes += segment.durationMinutes;
        currentSession.stages[mappedStage] = (currentSession.stages[mappedStage] || 0) + segment.durationMinutes;
        currentSession.lastEndTime = segment.endTime;
        currentSession.date = segment.endTime; // セッションの代表日付を最後のセグメントの終了日に更新
      } else {
        // ステップ6: 時間差が大きいので、前のセッションを確定し、新しいセッションを開始する
        sleepSessions.push({
          date: currentSession.date,
          totalMinutes: currentSession.totalMinutes,
          stages: currentSession.stages,
        });
        currentSession = {
          date: segment.endTime,
          totalMinutes: segment.durationMinutes,
          stages: { [mappedStage]: segment.durationMinutes },
          lastEndTime: segment.endTime,
        };
      }
    }
  }

  // 最後のセッションをリストに追加
  if (currentSession) {
    sleepSessions.push({
      date: currentSession.date,
      totalMinutes: currentSession.totalMinutes,
      stages: currentSession.stages,
    });
  }
  
  // 日付の新しい順にソートして返す
  return sleepSessions.sort((a, b) => b.date.getTime() - a.date.getTime());
};

export const SleepDataDisplay: React.FC<SleepDataDisplayProps> = ({ accessToken, recordManager, onSync }) => {
  const { sleepSegments, isLoading, error, fetchSleepData } = useSleepData(accessToken);

  const today = new Date();
  const sevenDaysAgo = new Date(new Date().setDate(today.getDate() - 7));
  
  const [startDate, setStartDate] = useState(sevenDaysAgo.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);
  
  useEffect(() => {
    if (accessToken) {
      handleFetchClick();
    }
  }, [accessToken]);
  
  //【重要】呼び出す関数を`groupSleepDataByNight`に変更
  const dailySleepSummary = useMemo(() => groupSleepDataByNight(sleepSegments), [sleepSegments]);

  const handleFetchClick = () => {
    if (accessToken) {
      // 終了日はユーザーが選択した日の終わりまでを指定
      fetchSleepData(new Date(startDate), new Date(endDate + "T23:59:59"));
    }
  };

  const handleSyncAllClick = async () => {
    // この部分は変更なし（新しいデータ構造に既に対応済み）
    if (dailySleepSummary.length === 0) {
      alert('同期できる睡眠データがありません。');
      return;
    }
    try {
      for (const day of dailySleepSummary) {
        const record = new SleepRecord(`gf-s-${day.date.getTime()}`, 'user-001', day.date, day.stages);
        await recordManager.saveRecord(record);
      }
      alert(`${dailySleepSummary.length}日分の睡眠データをローカルに同期しました。`);
      onSync();
    } catch (err) {
      console.error('同期エラー:', err);
      alert('同期中にエラーが発生しました。');
    }
  };

  const formatStageDetails = (stages: SleepStageDurations) => {
    const parts: string[] = [];
    if (stages.deep) parts.push(`深: ${stages.deep.toFixed(0)}分`);
    if (stages.light) parts.push(`浅: ${stages.light.toFixed(0)}分`);
    if (stages.rem) parts.push(`REM: ${stages.rem.toFixed(0)}分`);
    if (stages.awake) parts.push(`覚醒: ${stages.awake.toFixed(0)}分`);
    return parts.join(' / ');
  };

  return (
    // JSXの表示部分は変更なし
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

      {error && <p style={{ color: 'red', border: '1px solid red', padding: '12px', borderRadius: '8px' }}><strong>エラー:</strong> {error.message}</p>}

      {!isLoading && !error && (
        <>
          {dailySleepSummary.length === 0 && accessToken ? (
            <p>指定期間の睡眠データはありません。</p>
          ) : dailySleepSummary.length > 0 && (
            <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #eee', padding: '8px', borderRadius: '8px' }}>
              <table>
                <thead><tr><th>就寝日</th><th>合計睡眠時間</th><th>内訳</th></tr></thead>
                <tbody>
                  {dailySleepSummary.map(day => (
                    <tr key={day.date.toISOString()}>
                      <td>{day.date.toLocaleDateString()}</td>
                      <td>{(day.totalMinutes / 60).toFixed(1)} 時間</td>
                      <td style={{ fontSize: '12px' }}>{formatStageDetails(day.stages)}</td>
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