// src/ui/RecordList.tsx

import React from 'react';
import { HealthRecord } from '../core/models/HealthRecord';
import { WeightRecord } from '../core/models/WeightRecord';
import { SleepRecord } from '../core/models/SleepRecord';

//【修正】Propsの型定義に、削除イベント用の関数を追加
interface RecordListProps {
  records: HealthRecord[];
  onDeleteRecord: (recordId: string) => void; // 削除ボタンが押されたことを通知する関数
}

export const RecordList: React.FC<RecordListProps> = ({ records, onDeleteRecord }) => {
  const sortedRecords = [...records].sort((a, b) => b.date.getTime() - a.date.getTime());

  const handleDeleteClick = (recordId: string) => {
    // ユーザーに削除の最終確認を求める
    if (window.confirm('この記録を本当に削除しますか？')) {
      onDeleteRecord(recordId);
    }
  };

  return (
    <div style={{ marginTop: '24px' }}>
      <h3>記録一覧</h3>
      {sortedRecords.length === 0 ? (
        <p>記録はまだありません。</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {sortedRecords.map((record) => {
            const content = (
              record instanceof WeightRecord ? (
                <><strong>{record.weight} kg</strong> (体重)</>
              ) : record instanceof SleepRecord ? (
                <span style={{ color: '#336699' }}><strong>{record.sleepTime} 時間</strong> (睡眠 - 質: {record.quality})</span>
              ) : null
            );

            return (
              <li key={record.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', padding: '8px 4px' }}>
                <span>{record.date.toLocaleDateString('ja-JP')} : {content}</span>
                {/*【追加】削除ボタン*/}
                <button 
                  onClick={() => handleDeleteClick(record.id)}
                  style={{ marginLeft: '16px', padding: '2px 8px', fontSize: '12px', color: 'white', backgroundColor: '#e74c3c', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  削除
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};