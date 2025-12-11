# Quick Guide: Testing Locally

## Fastest Way to Test Locally

### Option 1: Full Testing (with Photo Gallery)

```bash
# 1. Install dependencies
npm install

# 2. Install Vercel CLI (if needed)
npm i -g vercel

# 3. Link to your Vercel project
vercel link

# 4. Pull environment variables
vercel env pull .env.local

# 5. Start dev server (run directly, not via npm)
vercel dev
```

Then open `http://localhost:3000` in your browser.

### Option 2: Frontend Only (Egg Counter Only)

If you just want to test the egg counter (no photo gallery):

```bash
# Using Python
python -m http.server 8000

# Or using Node.js
npx http-server -p 8000
```

Then open `http://localhost:8000` in your browser.

**Note:** Photo gallery requires Vercel services to work.

## Troubleshooting

### "vercel: command not found"
```bash
npm i -g vercel
```

### "Environment variables not found"
Make sure you've:
1. Created Vercel Blob Storage in your Vercel dashboard
2. Created Vercel KV in your Vercel dashboard
3. Run `vercel link` to connect your local project
4. Run `vercel env pull .env.local` to download env vars

### "Cannot find module '@vercel/blob'"
```bash
npm install
```

### Port already in use
Vercel dev will try to use port 3000. If it's taken, it will ask you to use a different port.

