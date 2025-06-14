import { IChatContext, IChatRequestPayload } from 'intellichat/types';
import GigaChatReader from 'intellichat/readers/GigaChatReader';
import GigaChat from '../../providers/GigaChat';
import OpenAIChatService from './OpenAIChatService';

export default class GigaChatService extends OpenAIChatService {
  private accessToken: string | null = null;

  constructor(context: IChatContext) {
    super(GigaChat.name, context);
  }

  private async authenticate(): Promise<void> {
    const provider = this.context.getProvider();
    const clientId = (provider as any).clientId || provider.apiKey;
    const clientSecret = (provider as any).clientSecret || provider.apiSecret || '';
    const rqUID = (provider as any).rqUID || this.generateRqUID();

    const url = (provider as any).authBase || 'https://ngw.devices.sberbank.ru:9443/oauth';
    const authHeader = `Basic ${btoa(`${clientId}:${clientSecret}`)}`;

    console.log('Authentication URL:', url);
    console.log('Authentication Header (Basic Base64):', authHeader);
    console.log('RqUID:', rqUID);

    const params = new URLSearchParams();
    params.append('scope', (provider as any).scope || 'GIGACHAT_API_PERS');

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'RqUID': rqUID,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: params.toString()
      });

      if (!response.ok) {
        throw new Error(`GigaChat authentication failed: ${response.statusText}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      console.log('GigaChat authentication successful');

    } catch (error) {
      console.error('Error during GigaChat authentication:', error);
      throw error;
    }
  }

  private generateRqUID(): string {
    // Используем встроенный crypto.randomUUID если доступен
    if (typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function') {
      return (crypto as any).randomUUID();
    }
    // Фолбек генерации UUID v4 для браузерного окружения
    const bytes = new Uint8Array(16);
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(bytes);
    } else {
      for (let i = 0; i < 16; i++) {
        bytes[i] = Math.floor(Math.random() * 256);
      }
    }
    // Устанавливаем версии и вариации согласно RFC4122
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const byteToHex: string[] = [];
    for (let i = 0; i < 256; ++i) {
      byteToHex.push((i + 0x100).toString(16).slice(1));
    }
    return (
      byteToHex[bytes[0]] + byteToHex[bytes[1]] + byteToHex[bytes[2]] + byteToHex[bytes[3]] + '-' +
      byteToHex[bytes[4]] + byteToHex[bytes[5]] + '-' +
      byteToHex[bytes[6]] + byteToHex[bytes[7]] + '-' +
      byteToHex[bytes[8]] + byteToHex[bytes[9]] + '-' +
      byteToHex[bytes[10]] + byteToHex[bytes[11]] + byteToHex[bytes[12]] + byteToHex[bytes[13]] + byteToHex[bytes[14]] + byteToHex[bytes[15]]
    );
  }

  protected async makeRequest(
    messages: any[],
    msgId?: string,
  ): Promise<Response> {
    if (!this.accessToken) {
      await this.authenticate();
    }

    const payload = await this.makePayload(messages, msgId);
    const provider = this.context.getProvider();
    const url = `${provider.apiBase}/chat/completions`;

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'RqUID': this.generateRqUID(),
    };

    // Добавляем X-Session-ID для кэширования контекста (улучшает производительность)
    const chatId = this.context.getActiveChat().id;
    if (chatId) {
      headers['X-Session-ID'] = chatId;
    }

    return fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: this.abortController.signal,
    });
  }

  protected getSystemRoleName(): 'system' | 'developer' {
    return 'system'; // GigaChat использует стандартную роль system
  }

  protected async makeMessages(
    messages: any[],
    msgId?: string,
  ): Promise<any[]> {
    const baseMessages = await super.makeMessages(messages, msgId);
    
    // Адаптируем сообщения для GigaChat API
    const filteredMessages = [];
    
    for (let i = 0; i < baseMessages.length; i++) {
      const msg = baseMessages[i];
      
      // Конвертируем tool роли в function для GigaChat
      if (msg.role === 'tool') {
        filteredMessages.push({
          role: 'function',
          content: this.extractTextContent(msg.content),
          name: msg.name,
        });
        continue;
      }
      
      // Убираем поля, которые не поддерживает GigaChat
      const { tool_call_id, tool_calls, parts, ...cleanMsg } = msg;
      
      // Извлекаем простой текст из content для GigaChat API
      if (cleanMsg.content !== undefined) {
        cleanMsg.content = this.extractTextContent(cleanMsg.content);
      }
      
      // ВАЖНО: Согласно документации GigaChat API, в messages должно быть 
      // сообщение assistant с functions_state_id для сохранения контекста
      if (msg.role === 'assistant' && (tool_calls && tool_calls.length > 0)) {
        // Это сообщение от assistant с function_call - преобразуем его правильно
        const assistantMsg: any = {
          role: 'assistant',
          content: cleanMsg.content || '', // GigaChat требует content как строку
        };
        
        // КРИТИЧНО: Добавляем functions_state_id если есть для сохранения контекста
        if (msg.functions_state_id) {
          assistantMsg.functions_state_id = msg.functions_state_id;
        }
        
        // Добавляем function_call в правильном формате для GigaChat
        if (tool_calls && tool_calls.length > 0) {
          const firstCall = tool_calls[0];
          if (firstCall && firstCall.function) {
            assistantMsg.function_call = {
              name: firstCall.function.name,
              arguments: firstCall.function.arguments 
                ? (typeof firstCall.function.arguments === 'string' 
                   ? JSON.parse(firstCall.function.arguments) 
                   : firstCall.function.arguments)
                : {}
            };
          }
        }
        
        filteredMessages.push(assistantMsg);
        continue;
      }
      
      filteredMessages.push(cleanMsg);
    }
    
    console.log('GigaChat filtered messages:', JSON.stringify(filteredMessages, null, 2));
    return filteredMessages;
  }

  // Извлекает простой текст из различных форматов content
  private extractTextContent(content: any): string {
    // Если уже строка - возвращаем как есть
    if (typeof content === 'string') {
      return content;
    }
    
    // Если массив объектов с type (OpenAI формат)
    if (Array.isArray(content)) {
      return content
        .map((item) => {
          if (typeof item === 'string') return item;
          if (item && typeof item === 'object') {
            if (item.type === 'text' && typeof item.text === 'string') {
              return item.text;
            }
            if (item.text) return item.text;
            if (item.content) return this.extractTextContent(item.content);
          }
          return String(item);
        })
        .join(' ');
    }
    
    // Если объект с type === 'text'
    if (content && typeof content === 'object') {
      if (content.type === 'text' && typeof content.text === 'string') {
        return content.text;
      }
      if (content.text) return content.text;
      if (content.content) return this.extractTextContent(content.content);
    }
    
    // Фолбек - преобразуем в строку
    return String(content || '');
  }

  protected async makePayload(
    messages: any[],
    msgId?: string,
  ): Promise<IChatRequestPayload> {
    const payload = await super.makePayload(messages, msgId);
    
    // Адаптируем payload для GigaChat API
    const gigaChatPayload: any = {
      ...payload,
      // Используем наши адаптированные сообщения
      messages: await this.makeMessages(messages, msgId),
    };

    // Конвертируем tools в functions для GigaChat
    if (payload.tools && Array.isArray(payload.tools)) {
      gigaChatPayload.functions = payload.tools.map((tool: any) => {
        if (tool.type === 'function' && tool.function) {
          return {
            name: tool.function.name,
            description: tool.function.description,
            parameters: tool.function.parameters,
          };
        }
        return tool;
      });
      delete gigaChatPayload.tools;
    }

    // Конвертируем tool_choice в function_call для GigaChat
    if (payload.tool_choice) {
      if (payload.tool_choice === 'auto') {
        gigaChatPayload.function_call = 'auto';
      } else if (payload.tool_choice === 'none') {
        gigaChatPayload.function_call = 'none';
      } else if (typeof payload.tool_choice === 'object' && payload.tool_choice.function) {
        gigaChatPayload.function_call = {
          name: payload.tool_choice.function.name,
        };
      }
      delete gigaChatPayload.tool_choice;
    }

    // Добавляем update_interval для streaming
    if (gigaChatPayload.stream) {
      gigaChatPayload.update_interval = 0;
    }

    // Убираем параметры, которые не поддерживает GigaChat
    delete gigaChatPayload.parallel_tool_calls;
    delete gigaChatPayload.tool_config;

    console.log('GigaChat API payload:', JSON.stringify(gigaChatPayload, null, 2));

    return gigaChatPayload;
  }

  protected getReaderType() {
    return GigaChatReader;
  }
} 