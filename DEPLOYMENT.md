# Movie Recommender - Deployment Ready

This app is now ready for deployment on Netlify + Render!

## 🚀 Quick Deployment Steps

### Step 1: Deploy Backend to Render
1. Go to [render.com](https://render.com) and sign up
2. Create new "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Root Directory**: `backend-hf`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     ```
     NODE_ENV=production
     SUPABASE_URL=https://wfsmdmpqtofyirnxptdt.supabase.co
     SUPABASE_KEY=your_supabase_service_key
     TMDB_API_KEY=your_tmdb_api_key
     ```

### Step 2: Update Frontend URL
After backend deploys, you'll get a URL like:
`https://movie-recommender-backend.onrender.com`

Update the URL in `frontend/src/App.jsx`:
```javascript
const API_URL = import.meta.env.PROD 
  ? 'https://YOUR-ACTUAL-RENDER-URL.onrender.com'  // Update this!
  : 'http://localhost:5001';
```

### Step 3: Deploy Frontend to Netlify
1. Go to [netlify.com](https://netlify.com) and sign up
2. Choose "Add new site" → "Import from Git"
3. Connect GitHub and select your repository
4. Netlify will auto-detect the `netlify.toml` configuration
5. Deploy!

### Step 4: Update CORS
After frontend deploys, update the CORS settings in `backend-hf/server.js`:
```javascript
origin: process.env.NODE_ENV === 'production' 
  ? [
      'https://YOUR-NETLIFY-APP.netlify.app',  // Update this!
      'https://*.netlify.app'
    ]
```

### Step 5: Run Database Setup
1. Run the SQL in `backend-hf/database/update_schema.sql` in Supabase
2. Run `npm run embed-tmdb` locally to populate the database

## 📁 Files Added for Deployment

- ✅ `netlify.toml` - Netlify configuration
- ✅ `render.yaml` - Render configuration  
- ✅ `.env.example` files - Environment variable templates
- ✅ Updated `App.jsx` - Environment-based API URL
- ✅ Updated `server.js` - Production CORS configuration

## 🔧 Environment Variables Needed

**Render (Backend)**:
- `NODE_ENV=production`
- `SUPABASE_URL`
- `SUPABASE_KEY`
- `TMDB_API_KEY`

**Netlify (Frontend)**:
- No environment variables needed (uses Vite's built-in environment detection)

Your app is now deployment-ready! 🎉