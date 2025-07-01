// src/ui/RecordList.tsx

import React from 'react';
import { HealthRecord } from '../core/models/HealthRecord';
import { WeightRecord } from '../core/models/WeightRecord';
import { SleepRecord } from '../core/models/SleepRecord';
import { cardStyle } from './styles';

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
    <div style={{...cardStyle, marginTop: '24px' }}>
      <h3 style={{ marginTop: 0, color: '#2c3e50' }}>記録一覧</h3>
      {sortedRecords.length === 0 ? (
        <p style={{ color: '#7f8c8d' }}>記録はまだありません。</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {sortedRecords.map((record) => {
            // ... (contentの定義)
            return (
              <li key={record.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0', padding: '12px 0' }}>
                <span style={{ color: '#34495e' }}>{record.date.toLocaleDateString('ja-JP')} : {content}</span>
                <button onClick={() => handleDeleteClick(record.id)} style={{ /* ... 削除ボタンのスタイル ... */ }}>削除</button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};