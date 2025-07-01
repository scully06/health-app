// src/ui/RecordList.tsx
import React from 'react';
import { HealthRecord } from '../core/models/HealthRecord';
import { WeightRecord } from '../core/models/WeightRecord';
import { SleepRecord, type SleepStageDurations } from '../core/models/SleepRecord';
import { FoodRecord } from '../core/models/FoodRecord';
import { cardStyle } from './styles';

interface RecordListProps {
  records: HealthRecord[];
  onDeleteRecord: (recordId: string) => void; //【追加】削除関数のためのprop
}

const formatSleepDetails = (durations: SleepStageDurations): string => {
  const totalHours = (Object.values(durations).reduce((sum, current) => sum + (current || 0), 0) / 60).toFixed(1);
  const details = (['deep', 'light', 'rem', 'awake'] as const)
    .map(stage => {
      const mins = durations[stage];
      if (mins && mins > 0) {
        const labels = { deep: '深', light: '浅', rem: 'REM', awake: '覚醒' };
        return `${labels[stage]}: ${mins}分`;
      }
      return null;
    }).filter(Boolean).join(' / ');
  return `合計 ${totalHours}時間 (${details})`;
};

export const RecordList: React.FC<RecordListProps> = ({ records, onDeleteRecord }) => {
  const sortedRecords = [...records].sort((a, b) => {
    const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (dateDiff !== 0) return dateDiff;
    return b.id.localeCompare(a.id);
  });

  const totalCalories = records
    .filter((r): r is FoodRecord => r instanceof FoodRecord)
    .reduce((sum, r) => sum + r.calories, 0);

  //【追加】削除ボタンがクリックされたときのハンドラ
  const handleDeleteClick = (recordId: string) => {
    if (window.confirm('この記録を本当に削除しますか？')) {
      onDeleteRecord(recordId);
    }
  };

  return (
    <div style={{...cardStyle, marginTop: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ marginTop: 0, color: '#2c3e50' }}>選択日の記録</h3>
        {totalCalories > 0 && <strong style={{ color: '#e67e22' }}>合計: {totalCalories} kcal</strong>}
      </div>
      {sortedRecords.length === 0 ? (
        <p style={{ color: '#7f8c8d' }}>記録はまだありません。</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: '16px 0 0' }}>
          {sortedRecords.map((record) => {
            let content;
            if (record instanceof WeightRecord) content = <><strong>{record.weight} kg</strong> (体重)</>;
            else if (record instanceof SleepRecord) content = <span style={{ color: '#336699' }}><strong>睡眠:</strong> {formatSleepDetails(record.stageDurations)}</span>;
            else if (record instanceof FoodRecord) content = <span style={{ color: '#27ae60' }}><strong>{record.mealType}:</strong> {record.description} ({record.calories} kcal)</span>;

            return (
              <li key={record.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0', padding: '12px 0' }}>
                <span style={{ color: '#34495e' }}>{content}</span>
                {/*【追加】削除ボタンのUI */}
                <button onClick={() => handleDeleteClick(record.id)} style={{ marginLeft: '16px', padding: '2px 8px', fontSize: '12px', color: 'white', backgroundColor: '#e74c3c', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>削除</button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};