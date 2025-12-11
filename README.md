# Egg Party 🥚

A fun and interactive egg counting tracker with a photo gallery for your egg meals!

## Features

- 🥚 Visual egg grid that updates in real-time
- ➕➖ Simple increment/decrement controls
- 💾 Persistent count using localStorage
- 📷 Photo gallery with upload and captions
- 📱 Fully responsive design
- 🎨 Fun animations and illustrations

## Setup for Vercel Deployment

This project uses Vercel Blob Storage and Vercel KV for the photo gallery feature. Follow these steps:

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Vercel Services

You'll need to configure two Vercel services:

#### Vercel Blob Storage
1. Go to your Vercel dashboard
2. Navigate to your project → **Storage** tab
3. Click **Create Database** → Select **Blob**
4. Create it (the `BLOB_READ_WRITE_TOKEN` will be auto-added to environment variables)

#### Vercel KV (Redis)
1. Go to your Vercel dashboard
2. Navigate to your project → **Storage** tab
3. Click **Create Database** → Select **KV** (or use the **Marketplace** if KV is listed there)
4. Create it (the `KV_REST_API_URL` and `KV_REST_API_TOKEN` will be auto-added to environment variables)

**Note:** If you see "KV and Postgres are now available through the Marketplace", you can also find KV in the Vercel Marketplace.

### 3. Environment Variables

Vercel will automatically add these when you create the storage services:
- `BLOB_READ_WRITE_TOKEN` - For Blob Storage
- `KV_REST_API_URL` - For KV storage
- `KV_REST_API_TOKEN` - For KV storage

### 4. Deploy to Vercel

#### Option A: Via Vercel Dashboard
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Vercel will auto-detect it as a Node.js project
6. Make sure environment variables are set (they should be auto-added)
7. Click "Deploy"

#### Option B: Via Vercel CLI
```bash
npm i -g vercel
vercel
```

## Local Development & Testing

### Prerequisites

Before testing locally, you need to:
1. Create a Vercel project (can be done via dashboard or CLI)
2. Set up Vercel Blob Storage and KV (see Setup section above)

### Step-by-Step Local Testing

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Install Vercel CLI globally** (if not already installed):
   ```bash
   npm i -g vercel
   ```

3. **Link your project to Vercel:**
   ```bash
   vercel link
   ```
   - If you haven't created a Vercel project yet, this will guide you through creating one
   - Choose your existing project or create a new one
   - Select your development and production settings

4. **Pull environment variables:**
   ```bash
   vercel env pull .env.local
   ```
   - This creates a `.env.local` file with your Vercel environment variables
   - Make sure `.env.local` is in your `.gitignore` (it already is)

5. **Start the development server:**
   ```bash
   vercel dev
   ```
   - **Important:** Run `vercel dev` directly (not `npm run dev`)
   - This starts a local server that mimics Vercel's serverless functions
   - The server will typically run on `http://localhost:3000`
   - Open that URL in your browser

6. **Test the features:**
   - ✅ Egg counter should work immediately (uses localStorage)
   - ✅ Try uploading a photo with a caption
   - ✅ Check that photos appear in the gallery

### Quick Test (Without Vercel Services)

If you just want to test the frontend (egg counter) without setting up backend services:

```bash
# Simple HTTP server (Python)
python -m http.server 8000

# Or using Node.js http-server
npx http-server -p 8000

# Then open http://localhost:8000
```

**Note:** The photo gallery won't work without Vercel services, but the egg counter will function perfectly since it uses localStorage.

## Project Structure

```
/
├── index.html          # Main HTML file
├── style.css           # Styles and animations
├── script.js           # Frontend JavaScript
├── package.json        # Dependencies
├── vercel.json         # Vercel configuration
├── api/
│   ├── upload.js       # API route for image uploads
│   └── gallery.js      # API route for fetching gallery
└── README.md           # This file
```

## How It Works

### Egg Counter
- The egg count is stored in browser localStorage
- Each time you add or subtract eggs, the count is saved automatically
- On page reload, your saved count is restored
- The grid dynamically generates the correct number of egg illustrations

### Photo Gallery
- Images are uploaded to Vercel Blob Storage
- Metadata (captions, URLs) are stored in Vercel KV
- Images are displayed in a responsive grid
- Maximum file size: 5MB per image

## Troubleshooting

### Images not uploading?
- Make sure Vercel Blob Storage is created and `BLOB_READ_WRITE_TOKEN` is set
- Check the Vercel function logs in the dashboard

### Gallery not loading?
- Make sure Vercel KV is created and environment variables are set
- Check browser console and Vercel function logs

### Local development issues?
- Run `vercel env pull .env.local` to get environment variables
- Make sure you're using `vercel dev` instead of a simple HTTP server

## License

MIT

