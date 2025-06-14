import Debug from 'debug';
import { IChatResponseMessage } from 'intellichat/types';
import OpenAIReader from './OpenAIReader';
import IChatReader, { ITool } from './IChatReader';

const debug = Debug('5ire:intellichat:GigaChatReader');

export default class GigaChatReader extends OpenAIReader implements IChatReader {
  protected parseReply(chunk: string): IChatResponseMessage {
    const data = JSON.parse(chunk);
    if (data.error) {
      throw new Error(data.error.message || data.error);
    }
    if (data.choices.length === 0) {
      return {
        content: '',
        reasoning: '',
        isEnd: false,
        toolCalls: [],
      };
    }
    
    const choice = data.choices[0];
    const delta = choice.delta;
    
    // Преобразуем function_call в tool_calls для совместимости
    let toolCalls = delta.tool_calls;
    
    if (delta.function_call) {
      // Генерируем уникальный ID для tool call
      const toolCallId = `gigachat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      toolCalls = [{
        id: toolCallId,
        type: 'function',
        index: 0,
        function: {
          name: delta.function_call.name,
          arguments: typeof delta.function_call.arguments === 'string' 
            ? delta.function_call.arguments 
            : JSON.stringify(delta.function_call.arguments || {})
        }
      }];
      
      debug('Converted function_call to tool_calls:', {
        original: delta.function_call,
        converted: toolCalls
      });
    }
    
    const result: IChatResponseMessage = {
      content: delta.content || '',
      reasoning: delta.reasoning_content || '',
      isEnd: choice.finish_reason === 'stop' || choice.finish_reason === 'function_call',
      toolCalls: toolCalls,
    };

    // КРИТИЧНО: Сохраняем functions_state_id для корректной работы с GigaChat API
    if (delta.functions_state_id) {
      (result as any).functions_state_id = delta.functions_state_id;
    }

    return result;
  }

  protected parseTools(respMsg: IChatResponseMessage): ITool | null {
    if (respMsg.toolCalls && respMsg.toolCalls.length > 0) {
      return {
        id: respMsg.toolCalls[0].id,
        name: respMsg.toolCalls[0].function.name,
      };
    }
    return null;
  }

  protected parseToolArgs(respMsg: IChatResponseMessage): {
    index: number;
    args: string;
  } | null {
    try {
      if (respMsg.isEnd || !respMsg.toolCalls) {
        return null;
      }
      const toolCalls = respMsg.toolCalls[0];
      return {
        index: toolCalls.index || 0,
        args: toolCalls.function?.arguments || '',
      };
    } catch (err) {
      console.error('parseToolArgs', err);
    }
    return null;
  }
} 