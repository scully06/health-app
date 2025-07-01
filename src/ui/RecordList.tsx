// src/ui/RecordList.tsx
import React from 'react';
import { HealthRecord } from '../core/models/HealthRecord';
import { WeightRecord } from '../core/models/WeightRecord';
import { SleepRecord } from '../core/models/SleepRecord';
import { FoodRecord } from '../core/models/FoodRecord'; //【追加】
import { cardStyle } from './styles';

interface RecordListProps {
  records: HealthRecord[];
  onDeleteRecord: (recordId: string) => void;
}

export const RecordList: React.FC<RecordListProps> = ({ records, onDeleteRecord }) => {
  //【修正】食事記録は時刻で、その他は種類でソート
  const sortedRecords = [...records].sort((a, b) => {
    if (a instanceof FoodRecord && b instanceof FoodRecord) {
      return a.id.localeCompare(b.id); // ID(タイムスタンプ)でソート
    }
    return a.constructor.name.localeCompare(b.constructor.name);
  });

  //【追加】合計カロリーを計算
  const totalCalories = records
    .filter((r): r is FoodRecord => r instanceof FoodRecord)
    .reduce((sum, r) => sum + r.calories, 0);

  const handleDeleteClick = (recordId: string) => {
    if (window.confirm('この記録を本当に削除しますか？')) {
      onDeleteRecord(recordId);
    }
  };

  return (
    <div style={{...cardStyle, marginTop: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ marginTop: 0, color: '#2c3e50' }}>選択日の記録</h3>
        {/*【追加】合計カロリー表示*/}
        {totalCalories > 0 && <strong style={{ color: '#e67e22' }}>合計: {totalCalories} kcal</strong>}
      </div>
      {sortedRecords.length === 0 ? (
        <p style={{ color: '#7f8c8d' }}>記録はまだありません。</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: '16px 0 0' }}>
          {sortedRecords.map((record) => {
            let content;
            if (record instanceof WeightRecord) {
              content = <><strong>{record.weight} kg</strong> (体重)</>;
            } else if (record instanceof SleepRecord) {
              content = <span style={{ color: '#336699' }}><strong>{record.sleepTime} 時間</strong> (睡眠 - 質: {record.quality})</span>;
            } else if (record instanceof FoodRecord) { //【追加】
              content = <span style={{ color: '#27ae60' }}><strong>{record.mealType}:</strong> {record.description} ({record.calories} kcal)</span>;
            }

            return (
              <li key={record.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0', padding: '12px 0' }}>
                <span style={{ color: '#34495e' }}>{content}</span>
                <button onClick={() => handleDeleteClick(record.id)} style={{ marginLeft: '16px', padding: '2px 8px', fontSize: '12px', color: 'white', backgroundColor: '#e74c3c', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>削除</button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};