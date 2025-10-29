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

// Função principal
function generateSolutions() {
  const spotsDir = path.join(__dirname, 'spots');
  const solutionsMetadata = [];

  console.log('🔍 Scanning spots directory...\n');

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
        console.log(`⏭️  Skipping ${phase}/${subDir} - missing files`);
        continue;
      }

      const numPlayers = getNumPlayers(settingsPath);
      const avgStackBB = getAvgStackBB(settingsPath);
      const nodeIds = getNodeIds(nodesDir);

      if (!numPlayers || !avgStackBB || nodeIds.length === 0) {
        console.log(`⏭️  Skipping ${phase}/${subDir} - invalid data`);
        continue;
      }

      // Criar nome descritivo
      let fileName = `${phaseMapping[phase]} - ${numPlayers}p ${avgStackBB}bb`;
      if (subDir.startsWith('speed')) {
        fileName += ` (${subDir})`;
      } else {
        fileName += ` #${subDir}`;
      }

      // Adicionar apenas metadados (sem carregar nodes)
      solutionsMetadata.push({
        path: `./spots/${phase}/${subDir}`,
        fileName: fileName,
        tournamentPhase: phaseMapping[phase],
        nodeIds: nodeIds, // Lista de IDs disponíveis
        totalNodes: nodeIds.length
      });

      console.log(`✅ Added: ${fileName} (${nodeIds.length} nodes available)`);
    }
  }

  // Ordenar por fase e nome
  solutionsMetadata.sort((a, b) => {
    const phaseOrder = Object.values(phaseMapping);
    const phaseA = phaseOrder.indexOf(a.tournamentPhase);
    const phaseB = phaseOrder.indexOf(b.tournamentPhase);
    
    if (phaseA !== phaseB) return phaseA - phaseB;
    return a.fileName.localeCompare(b.fileName);
  });

  // Salvar arquivo de metadados na raiz e em public/
  const outputPath = path.join(__dirname, 'solutions-metadata.json');
  const publicOutputPath = path.join(__dirname, 'public', 'solutions-metadata.json');
  
  fs.writeFileSync(outputPath, JSON.stringify(solutionsMetadata, null, 2));
  
  // Criar pasta public se não existir
  const publicDir = path.join(__dirname, 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  
  fs.writeFileSync(publicOutputPath, JSON.stringify(solutionsMetadata, null, 2));
  
  const totalNodes = solutionsMetadata.reduce((sum, s) => sum + s.totalNodes, 0);
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ Generated solutions-metadata.json`);
  console.log(`📊 Total solutions: ${solutionsMetadata.length}`);
  console.log(`📦 Total nodes available: ${totalNodes.toLocaleString()}`);
  console.log(`💾 Saved to:`);
  console.log(`   - ${outputPath}`);
  console.log(`   - ${publicOutputPath}`);
  console.log(`${'='.repeat(60)}\n`);
  console.log(`🚀 Nodes will be loaded on-demand when user selects a solution!`);
}

// Executar
generateSolutions();
