# MCP-Server-TESS

Servidor MCP (Model Context Protocol) para integração com a API TESS.

## Sobre

Este projeto implementa um servidor que segue o protocolo MCP para interagir com a API TESS. O servidor expõe ferramentas que permitem:

- Listar e gerenciar agentes
- Executar agentes com mensagens personalizadas
- Gerenciar arquivos e suas associações com agentes
- E muito mais

## Requisitos

- Node.js 18+
- Uma chave de API da plataforma TESS

## Instalação

### Via Smithery.ai (Recomendado)

Você pode usar este servidor diretamente no Smithery.ai:

1. Acesse [https://smithery.ai/server/@diegofornalha/mcp-server-tess](https://smithery.ai/server/@diegofornalha/mcp-server-tess)
2. Clique em "Instalar"
3. Configure sua chave de API TESS quando solicitado
4. Pronto! O servidor está disponível para uso com seu LLM favorito

### Instalação Local

Clone o repositório e instale as dependências:

```bash
git clone https://github.com/seu-usuario/mcp-server-tess.git
cd mcp-server-tess
npm install
```

## Configuração

1. Crie um arquivo `.env` baseado no `.env.example`
2. Adicione sua chave de API da TESS:

```
TESS_API_KEY=sua_chave_api_aqui
PORT=3000
```

## Compilação

```bash
npm run build
```

## Execução

Para iniciar o servidor em modo de produção:

```bash
npm start
```

Para desenvolvimento com recarga automática:

```bash
npm run dev
```

## Ferramentas disponíveis

O servidor expõe as seguintes ferramentas via API HTTP:

1. `listar_agentes_tess` - Lista todos os agentes disponíveis
2. `obter_agente_tess` - Obtém detalhes de um agente específico
3. `executar_agente_tess` - Executa um agente com mensagens personalizadas
4. `listar_arquivos_agente_tess` - Lista arquivos associados a um agente
5. `vincular_arquivo_agente_tess` - Vincula um arquivo a um agente
6. `remover_arquivo_agente_tess` - Remove o vínculo de um arquivo com um agente
7. `listar_arquivos_tess` - Lista todos os arquivos disponíveis
8. `obter_arquivo_tess` - Obtém detalhes de um arquivo específico
9. `enviar_arquivo_tess` - Envia um novo arquivo para a plataforma TESS
10. `excluir_arquivo_tess` - Exclui um arquivo da plataforma TESS

## Uso com Docker

Para executar o servidor usando Docker:

```bash
# Construir a imagem
docker build -t mcp-server-tess .

# Executar o container
docker run -p 3000:3000 -e TESS_API_KEY=sua_chave_api_aqui mcp-server-tess
```

## Endpoints da API

- `GET /health` - Endpoint de verificação da saúde do servidor
- `GET /capabilities` - Lista todas as ferramentas disponíveis com suas descrições e parâmetros
- `POST /tools/:toolName` - Executa uma ferramenta específica (substitua `:toolName` pelo nome da ferramenta)

## Exemplo de uso

### Com Smithery.ai

Após a instalação no Smithery.ai, você pode usar o servidor com qualquer LLM compatível com MCP:

1. Selecione o servidor `@diegofornalha/mcp-server-tess` nas configurações do seu LLM
2. As ferramentas da API TESS ficarão disponíveis automaticamente para seu modelo

### Via API HTTP

Para executar um agente:

```bash
curl -X POST http://localhost:3000/tools/executar_agente_tess \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "seu_agent_id",
    "model": "tess-ai-light",
    "messages": [
      {"role": "user", "content": "Olá, como você está?"}
    ]
  }'
```

## Licença

MIT 