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
const MAX_NODES_PER_SOLUTION = 50; // Limita a 50 nodes por solução

// Função principal
function generateSolutions() {
  const spotsDir = path.join(__dirname, 'spots');
  const solutions = [];
  let totalSkippedNodes = 0;

  // Iterar sobre as fases
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
        console.log(`Skipping ${phase}/${subDir} - missing files`);
        continue;
      }

      const numPlayers = getNumPlayers(settingsPath);
      const avgStackBB = getAvgStackBB(settingsPath);
      let nodeIds = getNodeIds(nodesDir);

      if (!numPlayers || !avgStackBB || nodeIds.length === 0) {
        console.log(`Skipping ${phase}/${subDir} - invalid data`);
        continue;
      }

      // Limitar nodes se necessário
      if (nodeIds.length > MAX_NODES_PER_SOLUTION) {
        const skipped = nodeIds.length - MAX_NODES_PER_SOLUTION;
        totalSkippedNodes += skipped;
        nodeIds = nodeIds.slice(0, MAX_NODES_PER_SOLUTION);
        console.log(`  ⚠️  Limited to ${MAX_NODES_PER_SOLUTION} nodes (${skipped} skipped)`);
      }

      // Criar nome descritivo
      let fileName = `${phaseMapping[phase]} - ${numPlayers}p ${avgStackBB}bb`;
      if (subDir.startsWith('speed')) {
        fileName += ` (${subDir})`;
      } else {
        fileName += ` #${subDir}`;
      }

      solutions.push({
        path: `./spots/${phase}/${subDir}`,
        fileName: fileName,
        tournamentPhase: phaseMapping[phase],
        nodeIds: nodeIds
      });

      console.log(`Added: ${fileName} (${nodeIds.length} nodes)`);
    }
  }

  // Ordenar por fase e nome
  solutions.sort((a, b) => {
    const phaseOrder = Object.values(phaseMapping);
    const phaseA = phaseOrder.indexOf(a.tournamentPhase);
    const phaseB = phaseOrder.indexOf(b.tournamentPhase);
    
    if (phaseA !== phaseB) return phaseA - phaseB;
    return a.fileName.localeCompare(b.fileName);
  });

  // Salvar arquivo na raiz e em public/
  const outputPath = path.join(__dirname, 'solutions.json');
  const publicOutputPath = path.join(__dirname, 'public', 'solutions.json');
  
  fs.writeFileSync(outputPath, JSON.stringify(solutions, null, 2));
  
  // Criar pasta public se não existir
  const publicDir = path.join(__dirname, 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  
  fs.writeFileSync(publicOutputPath, JSON.stringify(solutions, null, 2));
  
  console.log(`\n✓ Generated solutions.json with ${solutions.length} solutions`);
  console.log(`✓ Copied to public/solutions.json`);
  
  if (totalSkippedNodes > 0) {
    console.log(`\n⚠️  Total nodes skipped (over limit): ${totalSkippedNodes}`);
    console.log(`   To include more nodes, increase MAX_NODES_PER_SOLUTION in generate_solutions.cjs`);
  }
}

// Executar
generateSolutions();
