// src/ui/WeightChart.tsx

import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { HealthRecord } from '../core/models/HealthRecord';
import { WeightRecord } from '../core/models/WeightRecord';

// Chart.jsに必要なコンポーネントを登録
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Propsの型定義
interface WeightChartProps {
  records: HealthRecord[];
}

export const WeightChart: React.FC<WeightChartProps> = ({ records }) => {
  // 体重記録のみを抽出し、日付の古い順にソート
  const weightRecords = records
    .filter((r): r is WeightRecord => r instanceof WeightRecord)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  // グラフ用のデータを作成
  const data = {
    labels: weightRecords.map(r => r.date.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })),
    datasets: [
      {
        label: '体重 (kg)',
        data: weightRecords.map(r => r.weight),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.1, // 線の滑らかさ
      },
    ],
  };

  // グラフのオプションを設定
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: '体重の推移',
      },
    },
  };

  return <Line options={options} data={data} />;
};