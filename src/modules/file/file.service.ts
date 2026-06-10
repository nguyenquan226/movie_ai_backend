import { Inject, Injectable, Logger } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryResponse } from './cloudinary/cloudinary-response';
import fs, { createReadStream } from 'fs';
import Redis from 'ioredis';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);

  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    @InjectQueue('file-upload') private readonly fileQueue: Queue,
  ) {}

  async uploadFile(file: Express.Multer.File) {
    const filePath = file.path;

    try {
      const dataUpload = await new Promise<CloudinaryResponse>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'chillflix-image',
            public_id: `${file.originalname}-${Date.now()}`,
          },
          (error, result) => {
            if (error) {
              const newError = new Error(error.message || 'Cloudinary upload failed');
              (newError as any).originalError = error;
              return reject(newError);
            }
            if (!result) {
              return reject(new Error('Cloudinary upload failed without an error message.'));
            }
            resolve(result);
          },
        );

        const readStream = createReadStream(filePath);
        readStream.pipe(uploadStream);
      });

      return {
        EC: 0,
        EM: 'Upload image success',
        url: dataUpload.secure_url,
        createdAt: dataUpload.created_at,
      };
    } catch (error) {
      console.error('Upload failed:', error);
      throw new Error('Failed to upload file to Cloudinary.');
    } finally {
      try {
        await fs.promises.unlink(filePath);
        this.logger.warn(`Successfully deleted temporary file: ${filePath}`);
      } catch (cleanupError) {
        this.logger.error('Failed to delete temporary file:', cleanupError);
      }
    }
  }
}
