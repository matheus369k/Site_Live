#!/bin/bash

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}=== Deploy Railway ====${NC}"

# Verificar se Railway CLI está instalado
if ! command -v railway &> /dev/null; then
    echo -e "${RED}Railway CLI não está instalado. Instalando...${NC}"
    npm install -g @railway/cli
fi

echo -e "${YELLOW}Por favor, siga os passos:${NC}"
echo -e "1. Visite: ${GREEN}https://railway.app/cli-login${NC}"
echo -e "2. Faça login com sua conta Railway"
echo -e "3. Cole o token gerado aqui:"
read -p "Token: " RAILWAY_TOKEN

# Configurar token
export RAILWAY_TOKEN="$RAILWAY_TOKEN"

# Verificar se o token está funcionando
if ! railway whoami; then
    echo -e "${RED}Token inválido ou erro de autenticação${NC}"
    exit 1
fi

echo -e "${GREEN}Login realizado com sucesso!${NC}"

# Preparar ambiente
echo -e "${GREEN}Instalando dependências...${NC}"
npm install --production

# Inicializar projeto
echo -e "${GREEN}Inicializando projeto...${NC}"
railway init

# Deploy
echo -e "${GREEN}Iniciando deploy...${NC}"
railway up --detach

echo -e "${GREEN}Deploy iniciado! Verifique o status no dashboard do Railway${NC}"
