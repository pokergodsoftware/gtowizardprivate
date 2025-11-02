const fs = require('fs');
const path = require('path');

// Mapeamento de fases do torneio
const phaseMapping = {
  '100-60': '100~60% left',
  '60-40': '60~40% left',
  '40-20': '40~20% left',
  'near_bubble': 'Near bubble',
  '3tables': '3 tables',
  '2tables': '2 tables',
  'final_table': 'Final table'
};

// Função para obter o número de jogadores do settings.json
function getNumPlayers(settingsPath) {
  try {
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    return settings.handdata.stacks.length;
  } catch (e) {
    return null;
  }
}

// Função para obter stack médio em BB
function getAvgStackBB(settingsPath) {
  try {
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    const stacks = settings.handdata.stacks;
    const blinds = settings.handdata.blinds;
    const bigBlind = Math.max(blinds[0], blinds[1]);
    const avgStack = stacks.reduce((a, b) => a + b, 0) / stacks.length;
    return Math.round(avgStack / bigBlind);
  } catch (e) {
    return null;
  }
}

// Função para gerar assinatura única de um spot (para detectar duplicatas)
function getSpotSignature(settingsPath, equityPath, nodesDir) {
  try {
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    const { stacks, blinds, bounties } = settings.handdata;
    
    // Ler equity.json para incluir na assinatura
    let equityData = null;
    try {
      equityData = JSON.parse(fs.readFileSync(equityPath, 'utf8'));
    } catch (e) {
      // Se não conseguir ler equity, continua sem ele
    }
    
    // Ler primeiro node (0.json) para comparação mais precisa
    let firstNodeData = null;
    try {
      const firstNodePath = path.join(nodesDir, '0.json');
      if (fs.existsSync(firstNodePath)) {
        firstNodeData = JSON.parse(fs.readFileSync(firstNodePath, 'utf8'));
      }
    } catch (e) {
      // Se não conseguir ler node, continua sem ele
    }
    
    // Criar assinatura baseada em dados críticos (valores exatos, não arredondados)
    const signature = JSON.stringify({
      stacks: [...stacks].sort((a, b) => a - b), // Cópia ordenada para normalizar
      blinds: blinds,
      bounties: bounties ? [...bounties].sort((a, b) => a - b) : [],
      numPlayers: stacks.length,
      // Incluir dados do primeiro node se disponível
      firstNodePlayer: firstNodeData ? firstNodeData.player : null,
      firstNodeStreet: firstNodeData ? firstNodeData.street : null,
      firstNodeActionsCount: firstNodeData ? firstNodeData.actions.length : null
    });
    
    return signature;
  } catch (e) {
    return null;
  }
}

// Função para obter todos os node IDs e validar se os arquivos existem
function getNodeIds(nodesDir) {
  try {
    const files = fs.readdirSync(nodesDir);
    const nodeIds = files
      .filter(f => f.endsWith('.json'))
      .map(f => parseInt(f.replace('.json', '')))
      .filter(id => !isNaN(id))
      .sort((a, b) => a - b);
    
    // Validar que todos os arquivos existem e são válidos
    const validNodeIds = nodeIds.filter(id => {
      const filePath = path.join(nodesDir, `${id}.json`);
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        JSON.parse(content); // Valida se é JSON válido
        return true;
      } catch (e) {
        console.log(`  ⚠️  Invalid node file: ${id}.json`);
        return false;
      }
    });
    
    return validNodeIds;
  } catch (e) {
    return [];
  }
}

// Configuração: Limitar nodes para evitar sobrecarga
const MAX_NODES_PER_SOLUTION = 999999999; // Limita a 50 nodes por solução

// Função principal
function generateSolutions() {
  const spotsDir = path.join(__dirname, 'spots');
  const solutions = [];
  const seenSignatures = new Map(); // Para rastrear duplicatas
  let totalSkippedNodes = 0;
  let duplicatesRemoved = 0;
  let duplicateFoldersDeleted = 0;

  console.log('\n📂 Scanning spots folder...\n');

  // 1. ESCANEAR PASTA SPOTS - Coletar todos os spots válidos
  const spotsInFolder = new Map(); // path -> spot data
  
  for (const phase of Object.keys(phaseMapping)) {
    const phaseDir = path.join(spotsDir, phase);
    
    if (!fs.existsSync(phaseDir)) continue;

    const subDirs = fs.readdirSync(phaseDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    // Iterar sobre cada subdiretório
    for (const subDir of subDirs) {
      const spotPath = path.join(phaseDir, subDir);
      const settingsPath = path.join(spotPath, 'settings.json');
      const equityPath = path.join(spotPath, 'equity.json');
      const nodesDir = path.join(spotPath, 'nodes');

      // Verificar se os arquivos necessários existem
      if (!fs.existsSync(settingsPath) || !fs.existsSync(equityPath) || !fs.existsSync(nodesDir)) {
        console.log(`⚠️  Skipping ${phase}/${subDir} - missing files`);
        continue;
      }

      const numPlayers = getNumPlayers(settingsPath);
      const avgStackBB = getAvgStackBB(settingsPath);
      const signature = getSpotSignature(settingsPath, equityPath, nodesDir);
      let nodeIds = getNodeIds(nodesDir);

      if (!numPlayers || !avgStackBB || !signature || nodeIds.length === 0) {
        console.log(`⚠️  Skipping ${phase}/${subDir} - invalid data`);
        continue;
      }

      const spotKey = `./spots/${phase}/${subDir}`;
      spotsInFolder.set(spotKey, {
        phase,
        subDir,
        spotPath,
        settingsPath,
        equityPath,
        nodesDir,
        numPlayers,
        avgStackBB,
        signature,
        nodeIds
      });
    }
  }

  console.log(`✓ Found ${spotsInFolder.size} valid spots in folder\n`);

  // 2. LER SOLUTIONS.JSON EXISTENTE (se existir)
  const solutionsJsonPath = path.join(__dirname, 'solutions.json');
  let existingSolutions = [];
  
  if (fs.existsSync(solutionsJsonPath)) {
    try {
      existingSolutions = JSON.parse(fs.readFileSync(solutionsJsonPath, 'utf8'));
      console.log(`📄 Found existing solutions.json with ${existingSolutions.length} solutions\n`);
    } catch (e) {
      console.log(`⚠️  Could not read existing solutions.json, creating new one\n`);
    }
  }

  // 3. VERIFICAR QUAIS SPOTS DO SITE NÃO ESTÃO NA PASTA (para remover)
  const spotsToRemove = [];
  for (const solution of existingSolutions) {
    if (!spotsInFolder.has(solution.path)) {
      spotsToRemove.push(solution.path);
    }
  }

  if (spotsToRemove.length > 0) {
    console.log(`\n🗑️  REMOVING ${spotsToRemove.length} spots from site (not found in folder):`);
    spotsToRemove.forEach(path => console.log(`   - ${path}`));
    console.log('');
  }

  // 4. PROCESSAR SPOTS DA PASTA - Detectar e remover duplicatas físicas
  console.log('🔍 Checking for duplicates...\n');
  
  for (const [spotKey, spotData] of spotsInFolder.entries()) {
    const { phase, subDir, spotPath, numPlayers, avgStackBB, signature, nodeIds } = spotData;

    // Verificar se já existe um spot com a mesma assinatura
    if (seenSignatures.has(signature)) {
      const existingSpot = seenSignatures.get(signature);
      console.log(`🔄 DUPLICATE FOUND: ${phase}/${subDir} (same as ${existingSpot})`);
      console.log(`   🗑️  Deleting duplicate folder: ${spotPath}`);
      
      // DELETAR PASTA DUPLICADA
      try {
        fs.rmSync(spotPath, { recursive: true, force: true });
        duplicateFoldersDeleted++;
        console.log(`   ✓ Deleted successfully\n`);
      } catch (e) {
        console.log(`   ❌ Error deleting: ${e.message}\n`);
      }
      
      duplicatesRemoved++;
      continue;
    }

    // Limitar nodes se necessário
    let finalNodeIds = [...nodeIds];
    if (nodeIds.length > MAX_NODES_PER_SOLUTION) {
      const skipped = nodeIds.length - MAX_NODES_PER_SOLUTION;
      totalSkippedNodes += skipped;
      finalNodeIds = nodeIds.slice(0, MAX_NODES_PER_SOLUTION);
      console.log(`  ⚠️  ${phase}/${subDir}: Limited to ${MAX_NODES_PER_SOLUTION} nodes (${skipped} skipped)`);
    }

    // Criar nome descritivo
    let fileName = `${phaseMapping[phase]} - ${numPlayers}p ${avgStackBB}bb`;
    if (subDir.startsWith('speed')) {
      fileName += ` (${subDir})`;
    } else {
      fileName += ` #${subDir}`;
    }

    // Registrar assinatura
    seenSignatures.set(signature, `${phase}/${subDir}`);

    solutions.push({
      path: spotKey,
      fileName: fileName,
      tournamentPhase: phaseMapping[phase],
      nodeIds: finalNodeIds
    });

    console.log(`✓ Added: ${fileName} (${finalNodeIds.length} nodes)`);
  }

  // Ordenar por fase e nome
  solutions.sort((a, b) => {
    const phaseOrder = Object.values(phaseMapping);
    const phaseA = phaseOrder.indexOf(a.tournamentPhase);
    const phaseB = phaseOrder.indexOf(b.tournamentPhase);
    
    if (phaseA !== phaseB) return phaseA - phaseB;
    return a.fileName.localeCompare(b.fileName);
  });

  // Criar pasta public se não existir
  const publicDir = path.join(__dirname, 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Salvar solutions.json (formato antigo - para compatibilidade)
  const outputPath = path.join(__dirname, 'solutions.json');
  const publicOutputPath = path.join(__dirname, 'public', 'solutions.json');
  fs.writeFileSync(outputPath, JSON.stringify(solutions, null, 2));
  fs.writeFileSync(publicOutputPath, JSON.stringify(solutions, null, 2));

  // Salvar solutions-metadata.json (formato usado pelo app)
  const metadataOutputPath = path.join(__dirname, 'solutions-metadata.json');
  const publicMetadataOutputPath = path.join(__dirname, 'public', 'solutions-metadata.json');
  fs.writeFileSync(metadataOutputPath, JSON.stringify(solutions, null, 2));
  fs.writeFileSync(publicMetadataOutputPath, JSON.stringify(solutions, null, 2));
  
  // RESUMO FINAL
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`✓ Generated solutions.json with ${solutions.length} solutions`);
  console.log(`✓ Generated solutions-metadata.json with ${solutions.length} solutions`);
  console.log(`✓ Copied to public/solutions.json`);
  console.log(`✓ Copied to public/solutions-metadata.json`);
  
  if (spotsToRemove.length > 0) {
    console.log(`\n🗑️  Removed from site: ${spotsToRemove.length} spots (not in folder)`);
  }
  
  if (duplicatesRemoved > 0) {
    console.log(`\n🔄 Duplicates detected: ${duplicatesRemoved}`);
    console.log(`🗑️  Duplicate folders deleted: ${duplicateFoldersDeleted}`);
  }
  
  if (totalSkippedNodes > 0) {
    console.log(`\n⚠️  Total nodes skipped (over limit): ${totalSkippedNodes}`);
    console.log(`   To include more nodes, increase MAX_NODES_PER_SOLUTION in generate_solutions.cjs`);
  }
  
  console.log('='.repeat(60) + '\n');
}

// Executar
generateSolutions();
