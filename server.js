const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

const SPEAKER = 'kavitha';
const LANGUAGE = 'te-IN';
const MODEL = 'bulbul:v3';

app.post('/tts', async (req, res) => {
  try {
   
    const { message } = req.body;
    if (!message || message.type !== 'voice-request') {
      return res.status(400).json({ error: 'Invalid message type' });
    }

    const text = message.text;
    if (!text || text.trim() === '') {
      return res.status(400).json({ error: 'Empty text' });
    }

    console.log(`[TTS] Speaking: "${text}"`);

    const sarvamRes = await axios.post(
      'https://api.sarvam.ai/text-to-speech',
      {
        inputs: [text],
        target_language_code: LANGUAGE,
        speaker: SPEAKER,
        model: MODEL,
        speech_sample_rate: 8000,
        enable_preprocessing: true
      },
      {
        headers: {
          'api-subscription-key': process.env.SARVAM_API_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 8000
      }
    );

    const audioBase64 = sarvamRes.data.audios[0];
    const wavBuffer = Buffer.from(audioBase64, 'base64');
    const pcmBuffer = wavBuffer.slice(44);

    res.setHeader('Content-Type', 'audio/raw');
    res.setHeader('Content-Length', pcmBuffer.length);
    res.send(pcmBuffer);

    console.log(`[TTS] Done. Sent ${pcmBuffer.length} bytes`);

  } catch (err) {
    const detail = err.response?.data || err.message;
    console.error('[TTS] Error:', detail);
    res.status(500).json({ error: 'Synthesis failed', detail });
  }
});

app.get('/health', (_, res) => res.json({ status: 'ok', speaker: SPEAKER }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));