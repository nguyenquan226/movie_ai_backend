import { OnQueueActive, OnQueueCompleted, OnQueueFailed, Process, Processor } from '@nestjs/bull';
import { InternalServerErrorException, Logger } from '@nestjs/common';
import { FileService } from './file.service';
import type { Job } from 'bull';
import { join } from 'path';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { Readable } from 'stream';
import { randomUUID } from 'crypto';
import { existsSync } from 'fs';

@Processor('file-upload')
export class FileProcessor {
  private readonly logger = new Logger(FileProcessor.name);
  private readonly uploadDir = join(process.cwd(), 'uploads');

  constructor(private readonly fileService: FileService) {
    this.logger.log('>> FileProcessor initialized');
    this.ensureUploadDir();
  }

  private async ensureUploadDir() {
    try {
      if (!existsSync(this.uploadDir)) {
        await mkdir(this.uploadDir, { recursive: true });
        this.logger.log(`Created upload directory: ${this.uploadDir}`);
      }
    } catch (error) {
      this.logger.error(`Failed to create upload directory: ${error.message}`);
    }
  }

  @Process({
    name: 'process-upload',
    concurrency: 5,
  })
  async handleUpload(job: Job) {
    const { jobId, filename, mimetype, buffer, size, originalPath } = job.data;

    this.logger.log(`[Job ${job.id}] Processing: ${filename}`);

    let tempPath: string | null = null;

    try {
      await job.progress(20);

      const uniqueFilename = `${randomUUID()}-${filename}`;
      tempPath = join(this.uploadDir, uniqueFilename);

      const fileBuffer = Buffer.from(buffer, 'base64');
      await writeFile(tempPath, fileBuffer);

      this.logger.log(`[Job ${job.id}] Temp file created: ${tempPath}`);

      await job.progress(40);
      const file: Express.Multer.File = {
        fieldname: 'file',
        originalname: filename,
        encoding: '7bit',
        mimetype: mimetype,
        size: size,
        path: tempPath,
        filename: `temp-${Date.now()}-${filename}`,
        destination: join(process.cwd(), 'uploads'),
        buffer: fileBuffer,
        stream: Readable.from(fileBuffer),
      } as Express.Multer.File;

      await job.progress(60);
      const result = await this.fileService.uploadFile(file);
      await this.cleanupTempFile(tempPath, job.id);

      await job.progress(100);
      this.logger.log(`[Job ${job.id}] Upload completed: ${result.url}`);

      return { ...result };
    } catch (error) {
      this.logger.error(`[Job ${job.id}] Error:`, error.message);

      if (tempPath) {
        this.cleanupTempFile(tempPath, job.id);
      }

      throw new InternalServerErrorException('Error when upload image: ', error);
    }
  }

  private async cleanupTempFile(tempPath: string, jobId: string | number): Promise<void> {
    try {
      if (existsSync(tempPath)) {
        await unlink(tempPath);
        this.logger.log(`[Job ${jobId}] Cleaned up temp file: ${tempPath}`);
      }
    } catch (cleanupError) {
      this.logger.error(`[Job ${jobId}] Failed to cleanup temp file: ${cleanupError.message}`);
    }
  }

  @OnQueueActive()
  onActive(job: Job) {
    this.logger.log(`[Job ${job.id}] Started processing`);
  }

  @OnQueueCompleted()
  onCompleted(job: Job, result: any) {
    this.logger.log(`[Job ${job.id}] Completed successfully - URL: ${result?.result?.url}`);
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(
      `[Job ${job.id}] Failed after ${job.attemptsMade}/${job.opts.attempts} attempts: ${error.message}`,
    );
  }
}
