// server.js

import express from 'express';
import dotenv from 'dotenv';
import { OAuth2Client } from 'google-auth-library';
import { GoogleGenerativeAI } from '@google/generative-ai';
import cors from 'cors';
dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173' 
}));

const PORT = 3001;

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

let oauth2Client;
if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  oauth2Client = new OAuth2Client(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    'postmessage'
  );
}

let model;
if (GEMINI_API_KEY) {
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  // 【変更】モデル名を最新のものに更新
  model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
}

app.get('/api/status', (req, res) => {
  res.json({
    isGoogleAuthReady: !!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET),
    isGeminiReady: !!GEMINI_API_KEY,
  });
});

app.post('/api/auth/google', async (req, res) => {
  if (!oauth2Client) {
    return res.status(503).json({ error: 'Google OAuth is not configured on the server.' });
  }

  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'Authorization code is required.' });
  }
  try {
    const { tokens } = await oauth2Client.getToken(code);
    console.log('[Auth Server] Googleからトークンを正常に取得しました。');
    res.json(tokens);
  } catch (error) {
    console.error('トークン交換エラー:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Googleとの認証に失敗しました。',
      details: error.response?.data || error.message
    });
  }
});

app.post('/api/analyze', async (req, res) => {
  if (!model) {
    return res.status(503).json({ error: 'Gemini API is not configured on the server.' });
  }

  try {
    const { records } = req.body;
    if (!records || records.length === 0) {
      return res.status(400).json({ error: '分析対象の記録データ(records)が必要です。' });
    }
    
    const prompt = createPromptForGemini(records);
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('[Gemini Server] AI分析結果を生成しました。');
    res.json({ analysisText: text });

  } catch (error) {
    console.error('Error calling Gemini API:', error);
    res.status(500).json({ error: 'Geminiによる分析に失敗しました。' });
  }
});


function createPromptForGemini(records) {
  const recordsText = records.map(r => {
    let detail = '';
    if (r.weight) {
      detail = `体重: ${r.weight}kg`;
    } else if (r.stageDurations) {
      const totalHours = Object.values(r.stageDurations).reduce((sum, current) => sum + (current || 0), 0) / 60;
      detail = `睡眠: ${totalHours.toFixed(1)}h`;
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

app.listen(PORT, () => {
  console.log(`Authentication and Analysis server is running on http://localhost:${PORT}`);
});
