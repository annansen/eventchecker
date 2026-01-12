# Saker att Göra i Linköping

En mobil-first webbapp för att hitta evenemang och aktiviteter i Linköping med AI-assisterad sökning och geolokalisering.

## 🚀 Funktioner

- **Onboarding** – välj plats och preferenser första gången
- **Live geolocation** – se avstånd till events, auto-uppdatering
- **Server-side filtrering** – snabba filter för datum, pris, kategori
- **Detaljsida** – karta, spara, dela, externa länkar
- **Sparade events** – localStorage-baserad lista
- **Automatisk scraping** – hämtar events från Visit Linköping varje vecka
- **Pull-to-refresh** – uppdatera events med svep

## 🛠 Tech Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend:** Next.js API routes, Prisma, SQLite
- **Karta:** MapLibre GL (OpenStreetMap)
- **Scraping:** Cheerio, Node.js
- **Deployment:** GitHub Actions (automatisk scraping)

## 📦 Installation

```bash
# Install dependencies
npm install

# Seed database
npm run seed

# Start dev server
npm run dev
```

Öppna [http://localhost:3000](http://localhost:3000) för att se appen.

## 🔄 Scraping

Appen hämtar automatiskt events från Visit Linköping:

### Manuell scraping
```bash
npm run scrape
```

### Automatisk (GitHub Actions)
- Körs varje söndag kl 3:00 (CET)
- Committar nya events till databasen
- Kan köras manuellt från GitHub Actions-fliken

### Lägg till nya datakällor
1. Uppdatera `scripts/scrape-linkoping.ts`
2. Lägg till ny URL och CSS-selektorer
3. Testa med `npm run scrape`

## 🗄 Database

```bash
# Prisma studio (visualisera data)
npx prisma studio

# Generera klient
npx prisma generate

# Migrera
npx prisma migrate dev
```

## 🚀 Deployment

### Vercel (rekommenderat)
1. Pusha till GitHub
2. Länka till Vercel
3. Sätt miljövariabler:
   - `DATABASE_URL` (SQLite fungerar utan)
   - `ADMIN_TOKEN` (om du vill ha admin)

### GitHub Actions för scraping
```bash
# Pusha för att aktivera
git push origin main
```

## 📱 Användning

1. **Första besök** – gå igenom onboarding
2. **Sök/filter** – använd quick filters eller sökfält
3. **Detaljer** – klicka på event för karta och info
4. **Spara** – spara intressanta events
5. **Uppdatera** – dra neråt för att refresha

## 🤝 Bidra

1. Hitta nya datakällor (bibliotek, museer, idrottsföreningar)
2. Uppdatera scraper med nya selektorer
3. Testa och pusha

## 📄 Licens

MIT
