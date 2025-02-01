# Guia de Implementação do Backend - Live Confidente

Este guia fornece instruções passo a passo para configurar e implementar o backend do Live Confidente.

## Índice
1. [Configuração Inicial](#configuração-inicial)
2. [Estrutura do Projeto](#estrutura-do-projeto)
3. [Banco de Dados](#banco-de-dados)
4. [Autenticação](#autenticação)
5. [APIs](#apis)
6. [WebSockets](#websockets)
7. [Streaming](#streaming)
8. [Deploy](#deploy)

## Configuração Inicial

### 1. Preparando o Ambiente

```bash
# Criar diretório do projeto
mkdir live-confidente-backend
cd live-confidente-backend

# Inicializar projeto Node.js
npm init -y

# Instalar dependências principais
npm install express mongoose dotenv jsonwebtoken bcryptjs cors socket.io

# Instalar dependências de desenvolvimento
npm install --save-dev nodemon typescript @types/node @types/express
```

### 2. Configurar TypeScript

```bash
# Inicializar TypeScript
npx tsc --init
```

Configurar `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "es2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

### 3. Configurar Variáveis de Ambiente

Criar arquivo `.env`:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/live-confidente
JWT_SECRET=seu_jwt_secret_aqui
JWT_EXPIRE=24h
STRIPE_SECRET_KEY=sua_stripe_key_aqui
AWS_ACCESS_KEY=sua_aws_key_aqui
AWS_SECRET_KEY=seu_aws_secret_aqui
AWS_REGION=sua_aws_region_aqui
AWS_BUCKET_NAME=seu_bucket_aqui
```

## Estrutura do Projeto

```bash
src/
├── config/
│   ├── database.ts
│   └── env.ts
├── models/
│   ├── User.ts
│   ├── Chat.ts
│   └── Live.ts
├── controllers/
│   ├── auth.controller.ts
│   ├── user.controller.ts
│   ├── chat.controller.ts
│   └── live.controller.ts
├── middleware/
│   ├── auth.middleware.ts
│   ├── error.middleware.ts
│   └── upload.middleware.ts
├── services/
│   ├── payment.service.ts
│   ├── socket.service.ts
│   └── stream.service.ts
├── routes/
│   ├── auth.routes.ts
│   ├── user.routes.ts
│   ├── chat.routes.ts
│   └── live.routes.ts
├── utils/
│   ├── jwt.utils.ts
│   └── validators.ts
└── app.ts
```

## Banco de Dados

### 1. Configuração do MongoDB

```typescript
// src/config/database.ts
import mongoose from 'mongoose';
import { config } from './env';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};
```

### 2. Modelos

```typescript
// src/models/User.ts
import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  password: string;
  type: 'model' | 'client';
  profile: {
    name: string;
    avatar?: string;
    bio?: string;
    location?: string;
    isModel?: boolean;
    services?: string[];
    pricing?: {
      [key: string]: number;
    };
    schedule?: any[];
  };
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    select: false,
  },
  type: {
    type: String,
    enum: ['model', 'client'],
    required: true,
  },
  profile: {
    name: { type: String, required: true },
    avatar: String,
    bio: String,
    location: String,
    isModel: Boolean,
    services: [String],
    pricing: {
      type: Map,
      of: Number,
    },
    schedule: [{
      day: String,
      start: String,
      end: String,
    }],
  },
}, {
  timestamps: true,
});

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser>('User', UserSchema);
```

## Autenticação

### 1. JWT Utils

```typescript
// src/utils/jwt.utils.ts
import jwt from 'jsonwebtoken';
import { config } from '../config/env';

export const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRE,
  });
};

export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, config.JWT_SECRET);
  } catch (error) {
    throw new Error('Token inválido');
  }
};
```

### 2. Middleware de Autenticação

```typescript
// src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.utils';
import { User } from '../models/User';

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Não autorizado' });
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Não autorizado' });
  }
};

export const restrictTo = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user.type)) {
      return res.status(403).json({ error: 'Não autorizado para esta ação' });
    }
    next();
  };
};
```

## APIs

### 1. Controlador de Autenticação

```typescript
// src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import { User } from '../models/User';
import { generateToken } from '../utils/jwt.utils';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, type, profile } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    const user = await User.create({
      email,
      password,
      type,
      profile,
    });

    const token = generateToken(user._id);

    res.status(201).json({
      user: {
        id: user._id,
        email: user.email,
        type: user.type,
        profile: user.profile,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    const token = generateToken(user._id);

    res.json({
      user: {
        id: user._id,
        email: user.email,
        type: user.type,
        profile: user.profile,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

## WebSockets

### 1. Configuração do Socket.IO

```typescript
// src/services/socket.service.ts
import { Server } from 'socket.io';
import { verifyToken } from '../utils/jwt.utils';

export const setupWebSockets = (server: any) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL,
      methods: ['GET', 'POST'],
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        throw new Error('Autenticação necessária');
      }

      const decoded = verifyToken(token);
      socket.data.userId = decoded.userId;
      next();
    } catch (error) {
      next(new Error('Autenticação falhou'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.data.userId}`);

    // Chat events
    socket.on('message:send', async (data) => {
      // Implementar lógica de mensagem
    });

    socket.on('typing:start', (data) => {
      socket.to(data.chatId).emit('user:typing', {
        chatId: data.chatId,
        userId: socket.data.userId,
      });
    });

    // Live events
    socket.on('live:join', async (data) => {
      // Implementar lógica de entrada na live
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.data.userId}`);
    });
  });

  return io;
};
```

## Streaming

### 1. Configuração do WebRTC

```typescript
// src/services/stream.service.ts
import { Server } from 'socket.io';

export const setupStreamingServer = (io: Server) => {
  const streamNamespace = io.of('/stream');

  streamNamespace.on('connection', (socket) => {
    const roomId = socket.handshake.query.roomId as string;
    
    socket.join(roomId);

    socket.on('broadcaster', () => {
      socket.to(roomId).broadcast.emit('broadcaster');
    });

    socket.on('watcher', () => {
      socket.to(roomId).broadcast.emit('watcher', socket.id);
    });

    socket.on('offer', (id, message) => {
      socket.to(id).emit('offer', socket.id, message);
    });

    socket.on('answer', (id, message) => {
      socket.to(id).emit('answer', socket.id, message);
    });

    socket.on('candidate', (id, message) => {
      socket.to(id).emit('candidate', socket.id, message);
    });

    socket.on('disconnect', () => {
      socket.to(roomId).broadcast.emit('disconnectPeer', socket.id);
    });
  });
};
```

## Deploy

### 1. Dockerfile

```dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
```

### 2. Docker Compose

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/live-confidente
    depends_on:
      - mongo
      - redis

  mongo:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"

volumes:
  mongodb_data:
```

### 3. Script de Inicialização

```typescript
// src/app.ts
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { connectDB } from './config/database';
import { setupWebSockets } from './services/socket.service';
import { setupStreamingServer } from './services/stream.service';
import routes from './routes';

const app = express();
const httpServer = createServer(app);

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', routes);

// WebSocket setup
const io = setupWebSockets(httpServer);
setupStreamingServer(io);

// Database connection
connectDB();

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## Testes

### 1. Configuração de Testes

```bash
npm install --save-dev jest @types/jest supertest
```

### 2. Exemplo de Teste

```typescript
// src/__tests__/auth.test.ts
import request from 'supertest';
import { app } from '../app';
import { User } from '../models/User';

describe('Auth Routes', () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          type: 'client',
          profile: {
            name: 'Test User',
          },
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe('test@example.com');
    });
  });
});
```

## Scripts NPM

Adicione ao `package.json`:

```json
{
  "scripts": {
    "start": "node dist/app.js",
    "dev": "nodemon src/app.ts",
    "build": "tsc",
    "test": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint src/**/*.ts",
    "format": "prettier --write \"src/**/*.ts\""
  }
}
```

## Próximos Passos

1. Implementar sistema de logs com Winston
2. Adicionar validação de dados com Joi
3. Implementar rate limiting
4. Configurar CI/CD com GitHub Actions
5. Adicionar documentação com Swagger
6. Implementar testes de integração

## Dicas de Desenvolvimento

1. Use TypeScript para melhor tipagem e autocomplete
2. Mantenha os controllers limpos, movendo lógica complexa para services
3. Implemente tratamento de erros global
4. Use variáveis de ambiente para configurações
5. Documente todas as APIs
6. Faça backup regular do banco de dados
7. Monitore performance com ferramentas como New Relic ou DataDog
