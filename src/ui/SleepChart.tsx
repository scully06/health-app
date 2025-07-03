// src/ui/SleepChart.tsx
import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { HealthRecord } from '../core/models/HealthRecord';
import { SleepRecord } from '../core/models/SleepRecord';

// Chart.jsに必要なコンポーネントを登録
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Propsの型定義
interface SleepChartProps {
  records: HealthRecord[];
}

export const SleepChart: React.FC<SleepChartProps> = ({ records }) => {
  // 睡眠記録のみを抽出し、日付の古い順にソート
  const sleepRecords = records
    .filter((r): r is SleepRecord => r instanceof SleepRecord)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // グラフ用のデータを作成
  const data = {
    labels: sleepRecords.map(r => new Date(r.date).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })),
    datasets: [
      {
        label: '合計睡眠時間 (時間)',
        // getTotalHours()メソッドで合計睡眠時間を取得
        data: sleepRecords.map(r => r.getTotalHours()),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
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
        text: '睡眠時間の推移',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
            display: true,
            text: '時間 (h)'
        }
      }
    }
  };

  // @ts-ignore
  return <Bar options={options} data={data} />;
};