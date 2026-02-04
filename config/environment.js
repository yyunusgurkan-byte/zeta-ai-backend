// backend/config/environment.js kontrol et
module.exports = {
  groq: {
    apiKey: process.env.GROQ_API_KEY,  // undefined olmamalı!
    model: 'llama-3.3-70b-versatile'
  }
}