require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

const PORT = process.env.PORT || 3001;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.use(cors());
app.use(express.json());

// Translation Endpoint
app.post('/translate', async (req, res) => {
  try {
    const { text, targetLang } = req.body;
    
    const response = await axios.post(
      `https://translation.googleapis.com/language/translate/v2`,
      {
        q: text,
        target: targetLang,
        format: 'text'
      },
      {
        params: { key: GOOGLE_API_KEY }
      }
    );

    res.json({
      translatedText: response.data.data.translations[0].translatedText,
      detectedLang: response.data.data.translations[0].detectedSourceLanguage
    });
  } catch (error) {
    console.error('Translation error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: error.response?.data?.error?.message || 'Translation failed' 
    });
  }
});

// Summarization Endpoint
app.post('/summarize', async (req, res) => {
  try {
    const { text, targetLang } = req.body;
    
    // Summarize with Gemini
    const geminiResponse = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent`,
      {
        contents: [{
          parts: [{ text: `Summarize this in 2-3 sentences: ${text}` }]
        }]
      },
      {
        params: { key: GEMINI_API_KEY },
        headers: { 'Content-Type': 'application/json' }
      }
    );

    const summary = geminiResponse.data.candidates[0].content.parts[0].text;

    // Translate summary
    const translateResponse = await axios.post(
      `https://translation.googleapis.com/language/translate/v2`,
      {
        q: summary,
        target: targetLang
      },
      { params: { key: GOOGLE_API_KEY } }
    );

    res.json({
      summary: translateResponse.data.data.translations[0].translatedText
    });
  } catch (error) {
    console.error('Summarization error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: error.response?.data?.error?.message || 'Summarization failed' 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});