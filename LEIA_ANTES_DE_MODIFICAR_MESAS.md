# 🚨 IMPORTANTE: Separação das Mesas de Poker

## Para Desenvolvedores e AI Assistants

Este projeto possui **DUAS versões completamente diferentes** da mesa de poker:

### 1️⃣ Mesa das Solutions (Viewer)
**Arquivo:** `components/SolutionPokerTable.tsx`
- Mesa **CLÁSSICA** para visualização de spots
- Layout circular simples
- Sem features de trainer

### 2️⃣ Mesa do Trainer
**Arquivos:** `components/PokerTableVisual.tsx` + `components/PokerTable/index.tsx`
- Mesa **MODERNA** com features avançadas
- Componentes modulares
- Payouts arrastáveis

---

## ⚠️ REGRAS CRÍTICAS

### ❌ PROIBIDO:
- Usar `PokerTable/index.tsx` no `Sidebar.tsx`
- Usar `SolutionPokerTable.tsx` no `TrainerSimulator.tsx`
- Modificar um pensando que é o outro

### ✅ OBRIGATÓRIO:
- Ler comentários de aviso no topo dos arquivos
- Testar AMBAS as funcionalidades após mudanças
- Consultar `POKER_TABLE_SEPARATION.md` antes de modificar

---

## 📖 Leia Antes de Modificar:
1. `POKER_TABLE_SEPARATION.md` - Documentação completa
2. `RESTAURACAO_MESA_SOLUTIONS.md` - Histórico do problema
3. Comentários nos arquivos de componentes

---

## 🧪 Teste Antes de Commit:
```bash
# 1. Teste Solution Viewer
- Abra um spot da biblioteca
- Verifique a mesa circular clássica
- Verifique que payouts são modais

# 2. Teste Trainer
- Inicie o modo trainer
- Verifique a mesa moderna
- Verifique payouts arrastáveis
```

---

**Se tiver dúvidas, PERGUNTE antes de modificar!**
