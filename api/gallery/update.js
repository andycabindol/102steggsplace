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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if KV is configured
    if (!redis || (!process.env.UPSTASH_REDIS_REST_URL && !process.env.KV_REST_API_URL)) {
      return res.status(503).json({ 
        error: 'KV Storage not configured' 
      });
    }

    const { id, caption } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Image ID is required' });
    }

    // Get all images from Upstash KV
    const imagesJson = await redis.lrange('gallery', 0, -1);
    const images = (imagesJson || []).map(item => {
      try {
        return typeof item === 'string' ? JSON.parse(item) : item;
      } catch (e) {
        return null;
      }
    }).filter(Boolean);

    // Find and update the image
    const imageIndex = images.findIndex(img => img.id === id);
    if (imageIndex === -1) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Update caption
    images[imageIndex].caption = caption || '';
    images[imageIndex].updatedAt = new Date().toISOString();

    // Save back to Redis (replace entire list)
    await redis.del('gallery');
    for (const image of images) {
      await redis.lpush('gallery', JSON.stringify(image));
    }

    return res.status(200).json({
      success: true,
      image: images[imageIndex],
    });
  } catch (error) {
    console.error('Update error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to update caption',
    });
  }
}

