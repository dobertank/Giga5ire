import { ProviderType, IServiceProvider } from './types';
import Azure from './Azure';
import Baidu from './Baidu';
import OpenAI from './OpenAI';
import Google from './Google';
import Moonshot from './Moonshot';
import Anthropic from './Anthropic';
import Fire from './Fire';
import Ollama from './Ollama';
import LMStudio from './LMStudio';
import Doubao from './Doubao';
import Grok from './Grok';
import DeepSeek from './DeepSeek';
import Mistral from './Mistral';
import GigaChat from './GigaChat';

export const providers: { [key: string]: IServiceProvider } = {
  OpenAI,
  Anthropic,
  Azure,
  Google,
  Grok,
  Baidu,
  Mistral,
  Moonshot,
  Ollama,
  Doubao,
  DeepSeek,
  LMStudio,
  GigaChat,
  '5ire': Fire,
};

// TODO: about to remove
export function getProvider(providerName: ProviderType): IServiceProvider {
  return providers[providerName];
}

export function getBuiltInProviders(): IServiceProvider[] {
  return Object.values(providers);
}

export function getChatAPISchema(providerName: string): string[] {
  const provider = providers[providerName];
  if (!provider) {
    return OpenAI.chat.apiSchema; // Fallback to OpenAI if provider not found
  }
  return provider.chat.apiSchema;
}
