// 🌤️ WEATHER TOOL - Gelişmiş Versiyon
const axios = require('axios');

const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const BASE_URL = 'https://api.weatherapi.com/v1';

// Hava durumu ikonları
const getWeatherEmoji = (condition, isDay) => {
  const c = (condition || '').toLowerCase();
  if (c.includes('sunny') || c.includes('clear')) return isDay ? '☀️' : '🌙';
  if (c.includes('partly cloudy')) return isDay ? '⛅' : '🌙';
  if (c.includes('cloudy') || c.includes('overcast')) return '☁️';
  if (c.includes('rain') || c.includes('drizzle')) return '🌧️';
  if (c.includes('thunder') || c.includes('storm')) return '⛈️';
  if (c.includes('snow') || c.includes('blizzard')) return '❄️';
  if (c.includes('fog') || c.includes('mist')) return '🌫️';
  if (c.includes('wind')) return '💨';
  return '🌡️';
};

// AQI açıklaması
const getAQIInfo = (aqi) => {
  if (aqi <= 50)  return { level: 'İyi', emoji: '🟢', desc: 'Hava kalitesi iyi, dışarı çıkabilirsiniz.' };
  if (aqi <= 100) return { level: 'Orta', emoji: '🟡', desc: 'Hassas gruplar dikkat etmeli.' };
  if (aqi <= 150) return { level: 'Hassas', emoji: '🟠', desc: 'Hassas gruplar için sağlıksız.' };
  if (aqi <= 200) return { level: 'Sağlıksız', emoji: '🔴', desc: 'Herkes için sağlıksız.' };
  if (aqi <= 300) return { level: 'Çok Sağlıksız', emoji: '🟣', desc: 'Dışarı çıkmaktan kaçının.' };
  return { level: 'Tehlikeli', emoji: '⚫', desc: 'Acil durum koşulları.' };
};

// UV indeksi açıklaması
const getUVInfo = (uv) => {
  if (uv <= 2)  return { level: 'Düşük', emoji: '🟢' };
  if (uv <= 5)  return { level: 'Orta', emoji: '🟡' };
  if (uv <= 7)  return { level: 'Yüksek', emoji: '🟠' };
  if (uv <= 10) return { level: 'Çok Yüksek', emoji: '🔴' };
  return { level: 'Aşırı', emoji: '⚫' };
};

// Tek şehir için hava durumu
async function fetchWeather(city, days = 5) {
  const response = await axios.get(`${BASE_URL}/forecast.json`, {
    params: {
      key: WEATHER_API_KEY,
      q: city,
      days: days,
      aqi: 'yes',
      alerts: 'yes',
      lang: 'tr'
    },
    timeout: 8000
  });
  return response.data;
}

// Hava durumu verisini formatla
function formatWeatherData(data) {
  const loc = data.location;
  const cur = data.current;
  const aqi = cur.air_quality;
  const uvInfo = getUVInfo(cur.uv);
  const emoji = getWeatherEmoji(cur.condition.text, cur.is_day);

  // AQI hesapla (US EPA index)
  const aqiValue = aqi ? Math.round(aqi['us-epa-index'] * 50) : null;
  const aqiInfo = aqiValue ? getAQIInfo(aqiValue) : null;

  // 5 günlük tahmin
  const forecast = data.forecast.forecastday.map(day => {
    const dayEmoji = getWeatherEmoji(day.day.condition.text, true);
    return {
      date: new Date(day.date).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' }),
      emoji: dayEmoji,
      condition: day.day.condition.text,
      maxtemp_c: Math.round(day.day.maxtemp_c),
      mintemp_c: Math.round(day.day.mintemp_c),
      chance_of_rain: day.day.daily_chance_of_rain,
      avghumidity: day.day.avghumidity,
      uv: day.day.uv,
      sunrise: day.astro.sunrise,
      sunset: day.astro.sunset
    };
  });

  // Hava uyarıları
  const alerts = data.alerts?.alert?.map(a => ({
    title: a.headline,
    severity: a.severity,
    desc: a.desc
  })) || [];

  return {
    location: {
      city: loc.name,
      country: loc.country,
      region: loc.region,
      localtime: loc.localtime,
      lat: loc.lat,
      lon: loc.lon
    },
    current: {
      emoji,
      temp_c: Math.round(cur.temp_c),
      feels_like_c: Math.round(cur.feelslike_c),
      condition: cur.condition.text,
      humidity: cur.humidity,
      wind_kph: Math.round(cur.wind_kph),
      wind_dir: cur.wind_dir,
      pressure_mb: cur.pressure_mb,
      visibility_km: cur.vis_km,
      uv: cur.uv,
      uvInfo,
      cloud: cur.cloud,
      is_day: cur.is_day
    },
    airQuality: aqiInfo ? {
      value: aqiValue,
      ...aqiInfo,
      pm2_5: aqi?.pm2_5 ? Math.round(aqi.pm2_5) : null,
      pm10: aqi?.pm10 ? Math.round(aqi.pm10) : null,
      co: aqi?.co ? Math.round(aqi.co) : null
    } : null,
    forecast,
    alerts
  };
}

module.exports = {
  name: 'weather',
  description: 'Gelişmiş hava durumu: 5 günlük tahmin, hava kalitesi, UV indeksi, çoklu şehir karşılaştırma',

  async execute({ city = 'Istanbul', cities = null, type = 'full' }) {
    try {
      if (!WEATHER_API_KEY) {
        return { success: false, error: 'WEATHER_API_KEY tanımlı değil.' };
      }

      // Çoklu şehir karşılaştırma
      if (cities && Array.isArray(cities) && cities.length > 1) {
        console.log(`🌤️ Çoklu şehir karşılaştırma: ${cities.join(', ')}`);
        const results = await Promise.all(
          cities.map(c => fetchWeather(c, 1).then(formatWeatherData).catch(() => null))
        );
        return {
          success: true,
          data: {
            type: 'comparison',
            cities: results.filter(Boolean)
          }
        };
      }

      // Tek şehir
      console.log(`🌤️ Weather query: ${city}`);
      const data = await fetchWeather(city, 5);
      const formatted = formatWeatherData(data);

      return {
        success: true,
        data: {
          type: 'full',
          ...formatted
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