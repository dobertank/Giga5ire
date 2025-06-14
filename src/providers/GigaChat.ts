import { IServiceProvider } from './types';

const chatModels = [
  {
    id: 'GigaChat-2',
    name: 'GigaChat-2',
    contextWindow: 128000,
    maxTokens: 65536,
    inputPrice: 0.0,
    outputPrice: 0.0,
    capabilities: {
      tools: {
        enabled: true,
      },
      vision: {
        enabled: true,
        allowBase64: true,
        allowUrl: true,
      },
    },
    description: 'Быстрая и легкая модель для простых повседневных задач',
  },
  {
    id: 'GigaChat-2-Pro',
    name: 'GigaChat-2-Pro',
    contextWindow: 128000,
    maxTokens: 65536,
    inputPrice: 0.0,
    outputPrice: 0.0,
    capabilities: {
      tools: {
        enabled: true,
      },
      vision: {
        enabled: true,
        allowBase64: true,
        allowUrl: true,
      },
    },
    description: 'Усовершенствованная модель для ресурсоемких задач',
  },
  {
    id: 'GigaChat-2-Max',
    name: 'GigaChat-2-Max',
    contextWindow: 128000,
    maxTokens: 65536,
    inputPrice: 0.0,
    outputPrice: 0.0,
    capabilities: {
      tools: {
        enabled: true,
      },
      vision: {
        enabled: true,
        allowBase64: true,
        allowUrl: true,
      },
    },
    description: 'Мощная модель для самых сложных и масштабных задач',
  },
  {
    id: 'GigaChat',
    name: 'GigaChat',
    contextWindow: 32768,
    maxTokens: 16384,
    inputPrice: 0.0,
    outputPrice: 0.0,
    capabilities: {
      tools: {
        enabled: true,
      },
      vision: {
        enabled: true,
        allowBase64: true,
        allowUrl: true,
      },
    },
    description: 'GigaChat - российская языковая модель от Сбербанка',
  },
  {
    id: 'GigaChat-Pro',
    name: 'GigaChat-Pro',
    contextWindow: 32768,
    maxTokens: 16384,
    inputPrice: 0.0,
    outputPrice: 0.0,
    capabilities: {
      tools: {
        enabled: true,
      },
      vision: {
        enabled: true,
        allowBase64: true,
        allowUrl: true,
      },
    },
    description: 'GigaChat Pro - улучшенная версия российской языковой модели',
  },
  {
    id: 'GigaChat-Max',
    name: 'GigaChat-Max',
    contextWindow: 32768,
    maxTokens: 16384,
    inputPrice: 0.0,
    outputPrice: 0.0,
    capabilities: {
      tools: {
        enabled: true,
      },
      vision: {
        enabled: true,
        allowBase64: true,
        allowUrl: true,
      },
    },
    description: 'Продвинутая модель для сложных задач, требующих высокого уровня креативности и качества работы',
  },
];

const GigaChat: IServiceProvider = {
  name: 'GigaChat',
  description: 'Российская языковая модель от Сбербанка',
  apiBase: 'https://gigachat.devices.sberbank.ru/api/v1',
  authBase: 'https://ngw.devices.sberbank.ru:9443/oauth',
  currency: 'RUB',
  scope: 'GIGACHAT_API_PERS',
  options: {
    apiBaseCustomizable: false,
    apiKeyCustomizable: false,
  },
  chat: {
    apiSchema: ['clientId', 'clientSecret', 'rqUID'],
    temperature: {
      min: 0,
      max: 2,
      default: 0.7,
    },
    topP: {
      min: 0,
      max: 1,
      default: 1,
    },
    presencePenalty: {
      min: -2,
      max: 2,
      default: 0,
    },
    models: chatModels,
    options: {
      modelCustomizable: false,
      streamCustomizable: true,
    },
    docs: {
      clientId: 'Идентификатор клиента для API GigaChat',
      clientSecret: 'Секретный ключ клиента для API GigaChat',
      rqUID: 'Уникальный идентификатор запроса',
    },
    placeholders: {
      clientId: 'Введите Client ID',
      clientSecret: 'Введите Client Secret',
      rqUID: 'Введите RqUID',
    },
  },
};

export default GigaChat;