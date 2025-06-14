import { IChatService } from './IChatService';
import { ChatCompletionRequest, ChatCompletionResponse } from '../intellichat/types';

// Implement the GigaChat chat completion service
export class GigaChat implements IChatService {
  private accessToken: string | null = null;
  // Add a static property to define the API schema for GigaChat
  static chat = { apiSchema: ['clientId', 'clientSecret', 'rqUID'] };

  private clientId: string;
  private clientSecret: string;
  private rqUID: string;

  constructor(clientId: string, clientSecret: string, rqUID: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.rqUID = rqUID;
  }

  async authenticate(): Promise<void> {
    const url = 'https://ngw.devices.sberbank.ru:9443/api/v2/oauth';
    const authHeader = `Basic ${btoa(`${this.clientId}:${this.clientSecret}`)}`; // Assuming basic auth as per docs

    const params = new URLSearchParams();
    params.append('scope', 'GIGACHAT_API_PERS'); // Example scope, adjust if needed

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'RqUID': this.rqUID, // Use the provided RqUID
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.statusText}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      console.log('GigaChat authentication successful');

    } catch (error) {
      console.error('Error during GigaChat authentication:', error);
      throw error; // Re-throw the error for handling in the application
    }
  }

  // Add a method to upload files to the GigaChat API
  async uploadFile(file: File): Promise<string> {
    if (!this.accessToken) {
      await this.authenticate(); // Ensure authenticated before making requests
    }

    const uploadUrl = 'https://ngw.devices.sberbank.ru:9443/api/v1/files'; // Endpoint for file upload

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`, // Use Bearer Token
          // Content-Type is automatically set for FormData
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`GigaChat file upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      // Assuming the file ID is in the 'id' field of the response
      const fileId = data.id;
      console.log(`GigaChat file uploaded successfully with ID: ${fileId}`);
      return fileId;

    } catch (error) {
      console.error('Error during GigaChat file upload:', error);
      throw error; // Re-throw the error
    }
  }

  async generateCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    if (!this.accessToken) {
      await this.authenticate(); // Ensure authenticated before making requests
    }

    const completionUrl = 'https://ngw.devices.sberbank.ru:9443/api/v1/chat/completions'; // Endpoint for completions

    const gigaChatRequest: any = { // Using any for flexibility
      model: request.model,
      messages: request.messages.map(message => ({ // Transform messages
        role: message.role,
        content: message.content
      })),
      },
    };
  }

    // Handle attachments
    if (request.attachments && request.attachments.length > 0) {
      const uploadedFileIds: string[] = [];
      for (const attachment of request.attachments) {
        // Assuming attachment is of type File or Blob. Cast to File for uploadFile
        try {
          const fileId = await this.uploadFile(attachment as File);
          uploadedFileIds.push(fileId);
        } catch (error) {
          console.error('Failed to upload file:', attachment, error);
          // Handle file upload error (e.g., skip file, throw error)
          // Logging and continuing in this example
        }
      }
      if (uploadedFileIds.length > 0) {
        gigaChatRequest.attachments = uploadedFileIds; // Add file IDs to the request
      }
    }

    // Handle tools (functions)
    if (request.tools && request.tools.length > 0) {
        // Assuming the structure of request.tools is as expected by GigaChat API
        gigaChatRequest.tools = request.tools;
    }

    try {
      const response = await fetch(completionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`, // Use Bearer Token
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(gigaChatRequest)
      });

      if (!response.ok) {
        throw new Error(`GigaChat API error: ${response.statusText}`);
      }

      const data = await response.json();

      const gigaChatResponse: ChatCompletionResponse = {
        id: data.id,
        object: data.object, // Adapt if needed
        created: data.created,
        model: data.model,
        choices: data.choices.map((choice: any) => ({
          index: choice.index,
          message: {
            role: choice.message.role,
            content: choice.message.content
            // Add tool_calls if present in the response
            tool_calls: choice.message.tool_calls?.map((tool_call: any) => ({
               id: tool_call.id,
               type: tool_call.type,
               function: {
                 name: tool_call.function.name,
                 arguments: tool_call.function.arguments
               }
            }))
          },
          finish_reason: choice.finish_reason // Adapt if needed
        })),
        usage: { // Adapt structure if needed
          prompt_tokens: data.usage.prompt_tokens,
          completion_tokens: data.usage.completion_tokens,
          total_tokens: data.usage.total_tokens,
        },
      };

      return gigaChatResponse;

    } catch (error) {
      console.error('Error during GigaChat completion:', error);
      throw error; // Re-throw the error
    }
  }
}