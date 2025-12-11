import { Redis } from '@upstash/redis';

// Initialize Redis - automatically reads from environment variables
const redis = Redis.fromEnv();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if KV is configured (Redis.fromEnv() reads from UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN)
    if (!process.env.UPSTASH_REDIS_REST_URL && !process.env.KV_REST_API_URL) {
      // Return empty gallery if KV is not configured (for local dev)
      return res.status(200).json({
        success: true,
        images: [],
      });
    }

    // Get all images from Upstash KV
    const imagesJson = await redis.lrange('gallery', 0, -1);
    const images = (imagesJson || []).map(item => JSON.parse(item)).reverse(); // Reverse to show newest first

    return res.status(200).json({
      success: true,
      images,
    });
  } catch (error) {
    console.error('Gallery error:', error);
    // Return empty array instead of error for better UX
    return res.status(200).json({
      success: true,
      images: [],
    });
  }
}

