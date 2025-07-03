// src/ui/GoalStatus.tsx
import React from 'react';
import { User } from '../core/models/User';
import { WeightRecord } from '../core/models/WeightRecord';

interface GoalStatusProps {
  user: User;
  latestWeightRecord?: WeightRecord;
}

const goalCardStyle: React.CSSProperties = {
  border: '1px solid #ccc',
  padding: '16px',
  borderRadius: '8px',
  marginTop: '24px',
  backgroundColor: '#eafaf1', // 明るい緑系の背景色
};

export const GoalStatus: React.FC<GoalStatusProps> = ({ user, latestWeightRecord }) => {
  const { targetWeight } = user;
  const currentWeight = latestWeightRecord?.weight;

  const renderWeightGoalStatus = () => {
    if (!targetWeight) {
      return <p style={{ margin: 0, color: '#666' }}>目標体重が設定されていません。</p>;
    }
    if (!currentWeight) {
      return <p style={{ margin: 0, color: '#666' }}>現在の体重記録がありません。</p>;
    }

    const diff = targetWeight - currentWeight;
    if (Math.abs(diff) < 0.1) {
      return <p style={{ margin: 0, fontWeight: 'bold', color: '#27ae60' }}>🎉 目標体重達成！おめでとうございます！</p>;
    }

    diff > 0 ? `${diff.toFixed(1)}kg 増やす` : `${Math.abs(diff).toFixed(1)}kg 減らす`;
    return (
      <p style={{ margin: 0, fontWeight: 'bold', color: '#16a085' }}>
        目標体重まであと <span style={{ fontSize: '1.2em' }}>{Math.abs(diff).toFixed(1)}</span> kg
      </p>
    );
  };

  return (
    <div style={goalCardStyle}>
      <h4 style={{ marginTop: 0, marginBottom: '12px' }}>目標ステータス</h4>
      {renderWeightGoalStatus()}
    </div>
  );
};