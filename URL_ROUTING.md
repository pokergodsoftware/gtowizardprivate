# Sistema de URL Routing

## Funcionalidade

Implementado sistema de URL routing similar ao GTO Wizard que permite compartilhar links diretos para spots específicos e nodes.

## Como Funciona

### 1. **Navegação Automática**

Quando você navega pelo app (seleciona solução, muda de node, seleciona mão), a URL é automaticamente atualizada com os parâmetros:

```
?page=solutions&solution=./spots/final_table/0001&node=5&hand=AA
```

### 2. **Compartilhamento de Links**

Você pode copiar o link atual de duas formas:

- **Botão "Copy Link"** no header (ao lado do botão Change)
  - Clique para copiar a URL atual
  - Feedback visual mostra "Copied!" quando copiado com sucesso
  
- **Copiar da barra de endereço** do navegador
  - A URL é sempre atualizada conforme você navega

### 3. **Carregamento de Links**

Quando alguém abre um link compartilhado:

1. O app carrega as soluções normalmente
2. Detecta os parâmetros na URL
3. Automaticamente:
   - Seleciona a solução correta
   - Carrega o node especificado
   - Restaura a mão selecionada (se houver)
   - Navega para a página correta (solutions ou trainer)

## Parâmetros da URL

### `page`
- **Valores:** `home`, `solutions`, `trainer`
- Define qual página do app deve ser exibida
- Se omitido e houver `solution`, assume `solutions`

### `solution`
- **Formato:** caminho relativo da solução (ex: `./spots/final_table/0001`)
- Identifica unicamente qual solução carregar
- **Importante:** usa o `path` da solução, não o ID interno

### `node`
- **Formato:** número inteiro (ex: `5`, `42`)
- Define qual node na árvore de decisões deve ser exibido
- Se omitido, assume node raiz (0)

### `hand`
- **Formato:** string da mão (ex: `AA`, `KQs`, `T9o`)
- Restaura qual mão estava selecionada na matriz
- Opcional

## Exemplos de URLs

### Spot específico no node raiz
```
http://localhost:5173/?page=solutions&solution=./spots/final_table/0001
```

### Spot com node específico
```
http://localhost:5173/?page=solutions&solution=./spots/60-40/0005&node=12
```

### Spot com node e mão selecionada
```
http://localhost:5173/?page=solutions&solution=./spots/100-60/0003&node=8&hand=AKs
```

### Apenas página (sem solução)
```
http://localhost:5173/?page=trainer
```

## Implementação Técnica

### Arquivos Modificados

1. **`lib/urlUtils.ts`** (novo)
   - `encodeUrlState()`: converte estado do app em parâmetros de URL
   - `decodeUrlState()`: lê parâmetros da URL
   - `updateUrl()`: atualiza URL sem recarregar página
   - `findSolutionByPath()`: encontra solução pelo path
   - `createUrlStateFromSolution()`: cria estado de URL a partir da solução

2. **`App.tsx`**
   - useEffect para restaurar estado da URL na inicialização
   - useEffect para sincronizar mudanças de estado com a URL
   - Flag `hasRestoredFromUrl` para evitar loops

3. **`components/Header.tsx`**
   - Botão "Copy Link" com feedback visual
   - Estado `copyStatus` para indicar quando copiado

### Fluxo de Restauração

1. App carrega soluções (metadata)
2. Após carregamento, verifica se tem parâmetros na URL
3. Se sim:
   - Busca solução pelo path
   - Carrega nodes necessários
   - Define página, solução, node e mão
   - Marca como restaurado
4. A partir daí, mudanças de estado atualizam a URL automaticamente

### Sincronização Bidirecional

- **Navegação → URL:** useEffect observa estado e atualiza URL
- **URL → Navegação:** useEffect inicial restaura estado da URL
- **Botão Copy Link:** copia URL completa atual para clipboard

## Benefícios

✅ **Compartilhamento fácil:** compartilhe spots específicos com amigos  
✅ **Bookmarks funcionais:** favoritos do navegador levam direto ao spot  
✅ **Deep linking:** entre diretamente em spots específicos via links externos  
✅ **Histórico útil:** botão voltar/avançar do navegador funciona perfeitamente  
✅ **Compatível com GTO Wizard:** mesma experiência de UX  

## Notas

- A URL usa `replace` (não `push`) para evitar histórico excessivo
- O path da solução é usado como identificador (mais estável que ID interno)
- Funciona tanto na página de solutions quanto no trainer
- Totalmente compatível com lazy loading de nodes
