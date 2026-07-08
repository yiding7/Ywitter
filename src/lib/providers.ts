// Multi-provider "bring your own key" config. Everything runs in the browser;
// keys are stored in localStorage and sent straight to the provider you pick.
// Most providers below expose an OpenAI-compatible /chat/completions endpoint;
// Anthropic uses its own Messages API (with the direct-browser-access header).

export type ProviderKind = "openai" | "anthropic";

export type Provider = {
  id: string;
  label: string;
  kind: ProviderKind;
  baseUrl: string;
  defaultModel: string;
  models: string[];
  keyHint: string;
};

export const PROVIDERS: Provider[] = [
  {
    id: "anthropic",
    label: "Anthropic (Claude)",
    kind: "anthropic",
    baseUrl: "https://api.anthropic.com/v1/messages",
    defaultModel: "claude-sonnet-5",
    models: ["claude-sonnet-5", "claude-opus-4-8", "claude-haiku-4-5-20251001"],
    keyHint: "sk-ant-...",
  },
  {
    id: "openai",
    label: "OpenAI",
    kind: "openai",
    baseUrl: "https://api.openai.com/v1/chat/completions",
    defaultModel: "gpt-4o-mini",
    models: ["gpt-4o-mini", "gpt-4o", "gpt-4.1", "gpt-4.1-mini"],
    keyHint: "sk-...",
  },
  {
    id: "gemini",
    label: "Google Gemini",
    kind: "openai",
    baseUrl:
      "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    defaultModel: "gemini-2.0-flash",
    models: ["gemini-2.0-flash", "gemini-1.5-pro", "gemini-1.5-flash"],
    keyHint: "AIza...",
  },
  {
    id: "deepseek",
    label: "DeepSeek",
    kind: "openai",
    baseUrl: "https://api.deepseek.com/chat/completions",
    defaultModel: "deepseek-chat",
    models: ["deepseek-chat", "deepseek-reasoner"],
    keyHint: "sk-...",
  },
  {
    id: "kimi",
    label: "Kimi (Moonshot)",
    kind: "openai",
    baseUrl: "https://api.moonshot.cn/v1/chat/completions",
    defaultModel: "moonshot-v1-8k",
    models: ["moonshot-v1-8k", "moonshot-v1-32k", "kimi-latest"],
    keyHint: "sk-...",
  },
  {
    id: "qwen",
    label: "Qwen (DashScope)",
    kind: "openai",
    baseUrl:
      "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
    defaultModel: "qwen-plus",
    models: ["qwen-plus", "qwen-turbo", "qwen-max"],
    keyHint: "sk-...",
  },
  {
    id: "minimax",
    label: "MiniMax",
    kind: "openai",
    baseUrl: "https://api.minimax.chat/v1/text/chatcompletion_v2",
    defaultModel: "abab6.5s-chat",
    models: ["abab6.5s-chat", "abab6.5g-chat"],
    keyHint: "eyJ...",
  },
  {
    id: "custom",
    label: "Custom (OpenAI-compatible)",
    kind: "openai",
    baseUrl: "",
    defaultModel: "",
    models: [],
    keyHint: "your key",
  },
];

export function getProvider(id: string): Provider {
  return PROVIDERS.find((p) => p.id === id) ?? PROVIDERS[0];
}
