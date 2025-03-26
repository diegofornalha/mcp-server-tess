FROM node:20-slim

WORKDIR /app

# Copiar arquivos de configuração
COPY package.json package-lock.json tsconfig.json ./

# Instalar dependências
RUN npm ci

# Copiar código-fonte
COPY src/ ./src/

# Compilar o TypeScript
RUN npm run build

# Copiar arquivo de ambiente (use .env.example como base)
COPY .env.example ./.env

# Expor porta para comunicação HTTP (opcional)
EXPOSE 3000

# Executar o servidor
CMD ["npm", "start"]
