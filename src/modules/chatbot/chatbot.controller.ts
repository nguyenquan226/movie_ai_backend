import { Body, Controller, Post } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { Public, SkipCheckPermission } from 'src/decorators/customize';
import { ResponseMessage } from 'src/decorators/customize';

@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) { }

  @Post('/chat')
  @Public()
  @SkipCheckPermission()
  @ResponseMessage('Chat with chatbot')
  async handleChat(@Body('question') question: string) {
    return await this.chatbotService.handleChat(question);
  }
}
