# Hand History Panel - Documentação

## Visão Geral
Implementação de painel lateral de histórico de mão no **TrainerSimulator**, exibindo ações dos jogadores até chegar no spot do herói, em estilo "comic bubble" similar ao GGPoker.

## Arquitetura Modular

### 1. **Tipos** (`TrainerSimulator/types.ts`)
```typescript
export interface HandHistoryAction {
    position: number;           // Posição do jogador (0-8)
    playerName: string;         // Nome da posição (BTN, SB, BB, etc)
    action: string;             // Tipo de ação (Fold, Call, Raise 2.5BB, Allin)
    amount?: number;            // Valor em chips
    amountBB?: number;          // Valor em BB
    street: 'Preflop' | 'Flop' | 'Turn' | 'River';
    timestamp?: number;         // Para animações
}

export interface HandHistoryData {
    actions: HandHistoryAction[];
    currentStreet: 'Preflop' | 'Flop' | 'Turn' | 'River';
}
```

### 2. **Lógica Pura** (`utils/handHistoryBuilder.ts`)
Funções puras para construir histórico navegando pela árvore de nodes:

- `buildHandHistory(solution, targetNodeId, displayMode)` - Função principal
  - Navega da raiz (node 0) até o node alvo
  - Extrai ações de cada transição
  - Formata descrições usando `getActionName()`
  
- `buildNodePath(nodes, targetNodeId)` - BFS para encontrar caminho
  - Retorna array de node IDs do caminho

- `filterActionsByStreet()` - Filtra ações por street
- `getLatestPlayerActions()` - Última ação de cada jogador

### 3. **Hook React** (`hooks/useHandHistory.ts`)
```typescript
const { history, hasActions } = useHandHistory({
    solution: AppData,
    nodeId: number,
    displayMode: 'bb' | 'chips'
});
```

Usa `useMemo` para recalcular apenas quando solution/nodeId/displayMode mudam.

### 4. **Componente UI** (`components/HandHistoryPanel.tsx`)
Painel visual com:
- **Header**: Título "Hand History" + street atual
- **Lista de ações scrollável**:
  - Avatar circular colorido por tipo de ação
  - Nome da posição (BTN, SB, etc)
  - Bubble de ação estilo "comic" com ponteiro
  - Valor em BB (se aplicável)
- **Footer**: Contador de ações
- **Animações**: FadeIn sequencial (0.05s delay entre ações)

**Cores das ações** (via `getActionColor`):
- Allin: `#d946ef` (Magenta)
- Raise: `#f97316` (Laranja)
- Fold: `#0ea5e9` (Ciano)
- Call/Check: `#10b981` (Verde)

### 5. **Integração** (`TrainerTable.tsx`)
```tsx
// Hook para construir histórico
const { history } = useHandHistory({
    solution,
    nodeId: actualNodeId,
    displayMode
});

// Layout lado a lado
<div className="flex gap-4 h-full">
    <HandHistoryPanel 
        history={history}
        numPlayers={settings.handdata.stacks.length}
    />
    <div className="relative w-fit flex-1">
        {/* Mesa e ações */}
    </div>
</div>
```

## Fluxo de Dados

```
TrainerSimulator.tsx
  └─> currentSpot.nodeId
      └─> TrainerTable.tsx
          └─> useHandHistory(solution, nodeId, displayMode)
              └─> buildHandHistory()
                  └─> buildNodePath() → [0, 3, 7, 15]
                  └─> Extrai ações de cada transição
                      └─> HandHistoryAction[]
                          └─> HandHistoryPanel (renderiza comic bubbles)
```

## Como Funciona

1. **Geração de Spot**: `useSpotGeneration` cria spot com `nodeId` específico
2. **Navegação na Tree**: `buildNodePath()` usa BFS para encontrar caminho do node 0 até `nodeId`
3. **Extração de Ações**: Para cada transição node→node, identifica qual ação foi tomada
4. **Formatação**: Usa `getActionName()` para formatar (ex: "Raise 2.5BB", "Allin")
5. **Renderização**: `HandHistoryPanel` exibe em comic bubbles com animação

## Exemplos de Spots

### RFI (Raise First In)
```
Node 0 (Preflop) → Player: BTN
  → Ação: Fold (UTG)
  → Ação: Fold (UTG1)
  → Ação: Fold (LJ)
  → Ação: Fold (HJ)
  → Ação: Fold (CO)
  → Node X: Hero em BTN (decisão)
```

### vs Open
```
Node 0 (Preflop) → Player: BTN
  → Ação: Fold (UTG)
  → Ação: Raise 2.5BB (CO)
  → Node X: Hero em BTN (decisão: Fold/Call/Raise)
```

### vs Shove
```
Node 0 (Preflop) → Player: BB
  → Ação: Allin (SB)
  → Node X: Hero em BB (decisão: Fold/Call)
```

## Estados Visuais

### Sem ações
```
┌─────────────────┐
│   📝            │
│ No actions yet  │
│ Hand history... │
└─────────────────┘
```

### Com ações
```
┌──────────────────────┐
│ 📖 Hand History      │
│ Preflop              │
├──────────────────────┤
│ 👤 UTG               │
│   ╔════════╗         │
│   ║ Fold   ║         │
│   ╚════════╝         │
│                      │
│ 🎭 CO                │
│   ╔════════════╗     │
│   ║ Raise 2.5BB║     │
│   ║ (2.5 BB)   ║     │
│   ╚════════════╝     │
├──────────────────────┤
│ 2 actions            │
└──────────────────────┘
```

## Benefícios da Arquitetura Modular

✅ **Separação de Responsabilidades**:
- Tipos isolados em `types.ts`
- Lógica pura em `utils/` (testável, sem React)
- Estado gerenciado em hooks customizados
- UI em componentes presentacionais

✅ **Reusabilidade**:
- `buildHandHistory()` pode ser usado em outros contextos
- `HandHistoryPanel` pode ser estilizado/extendido facilmente

✅ **Manutenibilidade**:
- Cada arquivo tem < 200 linhas
- Fácil debugar (logs em `buildHandHistory`)
- Fácil testar lógica pura

✅ **Performance**:
- `useMemo` evita recálculos desnecessários
- BFS eficiente para navegação na tree

## Debugging

Console logs em `buildHandHistory()`:
```
🎬 Building hand history:
  Path: [0, 3, 7, 15]
  Target node: 15
  UTG: Fold (Street: Preflop)
  CO: Raise 2.5BB (Street: Preflop)
```

## Extensões Futuras

- [ ] Filtro por street (Preflop/Flop/Turn/River tabs)
- [ ] Mostrar combo específico usado por villain (se disponível)
- [ ] Exportar histórico em texto
- [ ] Collapse/expand por street
- [ ] Highlight da última ação antes do herói

## Arquivos Modificados/Criados

```
components/TrainerSimulator/
├── types.ts                          # ✅ Adicionado HandHistoryAction/Data
├── hooks/
│   ├── index.ts                      # ✅ Exporta useHandHistory
│   └── useHandHistory.ts             # 🆕 NOVO
├── utils/
│   └── handHistoryBuilder.ts         # 🆕 NOVO
└── components/
    ├── index.ts                       # ✅ Exporta HandHistoryPanel
    ├── HandHistoryPanel.tsx           # 🆕 NOVO
    └── TrainerTable.tsx               # ✅ Integrado HandHistoryPanel

TrainerSimulator.tsx                   # ✅ Passa nodeId para TrainerTable
```

## Padrão Seguido

Este módulo seguiu o **padrão de refatoração modular** estabelecido no projeto:

1. ✅ **Tipos primeiro** (types.ts)
2. ✅ **Lógica pura** (utils/handHistoryBuilder.ts)
3. ✅ **Hook customizado** (hooks/useHandHistory.ts)
4. ✅ **Componente UI** (components/HandHistoryPanel.tsx)
5. ✅ **Integração** (TrainerTable.tsx)

Ver: `PHASE_8_COMPLETION_REPORT.md` para metodologia completa.
