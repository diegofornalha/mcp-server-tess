import express from "express";
import { z } from "zod";
import axios from "axios";
import fs from "fs";
import path from "path";
import FormData from "form-data";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";

// Carregar variáveis de ambiente
dotenv.config();

// Configuração base para requisições à API da TESS
const TESS_API_BASE_URL = "https://tess.pareto.io/api";
const TESS_API_KEY = process.env.TESS_API_KEY;

// Checar se a chave de API existe
if (!TESS_API_KEY) {
  console.error("TESS_API_KEY não definida. Configure a variável de ambiente.");
  process.exit(1);
}

// Configura o cliente HTTP com autenticação
const apiClient = axios.create({
  baseURL: TESS_API_BASE_URL,
  headers: {
    "Authorization": `Bearer ${TESS_API_KEY}`,
    "Content-Type": "application/json"
  }
});

// Inicializar app Express
const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Endpoint de saúde
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Endpoint de capacidades do servidor
app.get("/capabilities", (req, res) => {
  res.json({
    name: "TessAIConnector",
    version: "1.0.0",
    tools: [
      {
        name: "listar_agentes_tess",
        description: "Lista todos os agentes disponíveis na API TESS",
        parameters: {
          page: { type: "number", description: "Número da página (padrão: 1)", required: false },
          per_page: { type: "number", description: "Itens por página (padrão: 15, máx: 100)", required: false }
        }
      },
      {
        name: "obter_agente_tess",
        description: "Obtém detalhes de um agente específico",
        parameters: {
          agent_id: { type: "string", description: "ID do agente a ser consultado", required: true }
        }
      },
      {
        name: "executar_agente_tess",
        description: "Executa um agente com mensagens específicas",
        parameters: {
          agent_id: { type: "string", description: "ID do agente a ser executado", required: true },
          temperature: { type: "string", description: "Temperatura para geração (0-1)", required: false },
          model: { type: "string", description: "Modelo a ser usado", required: false },
          messages: { type: "array", description: "Mensagens para o agente (formato chat)", required: true },
          tools: { type: "string", description: "Ferramentas a serem habilitadas", required: false },
          file_ids: { type: "array", description: "IDs dos arquivos a serem anexados", required: false },
          waitExecution: { type: "boolean", description: "Esperar pela execução completa", required: false }
        }
      },
      {
        name: "listar_arquivos_agente_tess",
        description: "Lista todos os arquivos associados a um agente",
        parameters: {
          agent_id: { type: "string", description: "ID do agente", required: true },
          page: { type: "number", description: "Número da página (padrão: 1)", required: false },
          per_page: { type: "number", description: "Itens por página (padrão: 15, máx: 100)", required: false }
        }
      },
      {
        name: "vincular_arquivo_agente_tess",
        description: "Vincula um arquivo existente a um agente",
        parameters: {
          agent_id: { type: "string", description: "ID do agente", required: true },
          file_id: { type: "number", description: "ID do arquivo a ser vinculado", required: true }
        }
      },
      {
        name: "remover_arquivo_agente_tess",
        description: "Remove o vínculo de um arquivo com um agente",
        parameters: {
          agent_id: { type: "string", description: "ID do agente", required: true },
          file_id: { type: "number", description: "ID do arquivo a ser removido", required: true }
        }
      },
      {
        name: "listar_arquivos_tess",
        description: "Lista todos os arquivos disponíveis",
        parameters: {
          page: { type: "number", description: "Número da página (padrão: 1)", required: false },
          per_page: { type: "number", description: "Itens por página (padrão: 15, máx: 100)", required: false }
        }
      },
      {
        name: "obter_arquivo_tess",
        description: "Obtém detalhes de um arquivo específico",
        parameters: {
          file_id: { type: "number", description: "ID do arquivo a ser consultado", required: true }
        }
      },
      {
        name: "enviar_arquivo_tess",
        description: "Envia um novo arquivo para a plataforma TESS",
        parameters: {
          file_path: { type: "string", description: "Caminho local do arquivo a ser enviado", required: true },
          purpose: { type: "string", description: "Propósito do arquivo (ex: 'assistants')", required: false }
        }
      },
      {
        name: "excluir_arquivo_tess",
        description: "Exclui um arquivo da plataforma TESS",
        parameters: {
          file_id: { type: "number", description: "ID do arquivo a ser excluído", required: true }
        }
      }
    ]
  });
});

// Endpoint para execução de ferramentas
app.post("/tools/:toolName", async (req, res) => {
  const { toolName } = req.params;
  const params = req.body;

  try {
    let result;
    
    switch (toolName) {
      case "listar_agentes_tess":
        result = await listarAgentes(params);
        break;
      case "obter_agente_tess":
        result = await obterAgente(params);
        break;
      case "executar_agente_tess":
        result = await executarAgente(params);
        break;
      case "listar_arquivos_agente_tess":
        result = await listarArquivosAgente(params);
        break;
      case "vincular_arquivo_agente_tess":
        result = await vincularArquivoAgente(params);
        break;
      case "remover_arquivo_agente_tess":
        result = await removerArquivoAgente(params);
        break;
      case "listar_arquivos_tess":
        result = await listarArquivos(params);
        break;
      case "obter_arquivo_tess":
        result = await obterArquivo(params);
        break;
      case "enviar_arquivo_tess":
        result = await enviarArquivo(params);
        break;
      case "excluir_arquivo_tess":
        result = await excluirArquivo(params);
        break;
      default:
        return res.status(404).json({ error: `Ferramenta "${toolName}" não encontrada` });
    }
    
    res.json(result);
  } catch (error) {
    console.error(`Erro ao executar ferramenta ${toolName}:`, error);
    res.status(500).json({ 
      error: `Falha ao executar ferramenta ${toolName}`, 
      details: error instanceof Error ? error.message : String(error) 
    });
  }
});

// Implementação das ferramentas
async function listarAgentes({ page = 1, per_page = 15 }: { page?: number; per_page?: number }) {
  try {
    const response = await apiClient.get("/agents", {
      params: { page, per_page }
    });
    
    return {
      content: [{ 
        type: "text", 
        text: JSON.stringify(response.data) 
      }],
    };
  } catch (error) {
    console.error("Erro ao listar agentes:", error);
    throw new Error(`Falha ao listar agentes: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function obterAgente({ agent_id }: { agent_id: string }) {
  try {
    const response = await apiClient.get(`/agents/${agent_id}`);
    
    return {
      content: [{ 
        type: "text", 
        text: JSON.stringify(response.data) 
      }],
    };
  } catch (error) {
    console.error(`Erro ao obter agente ${agent_id}:`, error);
    throw new Error(`Falha ao obter agente ${agent_id}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function executarAgente({ 
  agent_id, 
  temperature = "0.5", 
  model = "tess-ai-light", 
  messages, 
  tools = "no-tools", 
  file_ids = [], 
  waitExecution = false 
}: { 
  agent_id: string; 
  temperature?: string; 
  model?: string; 
  messages: Array<{role: string; content: string}>; 
  tools?: string; 
  file_ids?: number[]; 
  waitExecution?: boolean 
}) {
  try {
    const payload = {
      temperature,
      model,
      messages,
      tools,
      waitExecution,
      file_ids
    };
    
    const response = await apiClient.post(`/agents/${agent_id}/execute`, payload);
    
    return {
      content: [{ 
        type: "text", 
        text: JSON.stringify(response.data) 
      }],
    };
  } catch (error) {
    console.error(`Erro ao executar agente ${agent_id}:`, error);
    throw new Error(`Falha ao executar agente ${agent_id}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function listarArquivosAgente({ agent_id, page = 1, per_page = 15 }: { agent_id: string; page?: number; per_page?: number }) {
  try {
    const response = await apiClient.get(`/agents/${agent_id}/files`, {
      params: { page, per_page }
    });
    
    return {
      content: [{ 
        type: "text", 
        text: JSON.stringify(response.data) 
      }],
    };
  } catch (error) {
    console.error(`Erro ao listar arquivos do agente ${agent_id}:`, error);
    throw new Error(`Falha ao listar arquivos do agente ${agent_id}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function vincularArquivoAgente({ agent_id, file_id }: { agent_id: string; file_id: number }) {
  try {
    const response = await apiClient.post(`/agents/${agent_id}/files`, {
      file_id
    });
    
    return {
      content: [{ 
        type: "text", 
        text: JSON.stringify(response.data) 
      }],
    };
  } catch (error) {
    console.error(`Erro ao vincular arquivo ${file_id} ao agente ${agent_id}:`, error);
    throw new Error(`Falha ao vincular arquivo ${file_id} ao agente ${agent_id}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function removerArquivoAgente({ agent_id, file_id }: { agent_id: string; file_id: number }) {
  try {
    const response = await apiClient.delete(`/agents/${agent_id}/files/${file_id}`);
    
    return {
      content: [{ 
        type: "text", 
        text: JSON.stringify(response.data) 
      }],
    };
  } catch (error) {
    console.error(`Erro ao remover arquivo ${file_id} do agente ${agent_id}:`, error);
    throw new Error(`Falha ao remover arquivo ${file_id} do agente ${agent_id}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function listarArquivos({ page = 1, per_page = 15 }: { page?: number; per_page?: number }) {
  try {
    const response = await apiClient.get("/files", {
      params: { page, per_page }
    });
    
    return {
      content: [{ 
        type: "text", 
        text: JSON.stringify(response.data) 
      }],
    };
  } catch (error) {
    console.error("Erro ao listar arquivos:", error);
    throw new Error(`Falha ao listar arquivos: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function obterArquivo({ file_id }: { file_id: number }) {
  try {
    const response = await apiClient.get(`/files/${file_id}`);
    
    return {
      content: [{ 
        type: "text", 
        text: JSON.stringify(response.data) 
      }],
    };
  } catch (error) {
    console.error(`Erro ao obter arquivo ${file_id}:`, error);
    throw new Error(`Falha ao obter arquivo ${file_id}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function enviarArquivo({ file_path, purpose = "assistants" }: { file_path: string; purpose?: string }) {
  try {
    if (!fs.existsSync(file_path)) {
      throw new Error(`Arquivo não encontrado: ${file_path}`);
    }
    
    const fileName = path.basename(file_path);
    const fileContent = fs.readFileSync(file_path);
    
    const formData = new FormData();
    formData.append("file", fileContent, fileName);
    formData.append("purpose", purpose);
    
    const response = await apiClient.post("/files", formData, {
      headers: {
        ...formData.getHeaders(),
      }
    });
    
    return {
      content: [{ 
        type: "text", 
        text: JSON.stringify(response.data) 
      }],
    };
  } catch (error) {
    console.error(`Erro ao enviar arquivo ${file_path}:`, error);
    throw new Error(`Falha ao enviar arquivo ${file_path}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function excluirArquivo({ file_id }: { file_id: number }) {
  try {
    const response = await apiClient.delete(`/files/${file_id}`);
    
    return {
      content: [{ 
        type: "text", 
        text: JSON.stringify(response.data) 
      }],
    };
  } catch (error) {
    console.error(`Erro ao excluir arquivo ${file_id}:`, error);
    throw new Error(`Falha ao excluir arquivo ${file_id}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Iniciar o servidor
app.listen(port, () => {
  console.log(`Servidor MCP-TESS rodando em http://localhost:${port}`);
});
