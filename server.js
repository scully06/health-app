import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { OAuth2Client } from 'google-auth-library';
import { fitness } from '@googleapis/fitness';

// .env ファイルから環境変数を読み込む (必ず最初に実行)
dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3001;

// --- Gemini APIのための設定 ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error("エラー: GEMINI_API_KEYが.envファイルに設定されていません。");
}
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// --- Google Fit 連携のための設定 ---
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.error("エラー: GOOGLE_CLIENT_ID または GOOGLE_CLIENT_SECRET が.envファイルに設定されていません。");
}

const oauth2Client = new OAuth2Client(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  'postmessage'
);


//=================================
// APIルートの定義
//=================================

/**
 * Gemini APIに分析を依頼するエンドポイント
 */
app.post('/api/analyze', async (req, res) => {
  try {
    const { records } = req.body;
    if (!records || records.length === 0) {
      return res.status(400).json({ error: 'Records are required' });
    }
    const prompt = createPromptForGemini(records);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    res.json({ analysisText: text });
  } catch (error) {
    console.error('Error calling Gemini API:', error.message);
    res.status(500).json({ error: 'Geminiとの分析に失敗しました。' });
  }
});

/**
 * Google Fitからデータを取得するエンドポイント
 */
app.post('/api/analyze', async (req, res) => {
  // ... (この中身は変更なし)
});

/**
 * Google Fitからデータを取得するエンドポイント
 */
app.post('/api/google-fit/sync', async (req, res) => {
  //【重要】この行で `code` をリクエストボディから取り出します
  const { code } = req.body; 

  if (!code) {
    return res.status(400).json({ error: 'Authorization code is required.' });
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    const fitnessClient = fitness({ version: 'v1', auth: oauth2Client });

    const endTimeMillis = Date.now();
    const startTimeMillis = endTimeMillis - 7 * 24 * 60 * 60 * 1000;
    const datasetId = `${startTimeMillis * 1e6}-${endTimeMillis * 1e6}`;

    // --- 体重データの取得ロジック ---
    const weightDataSourceId = 'raw:com.google.weight:com.mc.simplehealth:Simple Health - weight';
    console.log(`[GoogleFit] 特定のデータソースIDで体重データをリクエストします: ${weightDataSourceId}`);
    
    const weightRes = await fitnessClient.users.dataSources.datasets.get({
      userId: 'me',
      dataSourceId: weightDataSourceId,
      datasetId: datasetId,
    });
    console.log('[GoogleFit] 体重データの生レスポンス:', JSON.stringify(weightRes.data, null, 2));
    
    const weights = weightRes.data.point
      ?.filter(p => p?.value?.[0]?.fpVal && p.startTimeNanos)
      .map(p => ({
        date: new Date(Number(p.startTimeNanos) / 1e6).toISOString(),
        weight: p.value[0].fpVal,
      })) || [];

    // --- 睡眠データの取得ロジック ---
    console.log('[GoogleFit] 睡眠データをリクエスト中...');
    const sleepRes = await fitnessClient.users.sessions.list({
      userId: 'me',
      activityType: [72],
      startTime: new Date(startTimeMillis).toISOString(),
      endTime: new Date(endTimeMillis).toISOString(),
    });
    const sleeps = sleepRes.data.session
      ?.map(s => ({
        date: new Date(Number(s.startTimeMillis)).toISOString(),
        sleepTime: (Number(s.endTimeMillis) - Number(s.startTimeMillis)) / (1000 * 60 * 60),
      }))
      .filter(p => p.sleepTime) || [];

    console.log(`[GoogleFit] 取得結果: ${weights.length}件の体重データ, ${sleeps.length}件の睡眠データ`);
    res.json({ weights, sleeps });

  } catch (error) {
    console.error('Failed to sync with Google Fit:', error.message);
    if (error.response) {
      console.error('Google API Error Body:', error.response.data);
    }
    res.status(500).json({ error: 'Google Fitとの同期に失敗しました。API設定や権限を確認してください。' });
  }
});



//=================================
// ヘルパー関数
//=================================

function createPromptForGemini(records) {
  const recordsText = records.map(r => 
    `日付: ${new Date(r.date).toLocaleDateString('ja-JP')}, ` +
    (r.weight ? `体重: ${r.weight}kg` : `睡眠: ${r.sleepTime}h, 質: ${r.quality}`)
  ).join('\n');
  
  return `
    あなたは優秀な健康アドバイザーです。
    以下の健康記録データを分析し、ユーザーを励まし、具体的でポジティブなアドバイスを、親しみやすい口調で150字程度で提供してください。

    【健康記録データ】
    ${recordsText}

    【アドバイスの例】
    - 「最近、体重が安定していますね！十分な睡眠がとれているおかげかもしれません。この調子で頑張りましょう！」
    - 「少し睡眠が足りない日が続いているようです。体重への影響も考えられますので、今夜は少し早めに休んでみてはいかがでしょうか？」
  `;
}


//=================================
// サーバー起動
//=================================
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});