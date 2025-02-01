#!/bin/bash

# Verificar NODE_ENV
if [ -z "$NODE_ENV" ]; then
  echo "ERROR: NODE_ENV não está definido"
  exit 1
fi

# Instalar dependências
echo "Instalando dependências..."
npm install --production

# Verificar variáveis de ambiente necessárias
required_vars=(
  "PORT"
  "MONGODB_URI"
  "JWT_SECRET"
  "AWS_ACCESS_KEY_ID"
  "AWS_SECRET_ACCESS_KEY"
  "AWS_BUCKET_NAME"
  "STRIPE_SECRET_KEY"
  "DAILY_API_KEY"
)

for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "ERROR: $var não está definido"
    exit 1
  fi
done

# Criar diretório de logs
mkdir -p logs

echo "Tudo pronto para deploy!"
