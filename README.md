# GTO Poker Range Viewer

A React/TypeScript application to view and analyze GTO (Game Theory Optimal) poker solutions.

## ⚡ New Version 2.0 - Lazy Loading

The app now uses **lazy loading** for maximum performance:
- ✅ Instant startup (<2s)
- ✅ Loads only what's needed
- ✅ No unnecessary browser overhead
- ✅ Supports 12,000+ nodes without issues

See [LAZY_LOADING.md](./LAZY_LOADING.md) for technical details.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- Windows (for batch scripts) or a Unix-like environment

### Installation

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd WizardPrivadoo
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Prepare static files**
   ```bash
   # Windows
   .\generate_index.bat
   
   # Or manually
   node generate_solutions.cjs
   .\setup_public.bat
   ```

4. **Start the dev server**
   ```bash
   npm run dev
   ```

5. **Open the app**
   - Go to http://localhost:3000 in your browser

## 📁 Project Structure

```
WizardPrivadoo/
├── spots/              # Poker solutions (settings, equity, nodes)
├── public/             # Static files served by Vite (generated)
├── components/         # React components
├── lib/                # Utilities and business logic
├── App.tsx             # Main component
├── solutions.json      # Solutions manifest (generated)
└── generate_index.bat  # Setup script
```

## 📚 Documentation

- [ANALISE_PROJETO.md](./ANALISE_PROJETO.md) - Detailed architecture analysis
- [ARQUITETURA_VISUAL.md](./ARQUITETURA_VISUAL.md) - Visual diagrams and flows
- [COMO_ADICIONAR_SPOTS.md](./COMO_ADICIONAR_SPOTS.md) - How to add new solutions

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Create production build
- `npm run preview` - Preview production build
- `node generate_solutions.cjs` - Generate solutions.json
- `.\setup_public.bat` - Prepare the public folder

## ⚠️ Troubleshooting

### Error 404: solutions.json not found
Run `generate_index.bat` to create the required structure.

### Error: Failed to fetch / ERR_INSUFFICIENT_RESOURCES
**Cause:** Too many nodes being loaded simultaneously.

**Fix:** The generator script now limits to 50 nodes per solution. Run:
```bash
.\generate_index.bat
```

See [SOLUCAO_ERROS.md](./SOLUCAO_ERROS.md) for details.

### Spots not loading
1. Verify `public/spots` exists (junction)
2. Run `setup_public.bat`
3. Restart the dev server

See [COMO_ADICIONAR_SPOTS.md](./COMO_ADICIONAR_SPOTS.md) for more details.

## 🎯 Funcionalidades

- ✅ 13x13 range visualization with frequency gradients
- ✅ Interactive decision-tree navigation
- ✅ Detailed combo analysis
- ✅ Poker table visualization
- ✅ Aggregated frequencies by action
- ✅ Support for multiple tournament phases
- ✅ Toggle between BB and chips
- ✅ Upload new solutions

## 🛠️ Tecnologias

- React 19
- TypeScript
- Vite
- Tailwind CSS

## 📝 License

Private
