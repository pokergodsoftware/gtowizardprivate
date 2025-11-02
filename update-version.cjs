// Script para atualizar a versão automaticamente
const fs = require('fs');
const path = require('path');

// Ler package.json
const packagePath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Ler argumentos da linha de comando
const args = process.argv.slice(2);
const versionType = args[0] || 'patch'; // patch, minor, major

// Função para incrementar versão
function incrementVersion(version, type) {
    const parts = version.split('.').map(Number);
    
    switch (type) {
        case 'major':
            parts[0]++;
            parts[1] = 0;
            parts[2] = 0;
            break;
        case 'minor':
            parts[1]++;
            parts[2] = 0;
            break;
        case 'patch':
        default:
            parts[2]++;
            break;
    }
    
    return parts.join('.');
}

// Atualizar versão
const oldVersion = packageJson.version;
const newVersion = incrementVersion(oldVersion, versionType);
packageJson.version = newVersion;

// Salvar package.json
fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');

// Atualizar src/version.ts
const versionTsPath = path.join(__dirname, 'src', 'version.ts');
const versionTsContent = `// Versão do aplicativo - atualizada automaticamente
export const APP_VERSION = '${newVersion}';
export const BUILD_DATE = '${new Date().toISOString()}';
`;
fs.writeFileSync(versionTsPath, versionTsContent);

console.log(`✅ Versão atualizada: ${oldVersion} → ${newVersion}`);
console.log(`📝 Arquivos atualizados:`);
console.log(`   - package.json`);
console.log(`   - src/version.ts`);
