# 🔥 Configuração do Firebase - Passo a Passo

## 1. Criar Projeto no Firebase

1. Acesse: https://console.firebase.google.com/
2. Clique em "Adicionar projeto"
3. Nome do projeto: `gto-wizard-private` (ou outro nome)
4. Desabilite Google Analytics (opcional)
5. Clique em "Criar projeto"

## 2. Adicionar App Web

1. No painel do projeto, clique no ícone **Web** (`</>`)
2. Nome do app: `GTO Wizard Private`
3. **NÃO** marque "Firebase Hosting"
4. Clique em "Registrar app"

## 3. Copiar Credenciais

Você verá um código assim:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123def456"
};
```

**COPIE ESSAS CREDENCIAIS!** Você vai precisar delas no próximo passo.

## 4. Configurar o Arquivo config.ts

1. Abra o arquivo: `src/firebase/config.ts`
2. Substitua os valores `YOUR_XXX` pelas suas credenciais:

```typescript
const firebaseConfig = {
  apiKey: "SUA_API_KEY_AQUI",
  authDomain: "SEU_PROJECT_ID.firebaseapp.com",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_PROJECT_ID.appspot.com",
  messagingSenderId: "SEU_MESSAGING_SENDER_ID",
  appId: "SEU_APP_ID"
};
```

## 5. Ativar Firestore Database

1. No menu lateral do Firebase Console, clique em **"Firestore Database"**
2. Clique em **"Criar banco de dados"**
3. Escolha **"Modo de produção"**
4. Escolha a localização:
   - **Recomendado:** `southamerica-east1` (São Paulo) - menor latência para Brasil
   - Alternativa: `us-central1` (Iowa)
5. Clique em **"Ativar"**

## 6. Configurar Regras de Segurança

1. Ainda no Firestore, clique na aba **"Regras"**
2. **SUBSTITUA** todo o conteúdo por:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Coleção de usuários - leitura pública, escrita apenas do próprio usuário
    match /users/{userId} {
      allow read: if true;
      allow write: if true; // Temporário - depois implementar auth
    }
    
    // Coleção de estatísticas - leitura pública, escrita apenas do próprio usuário
    match /stats/{userId} {
      allow read: if true;
      allow write: if true; // Temporário - depois implementar auth
    }
  }
}
```

3. Clique em **"Publicar"**

⚠️ **IMPORTANTE:** Essas regras permitem escrita para todos (temporário). Depois vamos implementar autenticação Firebase Auth para maior segurança.

## 7. Verificar Instalação

Execute no terminal:

```bash
npm list firebase
```

Deve mostrar algo como:
```
└── firebase@10.x.x
```

Se não estiver instalado, execute:
```bash
npm install firebase
```

## 8. Testar Conexão

1. Inicie o projeto: `npm run dev`
2. Cadastre um novo usuário
3. Jogue alguns spots no trainer
4. Vá ao Leaderboard
5. Verifique os logs do console:
   - Deve aparecer: `☁️ Loaded from Firebase: X players`
   - Se aparecer: `⚠️ Firebase unavailable` → verifique as credenciais

## 9. Verificar Dados no Firebase Console

1. Volte ao Firebase Console
2. Vá em **Firestore Database**
3. Você deve ver 2 coleções:
   - **users** → lista de usuários cadastrados
   - **stats** → estatísticas de cada usuário

## Estrutura dos Dados

### Coleção: `users`
```
users/
  └── user_1234567890_abc123/
      ├── userId: "user_1234567890_abc123"
      ├── username: "danton"
      └── createdAt: "2025-11-02T23:00:00.000Z"
```

### Coleção: `stats`
```
stats/
  └── user_1234567890_abc123/
      ├── userId: "user_1234567890_abc123"
      ├── username: "danton"
      ├── totalSpots: 82
      ├── correctSpots: 36
      ├── totalPoints: 36
      ├── accuracy: 43.9
      └── lastUpdated: "2025-11-02T23:30:00.000Z"
```

## Troubleshooting

### Erro: "Firebase not initialized"
- Verifique se as credenciais estão corretas em `src/firebase/config.ts`
- Certifique-se de que não há espaços extras ou aspas faltando

### Erro: "Permission denied"
- Verifique as regras de segurança no Firestore
- Certifique-se de que publicou as regras

### Erro: "Module not found: firebase"
- Execute: `npm install firebase`
- Reinicie o servidor de desenvolvimento

### Leaderboard vazio no Firebase
- Cadastre novos usuários APÓS configurar o Firebase
- Usuários antigos (do localStorage) não serão sincronizados automaticamente
- Jogue alguns spots para gerar estatísticas

## Próximos Passos

Após configurar o Firebase:

1. ✅ Leaderboard global funcionando
2. ✅ Dados sincronizados entre diferentes computadores
3. ✅ Top 10 jogadores visível para todos

Melhorias futuras:
- [ ] Implementar Firebase Authentication (login seguro)
- [ ] Adicionar regras de segurança mais restritivas
- [ ] Sincronizar histórico de spots
- [ ] Adicionar rankings por fase do torneio
- [ ] Implementar sistema de conquistas/badges

## Suporte

Se tiver problemas:
1. Verifique os logs do console (F12)
2. Verifique o Firebase Console → Firestore Database
3. Certifique-se de que as credenciais estão corretas
