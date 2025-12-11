import { Redis } from '@upstash/redis';
import { del } from '@vercel/blob';

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

    const { id } = req.body;

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

    // Find the image to delete
    const imageIndex = images.findIndex(img => img.id === id);
    if (imageIndex === -1) {
      return res.status(404).json({ error: 'Image not found' });
    }

    const imageToDelete = images[imageIndex];

    // Delete from Blob Storage
    try {
      if (imageToDelete.url && imageToDelete.url.includes('blob.vercel-storage.com')) {
        // Extract blob URL and delete
        await del(imageToDelete.url);
      }
    } catch (blobError) {
      console.error('Error deleting blob:', blobError);
      // Continue even if blob deletion fails
    }

    // Remove from images array
    images.splice(imageIndex, 1);

    // Save back to Redis (replace entire list)
    await redis.del('gallery');
    for (const image of images) {
      await redis.lpush('gallery', JSON.stringify(image));
    }

    return res.status(200).json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error) {
    console.error('Delete error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to delete image',
    });
  }
}

