#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

# Verificar se o AWS CLI está instalado
if ! command -v aws &> /dev/null; then
    echo -e "${RED}AWS CLI não está instalado. Por favor, instale primeiro.${NC}"
    exit 1
fi

# Verificar se o Elastic Beanstalk CLI está instalado
if ! command -v eb &> /dev/null; then
    echo -e "${RED}Elastic Beanstalk CLI não está instalado. Por favor, instale primeiro.${NC}"
    exit 1
fi

# Verificar variáveis de ambiente necessárias
required_vars=(
    "AWS_ACCESS_KEY_ID"
    "AWS_SECRET_ACCESS_KEY"
    "AWS_REGION"
    "NODE_ENV"
)

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}Erro: $var não está definido${NC}"
        exit 1
    fi
done

echo -e "${GREEN}Iniciando deploy para AWS Elastic Beanstalk...${NC}"

# Instalar dependências
npm install --production

# Criar arquivo de deploy
zip -r deploy.zip . -x "*.git*" "node_modules/*" "tests/*" "*.env*"

# Deploy usando eb cli
eb deploy

# Limpar
rm deploy.zip

echo -e "${GREEN}Deploy concluído!${NC}"
