// 🌤️ WEATHER TOOL
// Hava durumu bilgisi getirir

const axios = require('axios');

const WEATHER_API_KEY = process.env.WEATHER_API_KEY || '2faa8467f79840a3b4e181528253011';

module.exports = {
  name: 'weather',
  description: 'Hava durumu bilgisi getirir',

  /**
   * Hava durumu sorgula
   * @param {Object} params - { city: string }
   */
  async execute({ city = 'Istanbul' }) {
    try {
      console.log(`🌤️ Weather query for: ${city}`);

      const url = 'https://api.weatherapi.com/v1/forecast.json';
      
      const response = await axios.get(url, {
        params: {
          key: WEATHER_API_KEY,
          q: city,
          days: 2,
          lang: 'tr'
        },
        timeout: 5000
      });

      const data = response.data;

      return {
        success: true,
        data: {
          city: data.location.name,
          country: data.location.country,
          localtime: data.location.localtime,
          current: {
            temp_c: data.current.temp_c,
            temp_f: data.current.temp_f,
            condition: data.current.condition.text,
            wind_kph: data.current.wind_kph,
            humidity: data.current.humidity,
            feels_like_c: data.current.feelslike_c,
            is_day: data.current.is_day
          },
          forecast: data.forecast.forecastday.map(day => ({
            date: day.date,
            maxtemp_c: day.day.maxtemp_c,
            mintemp_c: day.day.mintemp_c,
            condition: day.day.condition.text,
            chance_of_rain: day.day.daily_chance_of_rain,
            avghumidity: day.day.avghumidity
          }))
        }
      };

    } catch (error) {
      console.error('❌ Weather error:', error.message);

      if (error.response?.data?.error) {
        return {
          success: false,
          error: `Hava durumu hatası: ${error.response.data.error.message}`
        };
      }

      return {
        success: false,
        error: 'Hava durumu bilgisi alınamadı.'
      };
    }
  }
};
