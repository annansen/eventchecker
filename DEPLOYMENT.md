# Gratis Deployment Guide

## 🆓 Vercel + Supabase (Helt gratis)

### 1. Skapa Supabase konto
1. Gå till [supabase.com](https://supabase.com)
2. Registrera med GitHub (gratis)
3. Skapa nytt projekt: "linkoping-aktiviteter"

### 2. Hämta DATABASE_URL
1. I Supabase dashboard → Settings → Database
2. Kopiera "Connection string"
3. Format: `postgresql://[user]:[password]@[host]:[port]/[database]`

### 3. Deploy till Vercel
1. Gå till [vercel.com](https://vercel.com)
2. "New Project" → Välj GitHub repo
3. Lägg till environment variable:
   - `DATABASE_URL` = (din Supabase URL)

### 4. Kör migration på Vercel
1. Gå till Vercel dashboard → Settings → Environment Variables
2. Lägg till `DATABASE_URL`
3. Deploy → Vercel kör automatiskt `npm run postinstall`

### 5. Verifiera
Besök: `https://din-app-url.vercel.app/api/health`

## 💰 Kostnad
- **Vercel**: Gratis (Next.js hosting)
- **Supabase**: 500MB PostgreSQL gratis
- **Totalt**: $0 för alltid

## � Fördelar
- ✅ **Helt gratis** - ingen tidsbegränsning
- ✅ **Edge functions** - snabbare globalt
- ✅ **Auto HTTPS** - inget att konfigurera
- ✅ **Git integration** - deploy på push
