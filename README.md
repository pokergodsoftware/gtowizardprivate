# GTO Poker Range Viewer

Uma aplicação React/TypeScript para visualizar e analisar soluções de poker GTO (Game Theory Optimal).

## 🚀 Quick Start

### Pré-requisitos
- Node.js (v18 ou superior)
- Windows (para os scripts batch) ou ambiente Unix-like

### Instalação

1. **Clone o repositório**
   ```bash
   git clone <repo-url>
   cd WizardPrivadoo
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure os arquivos estáticos**
   ```bash
   # Windows
   .\generate_index.bat
   
   # Ou manualmente
   node generate_solutions.cjs
   .\setup_public.bat
   ```

4. **Inicie o servidor de desenvolvimento**
   ```bash
   npm run dev
   ```

5. **Acesse a aplicação**
   - Abra http://localhost:3000 no navegador

## 📁 Estrutura do Projeto

```
WizardPrivadoo/
├── spots/              # Soluções de poker (settings, equity, nodes)
├── public/             # Arquivos estáticos servidos pelo Vite (gerado)
├── components/         # Componentes React
├── lib/               # Utilitários e lógica de negócio
├── App.tsx            # Componente principal
├── solutions.json     # Manifesto de soluções (gerado)
└── generate_index.bat # Script de setup
```

## 📚 Documentação

- [ANALISE_PROJETO.md](./ANALISE_PROJETO.md) - Análise detalhada da arquitetura
- [ARQUITETURA_VISUAL.md](./ARQUITETURA_VISUAL.md) - Diagramas e fluxos visuais
- [COMO_ADICIONAR_SPOTS.md](./COMO_ADICIONAR_SPOTS.md) - Como adicionar novas soluções

## 🔧 Scripts Disponíveis

- `npm run dev` - Inicia servidor de desenvolvimento
- `npm run build` - Cria build de produção
- `npm run preview` - Preview da build de produção
- `node generate_solutions.cjs` - Gera solutions.json
- `.\setup_public.bat` - Configura pasta public

## ⚠️ Troubleshooting

### Erro 404: solutions.json not found
Execute `generate_index.bat` para criar a estrutura necessária.

### Spots não carregam
1. Verifique se `public/spots` existe (junction)
2. Execute `setup_public.bat`
3. Reinicie o servidor

Veja [COMO_ADICIONAR_SPOTS.md](./COMO_ADICIONAR_SPOTS.md) para mais detalhes.

## 🎯 Funcionalidades

- ✅ Visualização de ranges 13x13 com gradientes de frequência
- ✅ Navegação interativa na árvore de decisão
- ✅ Análise detalhada de combos específicos
- ✅ Visualização da mesa de poker
- ✅ Frequências agregadas por ação
- ✅ Suporte a múltiplas fases de torneio
- ✅ Toggle entre BB e chips
- ✅ Upload de novas soluções

## 🛠️ Tecnologias

- React 19
- TypeScript
- Vite
- Tailwind CSS

## 📝 Licença

Privado
