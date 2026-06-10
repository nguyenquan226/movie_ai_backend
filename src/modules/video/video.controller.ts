import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { VideoService } from './video.service';
import { Public, User } from 'src/decorators/customize';
import type { IUser } from '../users/interface/user.interface';
import { Permission } from 'src/decorators/permission.decorator';

@Controller('video')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @Post('upload-url')
  @Permission('Generate Video Url', 'VIDEO')
  createUploadUrl(@Body() body: { title?: string; description?: string }, @User() user: IUser) {
    const userId = user.userId;
    const metadata = {
      title: body.title || 'Untitle',
      description: body.description || '',
    };

    return this.videoService.createDirectUpload(userId, metadata);
  }

  @Public()
  @Get('upload/:uploadId')
  async getVideoByUploadId(@Param('uploadId') uploadId: string) {
    const upload = await this.videoService.getUpload(uploadId);

    console.log('Check data: ', upload);

    if (!upload.asset_id) {
      return {
        success: true,
        data: {
          uploadId: upload.id,
          status: 'processing',
          message: 'Video is still being processed',
        },
      };
    }

    return await this.videoService.getAsset(upload.asset_id);
  }

  @Public()
  @Get(':assetId')
  getVideo(@Param('assetId') assetId: string) {
    return this.videoService.getAsset(assetId);
  }

  @Delete(':assetId')
  @Permission('Delete video', 'VIDEO')
  deleteVideo(@Param('assetId') assetId: string) {
    return this.videoService.deleteAsset(assetId);
  }
}
