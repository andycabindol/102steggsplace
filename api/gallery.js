import { Redis } from '@upstash/redis';

// Initialize Redis - automatically reads from environment variables
let redis;
try {
  redis = Redis.fromEnv();
} catch (error) {
  console.error('Redis initialization error:', error);
  redis = null;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if KV is configured
    if (!redis || (!process.env.UPSTASH_REDIS_REST_URL && !process.env.KV_REST_API_URL)) {
      console.log('KV not configured - missing environment variables or Redis initialization failed');
      // Return empty gallery if KV is not configured (for local dev)
      return res.status(200).json({
        success: true,
        images: [],
      });
    }

    // Get all images from Upstash KV
    const imagesJson = await redis.lrange('gallery', 0, -1);
    console.log('Retrieved from Redis:', imagesJson);
    
    if (!imagesJson || imagesJson.length === 0) {
      return res.status(200).json({
        success: true,
        images: [],
      });
    }
    
    const images = imagesJson.map(item => {
      try {
        return typeof item === 'string' ? JSON.parse(item) : item;
      } catch (e) {
        console.error('Error parsing image item:', e, item);
        return null;
      }
    }).filter(Boolean); // lpush adds newest first, so no need to reverse

    return res.status(200).json({
      success: true,
      images,
    });
  } catch (error) {
    console.error('Gallery error:', error);
    // Return error details for debugging
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to load gallery',
      images: [],
    });
  }
}

