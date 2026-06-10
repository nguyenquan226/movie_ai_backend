import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileService } from './file.service';
import { Permission } from 'src/decorators/permission.decorator';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { randomUUID } from 'crypto';
import { readFile } from 'fs/promises';
import { Public } from 'src/decorators/customize';

@Controller('file')
export class FileController {
  constructor(
    private readonly fileService: FileService,
    @InjectQueue('file-upload') private readonly fileQueue: Queue,
  ) {}

  @Post('upload')
  @Permission('Upload file', 'FILE')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('File too large (max 10MB)');
    }

    // Check allowed types
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Only image files are allowed');
    }

    // Check queue capacity
    const [waiting, active] = await Promise.all([
      this.fileQueue.getWaitingCount(),
      this.fileQueue.getActiveCount(),
    ]);

    if (waiting + active > 100) {
      throw new BadRequestException('Queue is full, please try again later');
    }

    try {
      const jobId = randomUUID();
      const job = await this.fileQueue.add(
        'process-upload',
        {
          jobId,
          filename: file.originalname,
          mimetype: file.mimetype,
          buffer: file.buffer.toString('base64'),
          size: file.size,
          uploadedAt: new Date().toISOString(),
        },
        {
          jobId,
          priority: 1,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          timeout: 90000,
          removeOnComplete: {
            age: 3600,
            count: 1000,
          },
          removeOnFail: false,
        },
      );

      const result = await job.finished();

      return { ...result };
    } catch (error) {
      throw new BadRequestException(`Failed to process job: ${error.message}`);
    }
  }

  @Public()
  @Get('status/:jobId')
  async getJobStatus(@Param('jobId') jobId: string) {
    const job = await this.fileQueue.getJob(jobId);

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    const state = await job.getState();
    const progress = job.progress();

    // Parse error details nếu có
    let errorDetails: { message: string } | null = null;
    if (job.failedReason) {
      try {
        errorDetails = JSON.parse(job.failedReason);
      } catch {
        errorDetails = { message: job.failedReason };
      }
    }

    return {
      jobId: job.id,
      state,
      progress,
      filename: job.data.filename,
      uploadedAt: job.data.uploadedAt,
      processedOn: job.processedOn ? new Date(job.processedOn) : null,
      finishedOn: job.finishedOn ? new Date(job.finishedOn) : null,
      failedReason: errorDetails,
      attemptsMade: job.attemptsMade,
      attemptsTotal: job.opts.attempts,
      returnvalue: job.returnvalue,
    };
  }

  @Get('queue/stats')
  async getQueueStats() {
    const [waiting, active, completed, failed, delayed, paused] = await Promise.all([
      this.fileQueue.getWaitingCount(),
      this.fileQueue.getActiveCount(),
      this.fileQueue.getCompletedCount(),
      this.fileQueue.getFailedCount(),
      this.fileQueue.getDelayedCount(),
      this.fileQueue.isPaused(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      paused,
      total: waiting + active + completed + failed + delayed,
      health: this.calculateQueueHealth(waiting, active, failed),
    };
  }

  private calculateQueueHealth(waiting: number, active: number, failed: number): string {
    const total = waiting + active + failed;
    if (total === 0) return 'healthy';

    const failureRate = failed / total;
    if (failureRate > 0.3) return 'critical';
    if (failureRate > 0.1) return 'warning';
    if (waiting > 50) return 'congested';

    return 'healthy';
  }

  @Get('queue/jobs/:state')
  async getJobsByState(@Param('state') state: 'waiting' | 'active' | 'completed' | 'failed') {
    let jobs;

    switch (state) {
      case 'waiting':
        jobs = await this.fileQueue.getWaiting();
        break;
      case 'active':
        jobs = await this.fileQueue.getActive();
        break;
      case 'completed':
        jobs = await this.fileQueue.getCompleted(0, 100); // Limit 100
        break;
      case 'failed':
        jobs = await this.fileQueue.getFailed(0, 100);
        break;
      default:
        throw new BadRequestException('Invalid state');
    }

    return jobs.map((job) => ({
      jobId: job.id,
      filename: job.data.filename,
      state: state,
      progress: job.progress(),
      uploadedAt: job.data.uploadedAt,
      attemptsMade: job.attemptsMade,
    }));
  }

  @Post('queue/pause')
  @Permission('Pause queue', 'FILE')
  async pauseQueue() {
    await this.fileQueue.pause();
    return { message: 'Queue paused successfully' };
  }

  @Post('queue/resume')
  @Permission('Resume queue', 'FILE')
  async resumeQueue() {
    await this.fileQueue.resume();
    return { message: 'Queue resumed successfully' };
  }

  @Post('queue/clean')
  @Permission('Clean queue', 'FILE')
  async cleanQueue() {
    await Promise.all([
      this.fileQueue.clean(3600 * 1000, 'completed'),
      this.fileQueue.clean(24 * 3600 * 1000, 'failed'),
    ]);

    return { message: 'Queue cleaned successfully' };
  }

  @Post('job/:jobId/retry')
  @Permission('Retry queue', 'FILE')
  async retryJob(@Param('jobId') jobId: string) {
    const job = await this.fileQueue.getJob(jobId);

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    const state = await job.getState();
    if (state !== 'failed') {
      throw new BadRequestException(`Cannot retry job in state: ${state}`);
    }

    await job.retry();
    return {
      message: 'Job retried successfully',
      jobId: job.id,
    };
  }

  @Post('job/:jobId/remove')
  @Permission('Remove job', 'FILE')
  async removeJob(@Param('jobId') jobId: string) {
    const job = await this.fileQueue.getJob(jobId);

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    await job.remove();
    return {
      message: 'Job removed successfully',
      jobId: job.id,
    };
  }
}
