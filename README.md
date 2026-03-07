```markdown
<!-- BRUTAL SPLIT README -->
<!-- NO MARKDOWN STANDARDS. RAW HTML. -->

██████╗ ██████╗ ██╗   ██╗████████╗ █████╗ ██╗     
██╔══██╗██╔══██╗██║   ██║╚══██╔══╝██╔══██╗██║     
██████╔╝██████╔╝██║   ██║   ██║   ███████║██║     
██╔══██╗██╔══██╗██║   ██║   ██║   ██╔══██║██║     
██████╔╝██║  ██║╚██████╔╝   ██║   ██║  ██║███████╗
╚═════╝ ╚═╝  ╚═╝ ╚═════╝    ╚═╝   ╚═╝  ╚═╝╚══════╝
                                                   
███████╗██████╗ ██╗     ██╗████████╗
██╔════╝██╔══██╗██║     ██║╚══██╔══╝
███████╗██████╔╝██║     ██║   ██║   
╚════██║██╔═══╝ ██║     ██║   ██║   
███████║██║     ███████╗██║   ██║   
╚══════╝╚═╝     ╚══════╝╚═╝   ╚═╝   

## ⚡ WHAT IS THIS

**BRUTAL SPLIT** is a client-side PDF splitting tool with **NEO-BRUTALIST** design philosophy.

- ✅ **ZERO** server uploads
- ✅ **ZERO** data collection  
- ✅ **ZERO** dependencies (except pdf-lib)
- ✅ **MAXIMUM** visual aggression

Your files **NEVER** leave your browser. Pure JavaScript. Pure chaos.

---

## 🚀 QUICK START

```bash
# 1. CLONE OR DOWNLOAD
git clone https://github.com/YOURNAME/brutal-split.git
cd brutal-split

# 2. START LOCAL SERVER (REQUIRED FOR SERVICE WORKER)
npx serve
# OR
python -m http.server 8000
# OR
php -S localhost:8000

# 3. OPEN BROWSER
# Navigate to http://localhost:8000

# 4. DROP PDF. SPLIT. DOWNLOAD. DESTROY.
```

> ⚠️ **WARNING**: Service Workers require `http://localhost` or `https://`.  
> Opening `file://` directly will **NOT** work.

---

## 🎨 DESIGN MANIFESTO

| PRINCIPLE | IMPLEMENTATION |
|-----------|---------------|
| **NO SOFT EDGES** | 0px border-radius everywhere |
| **MAXIMUM CONTRAST** | Pure black (#000) on dirty white (#E8E8E8) |
| **AGGRESSIVE ACCENTS** | Magenta (#FF0066), Cyan (#00FFFF), Yellow (#FFCC00) |
| **HARD SHADOWS** | 12px offset, zero blur |
| **MONOSPHERE** | Space Mono for everything readable |
| **DISPLAY TERROR** | Syne/Arial Black for headlines |
| **NO HARMONY** | Intentional visual conflict |
| **RAW EXPOSED** | Grid lines, construction lines visible |

---

## 🏗️ FILE ARCHITECTURE

```
brutal-split/
│
├── index.html          # THE CATHEDRAL
├── styles.css          # VISUAL VIOLENCE
├── app.js              # THE MACHINE
├── sw.js               # OFFLINE WEAPON
│
└── README.md           # YOU ARE HERE
```

**NO BUILD STEP.**  
**NO BUNDLER.**  
**NO NONSENSE.**

---

## ⚙️ FEATURES

### CORE DESTRUCTION
- 📄 **Split by count**: Divide into N equal parts
- ✂️ **Custom ranges**: Define exact page ranges (1-5,6-10,11-15)
- 🏷️ **Smart naming**: Template system with `{name}`, `{i}`, `{start}`, `{end}`

### ADVANCED WEAPONRY
- 🧠 **Live preview**: See output before execution
- 📊 **Progress terminal**: Real-time processing log
- 💾 **Offline capable**: Service Worker caches app shell
- 🎯 **Drag & drop**: Brutalist cathedral dropzone

### SAFETY PROTOCOLS
- 🔒 **Client-side only**: PDF-lib runs in browser
- 🚫 **No storage**: Files not saved anywhere
- ⚡ **Memory efficient**: Async processing with UI yields

---

## 🖥️ COMPATIBILITY

| BROWSER | STATUS |
|---------|--------|
| Chrome/Edge | ✅ OPTIMAL |
| Firefox | ✅ FUNCTIONAL |
| Safari | ⚠️ TEST NEEDED |
| IE/Old Edge | ❌ NEVER |

**Mobile**: Fully responsive destruction.

---

## 🛠️ CUSTOMIZATION

### Change Colors
```css
:root {
    --c-accent: #FF0066;    /* YOUR COLOR HERE */
    --c-accent-2: #00FFFF;  /* SECONDARY */
    --c-warn: #FFCC00;      /* WARNING */
}
```

### Change Typography
```css
--font-mono: 'Your Mono', monospace;
--font-display: 'Your Display', sans-serif;
```

### Rename App
Edit `loader-text` in `index.html` inline style block.

---

## 📦 DEPLOYMENT

### GitHub Pages (FREE)
```bash
# 1. Push to GitHub
git push origin main

# 2. Enable Pages in Settings
# Settings → Pages → Source: main branch

# 3. Wait 2 minutes
# Your site: https://YOURNAME.github.io/brutal-split
```

### Netlify (DRAG & DROP)
1. Zip all files
2. Drop on [netlify.com](https://netlify.com)
3. Live in 30 seconds

### Vercel
```bash
npm i -g vercel
vercel --prod
```

---

## 🐛 TROUBLESHOOTING

| PROBLEM | SOLUTION |
|---------|----------|
| "Service Worker failed" | Use `localhost` or `https` |
| PDF won't load | Check file size (RAM limited) |
| Stuck at 0% | Check browser console for errors |
| UI looks broken | Disable browser extensions |
| Mobile weird | Chrome/Edge recommended |

---

## 📜 LICENSE

```
NO LICENSE.
COPY FREELY.
MODIFY BRUTALLY.
REDISTRIBUTE CHAOTICALLY.

2026 - PUBLIC DOMAIN
```

---

## 🙏 ATTRIBUTIONS

- **pdf-lib** by Andrew Dillon - The engine
- **Space Mono** by Colophon Foundry - The voice  
- **Syne** by Bonjour Monde - The scream


SPLIT PDFs. NOT CLOUDS.                              
BRUTAL SPLIT // 2026 
