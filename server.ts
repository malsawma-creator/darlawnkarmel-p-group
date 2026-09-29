import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json());

// Health check endpoint for Cloud Run container probes
app.get('/healthz', (_req, res) => {
  res.status(200).send('OK');
});

// API: Generate Quiz with Gemini
app.post('/api/generate-quiz', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Gemini API key is not configured' });
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Generate a church youth competition/quiz based on this request: "${prompt}".
You must output a single, raw, valid JSON object containing exactly the following schema structure, with no markdown backticks, no "json" headers, and no leading/trailing commentary:
{
  "title": "A concise, engaging title for this quiz in Mizo/English (e.g. Bible Quiz or Hla Bu Quiz)",
  "description": "A short, friendly description in Mizo explaining what the quiz covers.",
  "timerSeconds": number (Must be a positive integer e.g., 10, 15, or 20 if "countdown" or "rapid" is requested, otherwise can be 0 or null for no timer),
  "questions": [
    {
      "question": "A clear multiple-choice question in Mizo/English",
      "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
      "correctAnswer": number (index 0, 1, 2, or 3 representing the correct option)
    }
  ]
}
Generate at least 5 to 10 questions depending on the request. Ensure all options are realistic and have exactly one unambiguous correct answer. Mizo language should be natural and correct.`
            }
          ]
        }
      ]
    });

    const rawText = response.text || '';
    const cleanJsonText = rawText.replace(/```json/i, '').replace(/```/g, '').trim();
    const quizResult = JSON.parse(cleanJsonText);
    res.status(200).json(quizResult);
  } catch (error) {
    console.error('Error generating quiz:', error);
    res.status(500).json({ error: 'Failed to generate quiz with AI: ' + String(error) });
  }
});

// API: AI Chat Agent with Competition Management Actions
const SYSTEM_INSTRUCTION = `You are Karmel AI Assistant Agent for P GROUP 2026 Darlawn Karmel Branch. You are a COMPETITION FACTORY.
You can chat with the developer in Mizo or English, answer questions, and help them create, modify, or manage competitions and quizzes of any type: quiz, drag_drop, matching, typing_race, buzzer_beater, puzzle, memory_game, debate, photo_contest, video_contest, essay, scavenger_hunt, or any game requested.

When the developer asks you to create a competition/quiz or modify the current competition, you must respond with:
1. A friendly conversational reply in Mizo/English explaining what you built.
2. If creating a new quiz or competition, include a special action block formatted as:
[ACTION:CREATE_QUIZ]
{
  "type": "quiz",
  "title": "...",
  "description": "...",
  "timerSeconds": 15,
  "points_rule": "...",
  "result_rule": "...",
  "scoring": "auto",
  "questions": [
    { "question": "...", "options": ["A", "B", "C", "D"], "correctAnswer": 0 }
  ]
}
[/ACTION]
Or if modifying the active competition:
[ACTION:UPDATE_COMPETITION]
{
  "title": "...",
  "description": "...",
  "timerSeconds": 15,
  "questions": [...]
}
[/ACTION]
Always be polite, helpful, and speak fluent Mizo or English as preferred by the user.
`;

app.post('/api/ai-chat', async (req, res) => {
  try {
    const { messages, activeCompetition } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages history is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    console.log('AI Chat Request - API Key configured:', !!apiKey);
    
    if (!apiKey) {
      return res.status(500).json({ error: 'Gemini API key is not configured' });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Format chat history for Gemini
    const chatHistory = messages.slice(0, -1).map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

    const modelName = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';
    const chat = ai.chats.create({
      model: modelName,
      history: chatHistory,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION + (activeCompetition ? `\nCurrent Active Competition Context: ${JSON.stringify(activeCompetition)}` : '')
      }
    });

    const lastMessage = messages[messages.length - 1]?.text || 'Hello';
    console.log(`Sending message to model: ${modelName}`);
    const result = await chat.sendMessage({ message: lastMessage });
    const replyText = result.text || 'Awle, eng nge ka puih leh dawn che?';

    res.status(200).json({ reply: replyText });
  } catch (error) {
    console.error('Error in AI chat:', error);
    res.status(500).json({ error: 'AI chat failed: ' + String(error) });
  }
});

// Serve static assets generated by `npm run build` or Vite Dev Server
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
} else {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa'
  });
  app.use(vite.middlewares);
}

app.listen(port, '0.0.0.0', () => {
  console.log(`Server listening on port ${port} (${process.env.NODE_ENV || 'development'})`);
});
