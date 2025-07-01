// server.js (または server.mjs)

import express from 'express';
import dotenv from 'dotenv';
import { OAuth2Client } from 'google-auth-library';
import { GoogleGenerativeAI } from '@google/generative-ai'; //【追加】
import cors from 'cors';
// .env ファイルから環境変数を読み込む
dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173' 
}));

app.use(express.json());
const PORT = 3001;

// --- Google OAuth 2.0 クライアントの設定 ---
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.error("エラー: .envファイルにGOOGLE_CLIENT_IDまたはGOOGLE_CLIENT_SECRETが設定されていません。");
  process.exit(1);
}

const oauth2Client = new OAuth2Client(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  'postmessage'
);

// ---【追加】Gemini APIのための設定 ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error("エラー: .envファイルにGEMINI_API_KEYが設定されていません。");
  // process.exit(1); // Geminiキーがなくても認証サーバーは動かせるように、一旦コメントアウト
}
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });


//=================================
// APIルートの定義
//=================================

/**
 * フロントエンドから受け取った認証コードをアクセストークンに交換するエンドポイント。
 */
app.post('/api/auth/google', async (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'Authorization code is required.' });
  }
  try {
    const { tokens } = await oauth2Client.getToken(code);
    console.log('[Auth Server] Googleからトークンを正常に取得しました。');
    res.json(tokens);
  } catch (error) {
    console.error('Failed to exchange auth code for tokens:', error.message);
    res.status(500).json({ error: 'Failed to authenticate with Google.' });
  }
});

/**
 *【追加】Gemini APIに分析を依頼するエンドポイント
 */
app.post('/api/analyze', async (req, res) => {
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'Gemini APIキーがサーバーに設定されていません。' });
  }
  try {
    const { records } = req.body;
    if (!records || records.length === 0) {
      return res.status(400).json({ error: '分析対象の記録データ(records)が必要です。' });
    }
    
    // プロンプトを生成
    const prompt = createPromptForGemini(records);
    
    // Gemini APIにリクエストを送信
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('[Gemini Server] AI分析結果を生成しました。');
    res.json({ analysisText: text });

  } catch (error) {
    console.error('Error calling Gemini API:', error.message);
    res.status(500).json({ error: 'Geminiによる分析に失敗しました。' });
  }
});

app.get('/api/debug/sleep-sources', async (req, res) => {
  const accessToken = req.headers.authorization?.split(' ')[1];
  if (!accessToken) return res.status(401).json({ error: 'Access token is required.' });

  try {
    oauth2Client.setCredentials({ access_token: accessToken });
    const fitnessClient = fitness({ version: 'v1', auth: oauth2Client });

    const dataSourcesRes = await fitnessClient.users.dataSources.list({ userId: 'me' });
    
    // データタイプが睡眠セグメントのものだけをフィルタリング
    const sleepDataSources = dataSourcesRes.data.dataSource
      ?.filter(ds => ds.dataType?.name === 'com.google.sleep.segment');

    res.json(sleepDataSources);
  } catch (error) {
    console.error('Failed to list sleep sources:', error.message);
    res.status(500).json({ error: 'Failed to list sleep sources.' });
  }
});
//=================================
// ヘルパー関数
//=================================

/**
 *【追加】Gemini APIに渡すプロンプトを生成する関数
 */
function createPromptForGemini(records) {
  const recordsText = records.map(r => {
    let detail = '';
    if (r.weight) {
      detail = `体重: ${r.weight}kg`;
    } else if (r.sleepTime) {
      detail = `睡眠: ${r.sleepTime.toFixed(1)}h, 質: ${r.quality}`;
    } else if (r.mealType) {
      detail = `食事(${r.mealType}): ${r.description} (${r.calories}kcal)`;
    }
    return `日付: ${new Date(r.date).toLocaleDateString('ja-JP')}, ${detail}`;
  }).join('\n');
  
  return `
    あなたは優秀な健康アドバイザーです。
    以下の健康記録データを分析し、ユーザーを励まし、具体的でポジティブなアドバイスを、親しみやすい口調で150字程度で提供してください。

    【健康記録データ】
    ${recordsText}

    【アドバイスの例】
    - 「最近、体重が安定していますね！十分な睡眠がとれているおかげかもしれません。この調子で頑張りましょう！」
    - 「週末の食事カロリーが少し多い傾向にあるようです。楽しみつつも、平日の食事でバランスを取ると良いかもしれませんね。」
    - 「睡眠時間が短い日は、翌日の体重に影響が出ているようです。今夜は少し早めに休んでみてはいかがでしょうか？」
  `;
}


//=================================
// サーバー起動
//=================================
app.listen(PORT, () => {
  console.log(`Authentication and Analysis server is running on http://localhost:${PORT}`);
});