# 🎮 Trainer Simulator - Documentação Completa

## 🎯 Visão Geral

O **Trainer Simulator** é um sistema de treinamento realista de poker GTO que simula situações reais de torneio. Ao invés de navegar manualmente pela árvore de decisões, o sistema **sorteia automaticamente** spots, posições e mãos específicas para criar uma experiência de treino autêntica.

## 🚀 Fluxo de Uso

```
HomePage → Trainer
  ↓
Seleciona Fase do Torneio (ex: "100~60% left")
  ↓
Sistema SORTEIA automaticamente:
  ✓ Um spot aleatório da fase
  ✓ Uma posição aleatória para você
  ✓ Uma mão específica (combo) do seu range
  ↓
Você vê:
  - Mesa visual com todos os jogadores
  - SUA MÃO no centro (ex: Q♠ J♠)
  - Botões de ação (Fold, Call, Raise, etc.)
  ↓
Escolhe uma ação → Recebe feedback GTO
  ↓
Clica "Próximo Spot" → Repete o processo
```

## 🎲 Sistema de Sorteio

### 1. Sorteio de Spot
```typescript
// Sorteia uma solução aleatória da fase escolhida
const randomSolution = randomElement(phaseSolutions);
const nodeId = 0; // Começa sempre do node raiz
```

### 2. Sorteio de Posição
```typescript
// Sorteia qual jogador você será (UTG, BTN, BB, etc.)
const randomPlayerPosition = Math.floor(Math.random() * numPlayers);
```

### 3. Sorteio de Mão
```typescript
// 1. Filtra mãos jogadas (frequência > 0) no range
const playedHands = allHands.filter(hand => totalFreq > 0);

// 2. Sorteia uma mão do range
const randomHandName = randomElement(playedHands); // Ex: "AKo"

// 3. Sorteia um combo específico dessa mão
const randomCombo = getRandomCombo(randomHandName); // Ex: "AhKd"
```

## 📊 Componentes Criados

### `PlayerHand.tsx`
Exibe as cartas do jogador de forma visual (como no GGPoker).

**Features**:
- Renderização de cartas estilo poker real
- Cores por naipe: ♠ (preto), ♥ (vermelho), ♦ (azul), ♣ (verde)
- Rank no topo e embaixo (invertido)
- Sombra e bordas para efeito 3D

**Props**:
```typescript
interface PlayerHandProps {
    hand: string; // Ex: "AhKd", "QsQc"
}
```

### `TrainerSimulator.tsx`
Componente principal do simulador.

**Estados**:
```typescript
interface SpotSimulation {
    solution: AppData;           // Solução sorteada
    nodeId: number;              // Node atual (sempre 0)
    playerPosition: number;      // Posição sorteada (0-8)
    playerHand: string;          // Combo específico (ex: "AhKd")
    playerHandName: string;      // Nome da mão (ex: "AKo")
}

const [stats, setStats] = useState({
    totalQuestions: 0,
    correctAnswers: 0,
    score: 0
});
```

**Funções Principais**:
- `generateNewSpot()`: Sorteia um novo spot completo
- `checkAnswer(actionName)`: Verifica se a ação está correta
- `nextSpot()`: Gera o próximo spot

### `lib/trainerUtils.ts`
Funções auxiliares para sorteio.

**Funções**:
```typescript
// Sorteia elemento aleatório
randomElement<T>(array: T[]): T

// Sorteia combo de mão
getRandomCombo(hand: string): string

// Distribui combos únicos (sem cartas duplicadas)
dealRandomCombos(hands: string[]): string[]

// Seleciona mão baseado em frequências
selectHandFromRange(played: number[]): number

// Converte índice para combo
comboIndexToString(handName: string, comboIndex: number): string
```

## 🎨 Interface Visual

### Layout Principal
```
┌─────────────────────────────────────────────┐
│ Header: Fase | Estatísticas (Pontos/Acertos)│
├─────────────────────────────────────────────┤
│                                             │
│          Mesa Visual com Players            │
│                                             │
│         ┌───────────────────┐              │
│         │   Sua Mão         │              │
│         │   Q♠ J♠           │              │
│         └───────────────────┘              │
│                                             │
├─────────────────────────────────────────────┤
│  Qual ação você tomaria?                    │
│  [Fold] [Call] [Raise to 2BB] [Allin]      │
└─────────────────────────────────────────────┘
```

### Feedback Visual
Após escolher uma ação:
```
┌─────────────────────────────────────────────┐
│  ✓ Correto! / ✗ Incorreto                   │
├─────────────────────────────────────────────┤
│  Análise GTO para QJs:                      │
│                                             │
│  Fold    ████░░░░░░  35.2% (Sua escolha)   │
│  Call    ██████████  64.8% (GTO)           │
│                                             │
│  [Próximo Spot →]                           │
└─────────────────────────────────────────────┘
```

## 🎯 Sistema de Pontuação

### Cálculo de Pontos
```typescript
// Encontra a ação GTO (mais frequente) para a mão específica
const gtoActionIndex = handData.played.indexOf(Math.max(...handData.played));
const gtoAction = node.actions[gtoActionIndex];

// Verifica se acertou
const isCorrect = userAction === gtoAction.name;

// Pontuação proporcional à frequência
const scorePoints = isCorrect 
    ? 100 
    : Math.max(0, (actionFreq / gtoFreq) * 100);
```

### Estatísticas
- **Pontos**: Soma acumulada de todos os spots
- **Acertos/Total**: Número de respostas corretas
- **Precisão**: Percentual de acertos

## 🔄 Diferenças vs Versão Anterior

| Aspecto | Versão Anterior | Versão Nova (Simulator) |
|---------|----------------|-------------------------|
| **Seleção** | Escolhe solução manualmente | Sorteia automaticamente |
| **Navegação** | Navega pela árvore | Sempre node raiz |
| **Mão** | Vê range completo | Vê mão específica |
| **Experiência** | Analítica | Realista/Simulada |
| **Feedback** | Frequências gerais | Frequências da mão específica |

## 📝 Exemplo de Uso

### Passo a Passo
1. **Usuário clica em "100~60% left"**
2. **Sistema sorteia**:
   - Solução: "speed32_1" (9 jogadores, 15bb médio)
   - Posição: BTN (Button)
   - Mão: Q♠J♠ (suited connector)
3. **Tela mostra**:
   - Mesa com 9 jogadores
   - Você no BTN com Q♠J♠
   - Ações: Fold, Raise to 2.5BB, Allin
4. **Você escolhe**: Raise to 2.5BB
5. **Feedback**:
   - ✓ Correto!
   - QJs: Fold 15%, Raise 85% (GTO)
   - +100 pontos
6. **Clica "Próximo Spot"**
7. **Sistema sorteia novo spot** e repete

## 🎮 Vantagens do Sistema

### Para Aprendizado
✅ **Realismo**: Simula situações reais de jogo
✅ **Variedade**: Nunca repete a mesma mão/posição
✅ **Foco**: Treina decisões específicas, não ranges gerais
✅ **Feedback Preciso**: Análise GTO para aquela mão exata

### Para Experiência
✅ **Imersivo**: Parece um jogo real
✅ **Dinâmico**: Não precisa navegar manualmente
✅ **Motivador**: Sistema de pontuação e estatísticas
✅ **Prático**: Treina o que você realmente precisa

## 🔧 Configuração Técnica

### Dependências
- React 19
- TypeScript
- Componentes existentes: `PokerTableVisual`, `RangeGrid`
- Utilitários: `pokerUtils.ts`, `trainerUtils.ts`

### Performance
- **Sorteio**: < 50ms
- **Renderização**: 60 FPS
- **Carregamento de node**: < 500ms (lazy loading)

## 🐛 Troubleshooting

### Mão não aparece
- Verifique se `PlayerHand` recebe combo válido (ex: "AhKd")
- Confirme que `getRandomCombo()` retorna string não vazia

### Sempre sorteia a mesma mão
- Verifique se `Math.random()` está funcionando
- Confirme que há múltiplas mãos no range

### Feedback incorreto
- Verifique se `handData.played` tem frequências corretas
- Confirme que o índice da mão está correto

## 🚀 Melhorias Futuras

- [ ] Sortear nodes além do 0 (situações pós-flop)
- [ ] Filtro de spots (ex: "apenas 3-bet pots")
- [ ] Modo "Drill" (repetir até acertar)
- [ ] Histórico de mãos treinadas
- [ ] Exportar sessão de treino
- [ ] Comparação com outros usuários
- [ ] Modo cronometrado
- [ ] Desafios diários

## 📊 Métricas de Sucesso

- **Engajamento**: Tempo médio de treino
- **Aprendizado**: Evolução da precisão ao longo do tempo
- **Variedade**: Número de spots únicos treinados
- **Consistência**: Frequência de uso

---

**Desenvolvido para**: GTO Wizard Private  
**Versão**: 3.0 (Simulator)  
**Data**: Outubro 2025
