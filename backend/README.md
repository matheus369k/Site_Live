# LiveConfidente Backend

Backend da plataforma LiveConfidente - Conectando modelos e clientes.

## Tecnologias

- Node.js
- Express.js
- MongoDB
- Socket.IO
- JWT Authentication

## Requisitos

- Node.js 18.x
- MongoDB

## Instalação

1. Clone o repositório:
```bash
git clone https://github.com/Kzinnn/backend-site-live.git
cd backend-site-live
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=sua_uri_do_mongodb
JWT_SECRET=seu_jwt_secret
JWT_EXPIRE=30d
JWT_COOKIE_EXPIRE=30
```

4. Inicie o servidor:
```bash
npm start
```

Para desenvolvimento:
```bash
npm run dev
```

## Estrutura do Projeto

```
src/
├── config/         # Configurações
├── controllers/    # Controladores
├── middleware/     # Middlewares
├── models/         # Modelos do MongoDB
├── routes/         # Rotas da API
├── services/       # Serviços
└── server.js       # Entrada da aplicação
```

## API Endpoints

- `/api/auth` - Autenticação
- `/api/users` - Gerenciamento de usuários
- `/api/models` - Gerenciamento de modelos
- `/api/chat` - Sistema de chat
- `/api/payments` - Sistema de pagamentos
- `/api/photos` - Gerenciamento de fotos
- `/api/videocall` - Sistema de videochamadas

## Deploy

O projeto está configurado para deploy automático via GitHub.
