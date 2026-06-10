import { Module } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { ChatbotController } from './chatbot.controller';
import { DatabasesModule } from 'src/databases/databases.module';

@Module({
  controllers: [ChatbotController],
  providers: [ChatbotService],
  imports: [DatabasesModule],
})
export class ChatbotModule {}
