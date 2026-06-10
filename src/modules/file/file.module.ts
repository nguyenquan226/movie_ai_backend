import { Module } from '@nestjs/common';
import { FileService } from './file.service';
import { CloudinaryProvider } from './cloudinary/cloudinary.provider';
import { FileController } from './file.controller';
import { FileProcessor } from './file.processor';
import { MulterModule } from '@nestjs/platform-express';
import { MulterConfigService } from '../../config/multer.config';
import { BullModule } from '@nestjs/bull';

@Module({
  providers: [FileService, CloudinaryProvider, FileProcessor],
  exports: [FileService, CloudinaryProvider],
  controllers: [FileController],
  imports: [
    MulterModule.registerAsync({
      useClass: MulterConfigService,
    }),
    BullModule.registerQueue({
      name: 'file-upload',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        timeout: 60000,
      },
      limiter: {
        max: 10,
        duration: 1000,
      },
    }),
  ],
})
export class FileModule {}
