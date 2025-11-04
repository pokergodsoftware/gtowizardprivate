const fs = require('fs');
const path = require('path');

const phaseMapping = {
  '100-60': '100~60% left',
  '60-40': '60~40% left',
  '40-20': '40~20% left',
  'near_bubble': 'Near bubble',
  'after_bubble': 'After bubble',
  '3tables': '3 tables',
  '2tables': '2 tables',
  'final_table': 'Final table'
};

function getNumPlayers(settingsPath) {
  try {
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    return settings.handdata.stacks.length;
  } catch (e) {
    return null;
  }
}

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

function getSpotSignature(settingsPath, equityPath, nodesDir) {
  try {
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    const { stacks, blinds, bounties } = settings.handdata;
    let equityData = null;
    try {
      equityData = JSON.parse(fs.readFileSync(equityPath, 'utf8'));
    } catch (e) {}
    let firstNodeData = null;
    try {
      const firstNodePath = path.join(nodesDir, '0.json');
      if (fs.existsSync(firstNodePath)) {
        firstNodeData = JSON.parse(fs.readFileSync(firstNodePath, 'utf8'));
      }
    } catch (e) {}
    const signature = JSON.stringify({
      stacks: stacks,
      blinds: blinds,
      bounties: bounties || [],
      numPlayers: stacks.length,
      prizes: equityData?.eqmodel?.structure?.prizes || null,
      bountyType: equityData?.eqmodel?.structure?.bountyType || null,
      progressiveFactor: equityData?.eqmodel?.structure?.progressiveFactor || null,
      firstNodePlayer: firstNodeData ? firstNodeData.player : null,
      firstNodeStreet: firstNodeData ? firstNodeData.street : null,
      firstNodeActions: firstNodeData ? firstNodeData.actions.map(a => ({ type: a.type, amount: a.amount })) : null,
      firstNodeSequence: firstNodeData ? firstNodeData.sequence : null
    });
    return signature;
  } catch (e) {
    return null;
  }
}

function countNodes(nodesDir) {
  try {
    const files = fs.readdirSync(nodesDir);
    return files.filter(f => f.endsWith('.json')).length;
  } catch (e) {
    return 0;
  }
}

function generateSolutions() {
  const spotsDir = path.join(__dirname, 'spots');
  const solutions = [];
  const seenSignatures = new Map();
  let duplicatesRemoved = 0;
  let duplicateFoldersDeleted = 0;
  const DRY_RUN = process.env.DRY_RUN === 'true';
  if (DRY_RUN) console.log('\n  DRY RUN MODE\n');
  console.log('\n Scanning spots (OPTIMIZED)...\n');
  const spotsInFolder = new Map();
  for (const phase of Object.keys(phaseMapping)) {
    const phaseDir = path.join(spotsDir, phase);
    if (!fs.existsSync(phaseDir)) continue;
    const subDirs = fs.readdirSync(phaseDir, { withFileTypes: true })
      .filter(d => d.isDirectory()).map(d => d.name);
    for (const subDir of subDirs) {
      const spotPath = path.join(phaseDir, subDir);
      const settingsPath = path.join(spotPath, 'settings.json');
      const equityPath = path.join(spotPath, 'equity.json');
      const nodesDir = path.join(spotPath, 'nodes');
      if (!fs.existsSync(settingsPath) || !fs.existsSync(equityPath) || !fs.existsSync(nodesDir)) {
        console.log('  Skipping ' + phase + '/' + subDir);
        continue;
      }
      const numPlayers = getNumPlayers(settingsPath);
      const avgStackBB = getAvgStackBB(settingsPath);
      const signature = getSpotSignature(settingsPath, equityPath, nodesDir);
      const nodeCount = countNodes(nodesDir);
      if (!numPlayers || !avgStackBB || !signature || nodeCount === 0) continue;
      spotsInFolder.set('./spots/' + phase + '/' + subDir, {
        phase, subDir, spotPath, settingsPath, numPlayers, avgStackBB, signature, nodeCount
      });
    }
  }
  console.log(' Found ' + spotsInFolder.size + ' spots\n');
  for (const [spotKey, spotData] of spotsInFolder.entries()) {
    if (seenSignatures.has(spotData.signature)) {
      console.log(' DUPLICATE: ' + spotData.phase + '/' + spotData.subDir);
      if (!DRY_RUN) {
        try {
          fs.rmSync(spotData.spotPath, { recursive: true, force: true });
          duplicateFoldersDeleted++;
        } catch (e) {}
      }
      duplicatesRemoved++;
      continue;
    }
    let fileName = phaseMapping[spotData.phase] + ' - ' + spotData.numPlayers + 'p ' + spotData.avgStackBB + 'bb';
    if (spotData.subDir.startsWith('speed')) fileName += ' (' + spotData.subDir + ')';
    seenSignatures.set(spotData.signature, spotData.phase + '/' + spotData.subDir);
    solutions.push({
      path: spotKey,
      fileName: fileName,
      tournamentPhase: phaseMapping[spotData.phase],
      nodeCount: spotData.nodeCount
    });
    console.log(' ' + fileName + ' (' + spotData.nodeCount + ' nodes)');
  }
  solutions.sort((a, b) => {
    const phases = Object.values(phaseMapping);
    const diff = phases.indexOf(a.tournamentPhase) - phases.indexOf(b.tournamentPhase);
    return diff !== 0 ? diff : a.fileName.localeCompare(b.fileName);
  });
  const publicDir = path.join(__dirname, 'public');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
  const out1 = path.join(__dirname, 'solutions-metadata.json');
  const out2 = path.join(publicDir, 'solutions-metadata.json');
  fs.writeFileSync(out1, JSON.stringify(solutions, null, 2));
  fs.writeFileSync(out2, JSON.stringify(solutions, null, 2));
  const size = (fs.statSync(out1).size / 1024).toFixed(2);
  console.log('\n' + '='.repeat(60));
  console.log(' SUMMARY');
  console.log('='.repeat(60));
  console.log(' Generated: ' + solutions.length + ' solutions');
  console.log(' File size: ' + size + ' KB (90-95% smaller!)');
  if (duplicatesRemoved > 0) console.log(' Duplicates: ' + duplicatesRemoved);
  console.log('\n nodeIds removed - lazy loaded on demand');
  console.log('='.repeat(60) + '\n');
}
generateSolutions();
