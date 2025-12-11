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
  try {
    // Check if KV is configured
    if (!redis || (!process.env.UPSTASH_REDIS_REST_URL && !process.env.KV_REST_API_URL)) {
      // Fallback to default if Redis not configured (for local dev)
      if (req.method === 'GET') {
        return res.status(200).json({
          success: true,
          count: 55, // Default value
        });
      }
      return res.status(503).json({ 
        error: 'KV Storage not configured. Please set up Upstash Redis/KV in your project settings.' 
      });
    }

    if (req.method === 'GET') {
      // Get egg count from Redis
      const count = await redis.get('eggCount');
      const eggCount = count !== null ? parseInt(count) : 55; // Default to 55 if not set
      
      return res.status(200).json({
        success: true,
        count: eggCount,
      });
    } else if (req.method === 'POST') {
      // Update egg count in Redis
      const { count } = req.body;
      
      if (typeof count !== 'number' || count < 0) {
        return res.status(400).json({ error: 'Invalid count value' });
      }

      await redis.set('eggCount', count.toString());
      
      return res.status(200).json({
        success: true,
        count: count,
      });
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Egg count API error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to process request',
    });
  }
}
