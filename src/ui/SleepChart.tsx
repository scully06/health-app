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
  const sleepRecords = records
    .filter((r): r is SleepRecord => r instanceof SleepRecord)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // グラフのラベル（日付）
  const labels = sleepRecords.map(r => new Date(r.date).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' }));

  // 【変更】睡眠ステージごとのデータセットを作成
  const data = {
    labels: labels,
    datasets: [
      {
        label: '深い睡眠',
        // 各記録から「深い睡眠」の時間（分→時間）を抽出
        data: sleepRecords.map(r => (r.stageDurations.deep || 0) / 60),
        backgroundColor: 'rgba(25, 25, 112, 0.7)', // 深い青
      },
      {
        label: '浅い睡眠',
        data: sleepRecords.map(r => (r.stageDurations.light || 0) / 60),
        backgroundColor: 'rgba(54, 162, 235, 0.7)', // 青
      },
      {
        label: 'REM睡眠',
        data: sleepRecords.map(r => (r.stageDurations.rem || 0) / 60),
        backgroundColor: 'rgba(153, 102, 255, 0.7)', // 紫
      },
      {
        label: '覚醒',
        data: sleepRecords.map(r => (r.stageDurations.awake || 0) / 60),
        backgroundColor: 'rgba(201, 203, 207, 0.7)', // グレー
      },
    ],
  };

  // 【変更】積み上げグラフのためのオプション設定
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: '睡眠時間の内訳',
      },
      tooltip: {
        // ツールチップに合計時間を表示する
        callbacks: {
          footer: (tooltipItems: any) => {
            let total = 0;
            tooltipItems.forEach((item: any) => {
              total += item.parsed.y;
            });
            return '合計: ' + total.toFixed(1) + ' 時間';
          }
        }
      }
    },
    scales: {
      x: {
        // X軸を積み上げ表示に設定
        stacked: true,
      },
      y: {
        // Y軸を積み上げ表示に設定
        stacked: true,
        beginAtZero: true,
        title: {
            display: true,
            text: '時間 (h)'
        }
      }
    }
  };

  return <Bar options={options} data={data} />;
};