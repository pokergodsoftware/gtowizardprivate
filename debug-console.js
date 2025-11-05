// Cole este código no Console do DevTools (F12) no Vercel
// para ver quantos spots de 40-20 estão sendo carregados

// Verificar metadata carregado
fetch('/solutions-metadata.json')
  .then(r => r.json())
  .then(data => {
    const spots40_20 = data.filter(s => s.tournamentPhase === '40~20% left');
    console.log('=== Spots 40-20 no Metadata ===');
    console.log('Total:', spots40_20.length);
    console.table(spots40_20.map(s => ({
      spot: s.path.split('/').pop(),
      fileName: s.fileName,
      nodes: s.nodeCount
    })));
  });

// Verificar quantos estão renderizados na página
setTimeout(() => {
  const rows = document.querySelectorAll('tbody tr');
  console.log('=== Linhas Renderizadas ===');
  console.log('Total de linhas na tabela:', rows.length);
}, 2000);
