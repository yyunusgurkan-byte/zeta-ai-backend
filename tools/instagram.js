// 📸 INSTAGRAM TOOL
// Instagram profil analizi ve içerik önerileri
const axios = require('axios');

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const BASE_URL = 'https://instagram120.p.rapidapi.com';

const headers = {
  'x-rapidapi-host': 'instagram120.p.rapidapi.com',
  'x-rapidapi-key': RAPIDAPI_KEY,
  'Content-Type': 'application/json'
};

// Kullanıcı adını URL'den çıkar
const extractUsername = (input) => {
  if (input.includes('instagram.com/')) {
    const match = input.match(/instagram\.com\/([^/?#]+)/);
    return match ? match[1] : null;
  }
  return input.replace('@', '').trim();
};

// Profil bilgisi getir
async function getProfile(username) {
  const response = await axios.post(`${BASE_URL}/api/instagram/posts`, 
    { username, maxId: "" },
    { headers, timeout: 10000 }
  );
  return response.data;
}

// İçerik önerileri üret
function generateContentTips(profile) {
  const tips = [];
  const followerCount = profile.follower_count || 0;
  const followingCount = profile.following_count || 0;
  const mediaCount = profile.media_count || 0;
  const ratio = followerCount / (followingCount || 1);

  if (ratio < 1) {
    tips.push('📉 Takip ettiğin kişi sayısı fazla, takipçi/takip oranını düzelt');
  }
  if (mediaCount < 10) {
    tips.push('📸 Daha fazla içerik paylaş, en az 12 gönderi olsun');
  }
  if (!profile.biography) {
    tips.push('📝 Bio ekle — kimsin, ne yapıyorsun kısaca anlat');
  }
  if (!profile.external_url) {
    tips.push('🔗 Bio\'ya link ekle (website, WhatsApp, Linktree vb.)');
  }
  if (followerCount < 1000) {
    tips.push('🏷️ Her gönderide 5-10 niş hashtag kullan');
    tips.push('💬 Aynı nişteki hesaplarla etkileşime gir');
    tips.push('⏰ En aktif saatlerde paylaş (18:00-21:00)');
  } else if (followerCount < 10000) {
    tips.push('🎯 Reels paylaş — organik erişim çok daha yüksek');
    tips.push('📊 Instagram Insights\'ı takip et');
    tips.push('🤝 Benzer hesaplarla işbirliği yap');
  } else {
    tips.push('💡 Sponsorlu içerik için markalarla iletişime geç');
    tips.push('📱 Story ve Reels kombinasyonu kullan');
  }

  return tips;
}

module.exports = {
  name: 'instagram',
  description: 'Instagram profil analizi ve organik büyüme önerileri',

  async execute({ query }) {
    try {
      if (!RAPIDAPI_KEY) {
        return { success: false, error: 'RAPIDAPI_KEY tanımlı değil.' };
      }

      const username = extractUsername(query);
      if (!username) {
        return { success: false, error: 'Geçerli bir Instagram kullanıcı adı veya linki girin.' };
      }

      console.log(`📸 Instagram analizi: @${username}`);
      const data = await getProfile(username);

      if (!data || data.error) {
        return { success: false, error: 'Profil bulunamadı veya gizli.' };
      }

      const tips = generateContentTips(data);

      return {
        success: true,
        data: {
          type: 'instagram_profile',
          username: data.username,
          fullName: data.full_name,
          bio: data.biography,
          followers: data.follower_count,
          following: data.following_count,
          posts: data.media_count,
          isVerified: data.is_verified,
          isPrivate: data.is_private,
          profilePic: data.profile_pic_url,
          externalUrl: data.external_url,
          contentTips: tips
        }
      };

    } catch (error) {
      console.error('❌ Instagram error:', error.message);
      return {
        success: false,
        error: 'Instagram profili analiz edilemedi.'
      };
    }
  }
};
