# Análise Detalhada do Projeto: GTO Poker Range Viewer

## 1. Visão Geral do Projeto

O **GTO Poker Range Viewer** é uma Single-Page Application (SPA) construída em React e TypeScript, projetada para jogadores de poker que estudam estratégias de GTO (Game Theory Optimal). A aplicação permite aos usuários carregar e visualizar soluções de poker complexas, tipicamente exportadas de softwares de simulação como o HRC (Hold'em Resources Calculator).

### Objetivo Principal
Fornecer uma interface de usuário intuitiva e visualmente rica, semelhante a ferramentas profissionais como o GTO Wizard, para analisar:
- Ranges de mãos (169 combinações possíveis)
- Frequências de ações (fold, call, raise, check)
- Árvores de decisão de uma mão de poker
- Expected Values (EV) para cada ação

---

## 2. Arquitetura Técnica e Tecnologias

### Stack Tecnológico
- **Framework**: React 19 (com React.StrictMode)
- **Linguagem**: TypeScript (versão ~5.8.2)
- **Build Tool**: Vite 6.2.0
- **Estilização**: Tailwind CSS (via CDN)
- **Gerenciamento de Estado**: React Hooks (useState, useEffect, useMemo, useCallback)

### Estrutura de Módulos
```
WizardPrivadoo/
├── App.tsx                    # Componente principal orquestrador
├── index.tsx                  # Entry point da aplicação
├── index.html                 # HTML base com Tailwind CDN
├── types.ts                   # Definições de tipos TypeScript
├── lib/
│   └── pokerUtils.ts         # Utilitários e lógica de negócio
├── components/
│   ├── SolutionsLibrary.tsx  # Tela inicial com lista de soluções
│   ├── FileUploadScreen.tsx  # Upload de novas soluções
│   ├── Header.tsx            # Navegação da árvore de decisão
│   ├── RangeGrid.tsx         # Grid 13x13 de mãos
│   ├── HandCell.tsx          # Célula individual do grid
│   ├── Sidebar.tsx           # Painel lateral de informações
│   ├── PokerTable.tsx        # Visualização da mesa
│   ├── ActionsBar.tsx        # Barra de frequências agregadas
│   ├── ComboDetail.tsx       # Detalhes de mão selecionada
│   ├── HandsDetail.tsx       # Detalhes adicionais
│   ├── DisplayModeToggle.tsx # Toggle bb/chips
│   └── PayoutsModal.tsx      # Modal de estrutura de prêmios
├── spots/                    # Soluções pré-carregadas
│   └── final_table/
│       └── speed20_1/
│           ├── settings.json
│           ├── equity.json
│           └── nodes/
│               ├── 0.json
│               ├── 1.json
│               └── ...
└── solutions.json            # Manifesto de soluções

```

### Configuração do Vite
```typescript
// vite.config.ts
- Servidor na porta 3000
- Host: 0.0.0.0 (acessível externamente)
- Plugin React para JSX/TSX
- Alias '@' para o diretório raiz
```

---

## 3. Modelo de Dados e Estruturas

### 3.1 Tipos Principais (types.ts)

#### AppData
Objeto raiz que representa uma solução de poker completa:
```typescript
interface AppData {
  id: string;              // UUID único
  fileName: string;        // Nome descritivo (ex: "FT 3-handed 20bb avg")
  tournamentPhase: string; // Fase do torneio (ex: "Final table")
  settings: SettingsData;  // Configurações da mão
  equity: EquityData;      // Dados de ICM/ChipEV
  nodes: Map<number, NodeData>; // Árvore de decisão
}
```

#### NodeData
Representa um ponto de decisão na árvore do jogo:
```typescript
interface NodeData {
  player: number;          // Índice do jogador agindo (0-based)
  street: number;          // 0=preflop, 1=flop, 2=turn, 3=river
  children: number;        // Número de nós filhos
  sequence: any[];         // Sequência de ações até este ponto
  actions: Action[];       // Ações possíveis neste nó
  hands: { [hand: string]: HandData }; // Estratégia para cada mão
}
```

#### HandData
Estratégia para uma mão específica em um nó:
```typescript
interface HandData {
  weight: number;          // Fator de ponderação (0-1)
  played: number[];        // Frequências para cada ação (0-1)
  evs: number[];          // Expected Value para cada ação
}
```

#### Action
Ação possível em um nó:
```typescript
interface Action {
  type: 'F' | 'R' | 'C' | 'X'; // Fold, Raise, Call, Check
  amount: number;              // Quantidade de chips (0 para fold/check)
  node?: number;              // ID do próximo nó (se aplicável)
}
```

#### SettingsData
Configurações da mão:
```typescript
interface SettingsData {
  handdata: {
    stacks: number[];      // Stacks de cada jogador
    blinds: number[];      // [SB, BB, Ante]
    bounties: number[];    // Bounties (para PKO)
    anteType: string;      // Tipo de ante
  };
  eqmodel: EqModelData;    // Modelo de equity (ICM)
  treeconfig: any;         // Configuração da árvore
  engine: any;             // Configuração do engine
}
```

### 3.2 Exemplo de Dados Reais

**settings.json** (simplificado):
```json
{
  "handdata": {
    "stacks": [17280000, 9600000, 74240000],
    "blinds": [3200000, 1600000, 480000],
    "bounties": [188.0, 134.0, 328.0],
    "anteType": "REGULAR"
  },
  "eqmodel": {
    "id": "icm",
    "structure": {
      "name": "Unnamed",
      "bountyType": "PKO",
      "progressiveFactor": 0.5,
      "chips": 2590000.0,
      "prizes": {
        "1": 566.0,
        "3": 429.0,
        "4": 325.0
      }
    }
  }
}
```

**nodes/0.json** (exemplo de nó):
```json
{
  "player": 0,
  "street": 0,
  "children": 2,
  "sequence": [],
  "actions": [
    {"type": "F", "amount": 0, "node": 1},
    {"type": "R", "amount": 16800000, "node": 3}
  ],
  "hands": {
    "AA": {
      "weight": 1.0,
      "played": [0.0, 1.0],
      "evs": [0.0, 2.45678]
    },
    "72o": {
      "weight": 1.0,
      "played": [1.0, 0.0],
      "evs": [0.0, -1.25579]
    }
  }
}
```

---

## 4. Fluxo de Dados e Ciclo de Vida

### 4.1 Inicialização da Aplicação

```
1. App.tsx é montado
   ↓
2. useEffect chama loadSolutionsFromManifest()
   ↓
3. Fetch de solutions.json
   ↓
4. Para cada entrada no manifesto:
   - Fetch settings.json
   - Fetch equity.json
   - Fetch todos os nodes/*.json
   ↓
5. Parse e armazenamento em solutions[]
   ↓
6. Renderização da SolutionsLibrary
```

### 4.2 Seleção de Solução

```
1. Usuário clica em uma linha da tabela
   ↓
2. onSelectSolution(solutionId) é chamado
   ↓
3. selectedSolutionId é atualizado no estado
   ↓
4. App renderiza interface principal do visualizador
   ↓
5. currentNodeId é inicializado para 0 (primeiro nó)
```

### 4.3 Navegação na Árvore

```
1. Usuário clica em uma ação no Header
   ↓
2. onNodeChange(newNodeId) é chamado
   ↓
3. currentNodeId é atualizado
   ↓
4. Todos os componentes dependentes re-renderizam:
   - Header (atualiza trilha de ações)
   - RangeGrid (novas frequências)
   - PokerTable (novo estado da mesa)
   - ActionsBar (novas frequências agregadas)
   - ComboDetail (novos detalhes se mão selecionada)
```

---

## 5. Componentes Detalhados

### 5.1 App.tsx (Orquestrador)

**Responsabilidades:**
- Gerenciar estado global da aplicação
- Carregar e parsear soluções
- Coordenar navegação entre telas
- Prover dados para componentes filhos

**Estado Principal:**
```typescript
const [solutions, setSolutions] = useState<AppData[]>([]);
const [selectedSolutionId, setSelectedSolutionId] = useState<string | null>(null);
const [currentNodeId, setCurrentNodeId] = useState<number>(0);
const [selectedHand, setSelectedHand] = useState<string | null>(null);
const [displayMode, setDisplayMode] = useState<'bb' | 'chips'>('bb');
```

**Funções Chave:**
- `parseHrcFolder()`: Parse de arquivos de solução
- `loadSolutionsFromManifest()`: Carrega soluções do manifesto
- `handleFileChange()`: Upload de novas soluções

### 5.2 SolutionsLibrary.tsx (Tela Inicial)

**Funcionalidades:**
- Exibir tabela de soluções com filtros
- Ordenação por colunas (nome, stack médio, etc.)
- Filtros por fase do torneio e número de jogadores
- Integração com FileUpload

**Estrutura da Tabela:**
```
| Nome | Players | Avg Stack | UTG | UTG1 | ... | BB |
|------|---------|-----------|-----|------|-----|----|
```

**Filtros Disponíveis:**
- Fase do torneio: "100~60% left", "Final table", etc.
- Número de jogadores: 2-9

### 5.3 Header.tsx (Navegação)

**Componentes:**
- Informações da solução (tipo, stack médio)
- Trilha de ações (breadcrumb navegável)
- PlayerStrategyCard para cada ponto de decisão

**PlayerStrategyCard:**
- Exibe posição, stack e bounty do jogador
- Lista ações disponíveis (clicáveis)
- Destaque visual para jogador ativo
- Navegação para qualquer ponto da árvore

### 5.4 RangeGrid.tsx e HandCell.tsx (Visualização Principal)

**RangeGrid:**
- Grid CSS 13x13 (169 células)
- Renderiza HandCell para cada mão

**HandCell (Componente Crítico):**
```typescript
// Lógica de Renderização:
1. Verifica se handData existe e tem frequências > 0
2. Cria segmentos de gradiente baseados em frequências
3. Calcula cores usando getActionColor()
4. Calcula EV total: Σ(ev[i] * played[i])
5. Renderiza fundo gradiente + texto sobreposto
```

**Esquema de Cores:**
- Fold: `bg-sky-600` (azul)
- Call: `bg-lime-500` (verde)
- Raise: `bg-pink-600` (rosa)
- Allin: `bg-red-600` (vermelho)
- Check: `bg-gray-500` (cinza) ou `bg-lime-500` (se BB)

**Exemplo Visual:**
```
┌─────────┐
│   AKs   │  ← Nome da mão
│  2.45   │  ← EV total
└─────────┘
  70% Rosa (Raise)
  30% Azul (Fold)
```

### 5.5 PokerTable.tsx (Contexto Visual)

**Lógica Complexa:**
```typescript
// Recalcula estado da mesa iterando sobre pathNodeIds:
1. Aplica antes de todos os jogadores
2. Aplica blinds (SB, BB)
3. Para cada nó no caminho:
   - Identifica ação tomada
   - Atualiza stacks
   - Atualiza pot
   - Marca jogadores que deram fold
4. Renderiza mesa com estado atual
```

**Elementos Visuais:**
- Círculos para jogadores (com posição e stack)
- Dealer button (D)
- Bounties (ícone de moeda)
- Pot central
- Destaque para jogador ativo

**Layout Posicional:**
- 9-max: Posições ao redor da mesa
- 3-handed: BTN, SB, BB
- Heads-up: BTN (SB) e BB

### 5.6 ActionsBar.tsx (Frequências Agregadas)

**Lógica de Cálculo:**
```typescript
// Para cada ação:
1. Itera sobre todas as 169 mãos
2. Para cada mão:
   - Obtém frequência da ação: played[i]
   - Obtém max combos: getHandTypeMaxCombos(hand)
   - Calcula combos reais: weight * maxCombos * freq
3. Soma combos de todas as mãos
4. Calcula frequência percentual: (combos_ação / total_combos) * 100
```

**Exemplo de Saída:**
```
┌─────────────┬─────────────┬─────────────┐
│ Fold        │ Call        │ Raise 16.8  │
│ 45.2%       │ 12.3%       │ 42.5%       │
└─────────────┴─────────────┴─────────────┘
```

### 5.7 ComboDetail.tsx (Detalhes da Mão)

**Exibição:**
- Nome da mão selecionada
- EV total
- Breakdown de ações com frequências e EVs
- Lista de todos os combos específicos (ex: A♠K♠, A♥K♥)

**Exemplo:**
```
AKs
EV Total: 2.456

Ações:
  Raise 16.8  70.0%  EV: 2.789
  Fold        30.0%  EV: 0.000

Combos (4):
  A♠K♠  A♥K♥  A♦K♦  A♣K♣
```

---

## 6. Utilitários e Lógica de Negócio (pokerUtils.ts)

### 6.1 Funções Principais

#### generateHandMatrix()
Gera matriz 13x13 de mãos:
```typescript
// Retorna:
[
  ['AA', 'AKs', 'AQs', ..., 'A2s'],
  ['AKo', 'KK', 'KQs', ..., 'K2s'],
  ...
  ['A2o', 'K2o', 'Q2o', ..., '22']
]
```

#### getPlayerPositions(numPlayers)
Mapeia posições baseado no número de jogadores:
```typescript
9: ['UTG', 'UTG1', 'UTG2', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB']
3: ['BTN', 'SB', 'BB']
2: ['BTN', 'BB']
```

#### getActionName(action, bigBlind, playerStack, displayMode)
Formata nome da ação:
```typescript
// Exemplos:
'F' → 'Fold'
'C' → 'Call'
'X' → 'Check'
'R' + 16800000 (bb mode) → 'Raise 16.8'
'R' + 16800000 (chips mode) → 'Raise 16,800,000'
'R' + all-in → 'Allin 16.8'
```

**Lógica de All-in:**
- True all-in: `amount >= playerStack`
- Effective all-in: `amount >= playerStack * 0.9`
- Opponent all-in: Raise sized to put shorter stack all-in

#### getActionColor(actionName, playerIndex, numPlayers)
Retorna classe Tailwind CSS:
```typescript
'Allin' → 'bg-red-600'
'Raise' → 'bg-pink-600'
'Fold' → 'bg-sky-600'
'Call' → 'bg-lime-500'
'Check' (BB) → 'bg-lime-500'
'Check' (outros) → 'bg-gray-500'
```

#### getHandTypeMaxCombos(handName)
Retorna número máximo de combos:
```typescript
'AA' → 6  (pares)
'AKs' → 4  (suited)
'AKo' → 12 (offsuit)
```

#### getCombosForHand(hand)
Gera lista de combos específicos:
```typescript
'AKs' → ['AsKs', 'AhKh', 'AdKd', 'AcKc']
'AKo' → ['AsKh', 'AsKd', 'AsKc', 'AhKs', ...]
'AA' → ['AsAh', 'AsAd', 'AsAc', 'AhAd', 'AhAc', 'AdAc']
```

### 6.2 Formatação

#### formatChips(amount)
```typescript
1234567 → '1,234,567'
```

#### formatPayouts(payouts)
```typescript
[566, 429, 429, 325] → [
  { position: '1.', prize: '$566' },
  { position: '2-3.', prize: '$429' },
  { position: '4.', prize: '$325' }
]
```

---

## 7. Experiência do Usuário (UX Flow)

### 7.1 Fluxo Principal

```
1. Abertura da Aplicação
   ↓
2. Visualização da SolutionsLibrary
   - Tabela com soluções pré-carregadas
   - Filtros e ordenação
   ↓
3. Seleção de Solução
   - Clique em linha da tabela
   ↓
4. Visualizador Principal
   - Header com trilha de ações
   - RangeGrid 13x13
   - Sidebar com PokerTable, ActionsBar
   ↓
5. Análise de Mão
   - Clique em HandCell
   - ComboDetail exibe detalhes
   ↓
6. Navegação na Árvore
   - Clique em ações no Header
   - Interface atualiza para novo ponto de decisão
```

### 7.2 Interações Principais

**Na SolutionsLibrary:**
- Filtrar por fase do torneio
- Filtrar por número de jogadores
- Ordenar por coluna
- Upload de nova solução (drag & drop)
- Selecionar solução

**No Visualizador:**
- Selecionar mão no RangeGrid
- Navegar na árvore via Header
- Toggle entre bb/chips
- Ver estrutura de prêmios (modal)
- Voltar para biblioteca

**Feedback Visual:**
- HandCell selecionada: `ring-2 ring-blue-500`
- Jogador ativo: `ring-2 ring-teal-400`
- Hover em ações: `hover:bg-black/25`
- Gradientes coloridos em HandCell

---

## 8. Persistência e Carregamento de Dados

### 8.1 Fontes de Dados

**Pré-carregadas:**
- Definidas em `solutions.json`
- Arquivos estáticos em `/spots/`

**Upload do Usuário:**
- Drag & drop de pasta
- Estrutura esperada:
  ```
  pasta_solucao/
  ├── settings.json
  ├── equity.json
  └── nodes/
      ├── 0.json
      ├── 1.json
      └── ...
  ```

### 8.2 Validação de Dados

```typescript
// parseHrcFolder valida:
- Presença de settings.json
- Presença de equity.json
- Presença de pelo menos 1 arquivo em nodes/
- Parse JSON válido
```

### 8.3 Limitações

**Sem Persistência:**
- Dados não salvos em localStorage
- Soluções carregadas perdidas ao recarregar página
- Sem cache de soluções

**Client-Side Only:**
- Sem backend
- Sem autenticação
- Sem sincronização entre dispositivos

---

## 9. Performance e Otimizações

### 9.1 Otimizações Implementadas

**React.memo:**
```typescript
// HandCell é memoizado para evitar re-renders desnecessários
export const HandCell = React.memo(HandCellMemo);
```

**useMemo:**
```typescript
// Cálculos pesados são memoizados
const pathNodeIds = useMemo(() => {
  // Calcula caminho de nós
}, [currentNodeId, parentMap]);
```

**useCallback:**
```typescript
// Funções de callback são memoizadas
const handleFileChange = useCallback(async (files, phase) => {
  // ...
}, []);
```

### 9.2 Potenciais Gargalos

**RangeGrid:**
- 169 HandCell renderizados simultaneamente
- Cada HandCell calcula gradientes e EVs
- Solução: React.memo reduz re-renders

**Carregamento de Soluções:**
- Múltiplos fetches assíncronos
- Arquivos JSON grandes (nodes)
- Solução: Promise.all para paralelização

**PokerTable:**
- Recalcula estado da mesa a cada render
- Itera sobre pathNodeIds
- Solução: useMemo para cachear cálculos

---

## 10. Estrutura de Arquivos de Solução

### 10.1 settings.json

**Estrutura:**
```json
{
  "handdata": {
    "stacks": [number[]],      // Stacks dos jogadores
    "blinds": [SB, BB, Ante],  // Blinds e ante
    "bounties": [number[]],    // Bounties (PKO)
    "anteType": string,        // Tipo de ante
    "skipSb": boolean,         // Pular SB
    "movingBu": boolean        // Button móvel
  },
  "eqmodel": {
    "id": string,              // Modelo de equity (icm/chip)
    "structure": {
      "name": string,
      "bountyType": string,    // PKO, etc.
      "progressiveFactor": number,
      "chips": number,
      "prizes": {              // Estrutura de prêmios
        "1": number,
        "2": number,
        ...
      }
    }
  },
  "treeconfig": {...},         // Configuração da árvore
  "engine": {...}              // Configuração do engine
}
```

### 10.2 equity.json

**Estrutura:**
```json
{
  "equityUnit": string,              // Unidade de equity
  "conversionFactors": {
    "toUSD": number,
    "toRegularPrizePercent": number
  },
  "preHandEquity": [number[]],       // Equity pré-mão de cada jogador
  "bubbleFactors": [[number[][]]]    // Fatores de bubble
}
```

### 10.3 nodes/X.json

**Estrutura:**
```json
{
  "player": number,           // Índice do jogador (0-based)
  "street": number,           // 0=preflop, 1=flop, 2=turn, 3=river
  "children": number,         // Número de nós filhos
  "sequence": [],             // Sequência de ações
  "actions": [
    {
      "type": "F|R|C|X",     // Tipo de ação
      "amount": number,       // Quantidade de chips
      "node": number          // ID do próximo nó
    }
  ],
  "hands": {
    "AA": {
      "weight": number,       // Fator de ponderação (0-1)
      "played": [number[]],   // Frequências para cada ação
      "evs": [number[]]       // EVs para cada ação
    },
    ...
  }
}
```

---

## 11. Considerações de Design

### 11.1 Princípios de UI/UX

**Cores Semânticas:**
- Vermelho: All-in (ação agressiva/final)
- Rosa: Raise (ação agressiva)
- Verde: Call/Check (ação passiva)
- Azul: Fold (desistir)
- Cinza: Check (ação neutra)

**Hierarquia Visual:**
- Mãos mais jogadas: Cores mais vibrantes
- Mãos menos jogadas: Cores mais escuras
- EV alto: Destaque visual

**Feedback Imediato:**
- Hover states em elementos clicáveis
- Ring visual em elementos selecionados
- Transições suaves (duration-150, duration-200)

### 11.2 Acessibilidade

**Melhorias Possíveis:**
- Labels ARIA para componentes interativos
- Navegação por teclado
- Contraste de cores (WCAG AA)
- Suporte a screen readers

---

## 12. Possíveis Melhorias Futuras

### 12.1 Funcionalidades

**Análise Avançada:**
- Comparação de ranges entre jogadores
- Heatmaps de EV
- Gráficos de frequências ao longo da árvore
- Exportação de ranges para imagem

**Persistência:**
- localStorage para soluções carregadas
- IndexedDB para grandes volumes
- Favoritos e anotações

**Colaboração:**
- Compartilhamento de soluções via URL
- Comentários e anotações
- Histórico de navegação

### 12.2 Performance

**Lazy Loading:**
- Carregar nodes sob demanda
- Virtual scrolling para listas grandes

**Web Workers:**
- Cálculos pesados em background
- Parse de JSON em worker

**Caching:**
- Service Worker para cache de assets
- Cache de cálculos frequentes

### 12.3 UX

**Tutoriais:**
- Onboarding para novos usuários
- Tooltips explicativos
- Vídeos de demonstração

**Customização:**
- Temas de cores
- Layout configurável
- Atalhos de teclado personalizáveis

---

## 13. Conclusão

O **GTO Poker Range Viewer** é uma aplicação bem arquitetada que demonstra:

✅ **Separação de Responsabilidades**: Componentes focados e reutilizáveis
✅ **Tipagem Forte**: TypeScript para segurança e manutenibilidade
✅ **Performance**: Otimizações com React.memo, useMemo, useCallback
✅ **UX Rica**: Interface visual intuitiva com feedback imediato
✅ **Escalabilidade**: Estrutura modular facilita adição de features

**Pontos Fortes:**
- Visualização clara e intuitiva de dados complexos
- Navegação fluida na árvore de decisão
- Código bem organizado e documentado
- Uso eficiente de React Hooks

**Áreas de Melhoria:**
- Adicionar persistência de dados
- Implementar testes automatizados
- Melhorar acessibilidade
- Adicionar documentação de API

---

## 14. Referências Técnicas

### 14.1 Dependências

```json
{
  "react": "^19.2.0",
  "react-dom": "^19.2.0",
  "uuid": "latest",
  "typescript": "~5.8.2",
  "vite": "^6.2.0",
  "@vitejs/plugin-react": "^5.0.0"
}
```

### 14.2 Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build
npm run preview
```

### 14.3 Estrutura de URLs

```
http://localhost:3000/              # Aplicação principal
http://localhost:3000/solutions.json # Manifesto de soluções
http://localhost:3000/spots/...     # Arquivos de solução
```

---

**Documento gerado em:** 2025-01-28
**Versão do Projeto:** 0.0.0
**Autor da Análise:** Cascade AI Assistant
