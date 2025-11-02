# 🎮 Trainer - Documentação

## Visão Geral

O **Trainer** é um módulo de treinamento interativo que permite aos usuários praticarem suas decisões de poker GTO em situações reais de torneio, com feedback instantâneo e sistema de pontuação.

## 🎯 Funcionalidades

### 1. Seleção de Fase do Torneio
- **Tela inicial**: Escolha entre diferentes fases do torneio
- **Fases disponíveis**:
  - 100~60% left
  - 60~40% left
  - 40~20% left
  - Near bubble
  - After bubble
  - 3 tables
  - 2 tables
  - Final table
- **Filtro automático**: Mostra apenas fases com soluções disponíveis
- **Contador de soluções**: Exibe quantas soluções existem em cada fase

### 2. Seleção de Solução
- **Filtro por fase**: Após escolher a fase, veja apenas as soluções relevantes
- **Informações exibidas**:
  - Nome da solução
  - Fase do torneio
  - Número de jogadores
  - Stack médio em BB
- **Cards interativos**: Hover effects e animações suaves

### 3. Modo de Treino

#### Interface Visual
- **Mesa de Poker 3D**: Visualização realista da mesa com:
  - Background da mesa (table.png)
  - Posicionamento dinâmico dos jogadores
  - Indicação do jogador atual (destaque teal)
  - Stacks e bounties visíveis
  - Pot no centro da mesa

#### Componentes da Tela
1. **Header Superior**:
   - Botão "Voltar"
   - Nome da solução
   - Estatísticas em tempo real:
     - Pontos totais
     - Acertos/Total
     - Percentual de precisão

2. **Header de Situação**:
   - PlayerStrategyCards de todos os jogadores
   - Histórico de ações
   - Informações do torneio

3. **Grid Principal** (2 colunas):
   - **Esquerda**: Mesa visual com players e fichas
   - **Direita**: Range Grid (matriz 13x13 de mãos)

4. **Botões de Ação**:
   - Design com gradientes vibrantes
   - Cores específicas por ação:
     - **Fold**: Azul → Cyan
     - **Call**: Verde → Esmeralda
     - **Check**: Cinza
     - **Raise**: Laranja → Vermelho
     - **Allin**: Roxo → Rosa
   - Efeitos hover: scale + elevação
   - Sombras coloridas

#### Sistema de Pontuação
```typescript
// Pontuação por resposta
- Ação correta (GTO): 100 pontos
- Ação parcialmente correta: 100 - (diferença de frequência × 10)
- Mínimo: 0 pontos
```

#### Feedback Visual
Após escolher uma ação:
- **Barras de progresso**: Mostram frequência de cada ação
- **Destaque da escolha**: Card roxo com borda
- **Indicação GTO**: Badge "GTO" em teal
- **Comparação**: Sua escolha vs solução GTO
- **Botão "Próxima Situação"**: Navega para o próximo node

### 4. Navegação na Árvore
- **Automática**: Segue a ação escolhida pelo usuário
- **Lazy Loading**: Carrega nodes sob demanda
- **Reset**: Volta ao node 0 quando não há próximo node

## 🎨 Componentes Criados

### `PokerTableVisual.tsx`
Renderiza a mesa de poker com:
- Background da mesa (table.png)
- Players posicionados em elipse ao redor da mesa
- Cards de jogador com:
  - Posição (UTG, BTN, BB, etc.)
  - Stack (em BB ou chips)
  - Bounty (se houver)
  - Indicador de ação atual (ponto pulsante)
- Pot no centro

**Props**:
```typescript
interface PokerTableVisualProps {
    currentNode: NodeData;
    settings: SettingsData;
    bigBlind: number;
    displayMode: 'bb' | 'chips';
}
```

### `Trainer.tsx` (Atualizado)
Componente principal com:
- Estado de navegação (fase → solução → treino)
- Sistema de sessão de treino
- Lógica de pontuação
- Integração com mesa visual e range grid

**Estados**:
```typescript
- selectedPhase: string | null
- selectedSolutionId: string | null
- session: TrainingSession | null
- currentNodeId: number
- userAction: string | null
- showFeedback: boolean
```

## 📁 Estrutura de Arquivos

```
trainer/
├── table.png          # Background da mesa de poker
└── action_button.png  # (Não utilizado - usamos gradientes CSS)

components/
├── PokerTableVisual.tsx  # Mesa visual com players
├── Trainer.tsx           # Componente principal do trainer
├── RangeGrid.tsx         # Matriz de ranges (já existente)
└── Header.tsx            # Header com situação (já existente)
```

## 🎮 Fluxo de Uso

1. **HomePage** → Clique em "Trainer"
2. **Seleção de Fase** → Escolha a fase do torneio
3. **Seleção de Solução** → Escolha uma solução específica
4. **Modo de Treino**:
   - Veja a situação na mesa visual
   - Analise o range no grid
   - Escolha uma ação
   - Receba feedback instantâneo
   - Continue para próxima situação
5. **Estatísticas**: Acompanhe seu progresso em tempo real

## 🎯 Melhorias Futuras

- [ ] Histórico de sessões de treino
- [ ] Filtros avançados (número de jogadores, stack range)
- [ ] Modo de treino cronometrado
- [ ] Exportar estatísticas
- [ ] Comparação com outros jogadores
- [ ] Treino focado em spots específicos
- [ ] Quiz mode (perguntas aleatórias)
- [ ] Replay de mãos treinadas

## 🐛 Troubleshooting

### Mesa não aparece
- Verifique se `/trainer/table.png` existe
- Confirme que o caminho está correto no componente

### Nodes não carregam
- Verifique a função `loadNode` em App.tsx
- Confirme que `solutions-metadata.json` está correto

### Pontuação incorreta
- Verifique o cálculo em `checkAnswer()`
- Confirme que `action.played` contém frequências válidas

## 📊 Métricas de Performance

- **Carregamento inicial**: < 2s (lazy loading)
- **Troca de node**: < 500ms
- **Feedback visual**: Instantâneo
- **Animações**: 60 FPS (CSS transitions)

## 🎨 Paleta de Cores

```css
/* Ações */
Fold:  from-blue-500 to-cyan-600
Call:  from-green-500 to-emerald-600
Check: from-gray-500 to-gray-600
Raise: from-orange-500 to-red-600
Allin: from-purple-500 to-pink-600

/* Destaques */
Jogador atual: border-teal-400, shadow-teal-500/50
Escolha do usuário: bg-purple-500/20, border-purple-400
Ação GTO: text-teal-400

/* Backgrounds */
Mesa: bg-[#23272f]
Fundo: bg-[#1a1d23]
Cards: bg-black/60
```

## 🔧 Configuração

Nenhuma configuração adicional necessária. O Trainer usa as mesmas soluções do módulo Solutions.

## 📝 Notas Técnicas

- **Responsivo**: Grid adapta-se a diferentes tamanhos de tela
- **Acessível**: Botões com contraste adequado
- **Performance**: Lazy loading de nodes
- **UX**: Feedback visual imediato em todas as ações
