/**
 * Cadena de 10 proveedores de IA con capa gratuita diaria. El orquestador
 * (./orchestrator.ts) los intenta en este orden y salta al siguiente si al
 * proveedor le falta la API key, agotó su cuota (429) o falla.
 *
 * Todas las keys son opcionales: un proveedor sin variable de entorno
 * configurada simplemente se salta en la cadena.
 */

export type ProviderKind = "openai-compatible" | "gemini" | "cohere";

export interface AIProviderConfig {
  id: string;
  label: string;
  kind: ProviderKind;
  envKey: string;
  baseUrl: string;
  model: string;
  /** Puede recibir imágenes (visión) además de texto. */
  supportsImage: boolean;
}

export const AI_PROVIDERS: AIProviderConfig[] = [
  {
    id: "groq",
    label: "Groq",
    kind: "openai-compatible",
    envKey: "GROQ_API_KEY",
    baseUrl: "https://api.groq.com/openai/v1/chat/completions",
    model: "llama-3.2-11b-vision-preview",
    supportsImage: true,
  },
  {
    id: "gemini",
    label: "Google Gemini",
    kind: "gemini",
    envKey: "GEMINI_API_KEY",
    baseUrl:
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
    model: "gemini-1.5-flash",
    supportsImage: true,
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    kind: "openai-compatible",
    envKey: "OPENROUTER_API_KEY",
    baseUrl: "https://openrouter.ai/api/v1/chat/completions",
    model: "meta-llama/llama-3.2-11b-vision-instruct:free",
    supportsImage: true,
  },
  {
    id: "huggingface",
    label: "Hugging Face",
    kind: "openai-compatible",
    envKey: "HUGGINGFACE_API_KEY",
    baseUrl: "https://router.huggingface.co/v1/chat/completions",
    model: "Qwen/Qwen2.5-VL-7B-Instruct",
    supportsImage: true,
  },
  {
    id: "mistral",
    label: "Mistral",
    kind: "openai-compatible",
    envKey: "MISTRAL_API_KEY",
    baseUrl: "https://api.mistral.ai/v1/chat/completions",
    model: "mistral-small-latest",
    supportsImage: false,
  },
  {
    id: "cerebras",
    label: "Cerebras",
    kind: "openai-compatible",
    envKey: "CEREBRAS_API_KEY",
    baseUrl: "https://api.cerebras.ai/v1/chat/completions",
    model: "llama3.1-8b",
    supportsImage: false,
  },
  {
    id: "together",
    label: "Together AI",
    kind: "openai-compatible",
    envKey: "TOGETHER_API_KEY",
    baseUrl: "https://api.together.xyz/v1/chat/completions",
    model: "meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo",
    supportsImage: true,
  },
  {
    id: "deepseek",
    label: "DeepSeek",
    kind: "openai-compatible",
    envKey: "DEEPSEEK_API_KEY",
    baseUrl: "https://api.deepseek.com/chat/completions",
    model: "deepseek-chat",
    supportsImage: false,
  },
  {
    id: "github-models",
    label: "GitHub Models",
    kind: "openai-compatible",
    envKey: "GITHUB_MODELS_TOKEN",
    baseUrl: "https://models.inference.ai.azure.com/chat/completions",
    model: "gpt-4o-mini",
    supportsImage: true,
  },
  {
    id: "cohere",
    label: "Cohere",
    kind: "cohere",
    envKey: "COHERE_API_KEY",
    baseUrl: "https://api.cohere.com/v2/chat",
    model: "command-r-08-2024",
    supportsImage: false,
  },
];
