import { put } from '@vercel/blob';
import { Redis } from '@upstash/redis';
import formidable from 'formidable';
import fs from 'fs';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if required services are configured
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return res.status(503).json({ 
        error: 'Blob Storage not configured. Please set up Vercel Blob Storage in your project settings.' 
      });
    }
    
    if (!redis.url || !redis.token) {
      return res.status(503).json({ 
        error: 'KV Storage not configured. Please set up Upstash KV in your project settings.' 
      });
    }

    // Parse the multipart form data
    const form = formidable({
      maxFileSize: 5 * 1024 * 1024, // 5MB
      keepExtensions: true,
    });

    const [fields, files] = await form.parse(req);
    
    const file = files.image?.[0];
    const caption = fields.caption?.[0]?.trim() || 'No caption';

    if (!file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Read the file stream
    const fileBuffer = fs.readFileSync(file.filepath);
    const filename = file.originalFilename || 'image.jpg';

    // Upload to Vercel Blob Storage
    const blob = await put(filename, fileBuffer, {
      access: 'public',
      addRandomSuffix: true,
    });

    // Clean up temporary file
    try {
      fs.unlinkSync(file.filepath);
    } catch (e) {
      // Ignore cleanup errors
    }

    // Generate unique ID
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const imageData = {
      id,
      url: blob.url,
      caption,
      uploadedAt: new Date().toISOString(),
    };

    // Store metadata in Upstash KV
    await redis.lpush('gallery', JSON.stringify(imageData));

    return res.status(200).json({
      success: true,
      image: imageData,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to upload image',
    });
  }
}

