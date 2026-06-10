import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import Mux from '@mux/mux-node';
import { HeadersLike } from '@mux/mux-node/core.mjs';

@Injectable()
export class VideoService {
  private readonly logger = new Logger(VideoService.name);
  private mux: Mux;

  constructor(private configService: ConfigService) {
    this.mux = new Mux({
      tokenId: this.configService.get<string>('MUX_TOKEN_ID'),
      tokenSecret: this.configService.get<string>('MUX_TOKEN_SECRET'),
      webhookSecret: this.configService.get<string>('MUX_WEBHOOK_SECRET'),
    });
  }

  async createDirectUpload(userId: number, metadata?: Record<string, string>) {
    try {
      const upload = await this.mux.video.uploads.create({
        cors_origin: this.configService.get<string>('FRONTEND_ADMIN_URL') || '*',
        new_asset_settings: {
          playback_policy: ['public'],
          passthrough: JSON.stringify({
            user_id: userId.toString(),
            ...metadata,
          }),
        },
      });

      this.logger.log(`Created upload URL: ${upload.id}`);

      console.log('>>> Check data upload: ', upload);

      return {
        EC: 0,
        EM: 'Lấy URL video thành công',
        uploadId: upload.id,
        url: upload.url,
      };
    } catch (error) {
      this.logger.error('Failed to create upload URL', error);
      throw error;
    }
  }

  async getUpload(uploadId: string) {
    try {
      const upload = await this.mux.video.uploads.retrieve(uploadId);
      return upload;
    } catch (error) {
      this.logger.error(`Failed to get upload ${uploadId}`, error);
      throw error;
    }
  }

  async getAsset(assetId: string) {
    try {
      const asset = await this.mux.video.assets.retrieve(assetId);

      return {
        EC: 0,
        EM: 'Get video success',

        id: asset.id,
        status: asset.status,
        duration: asset.duration,
        playbackId: asset.playback_ids?.[0]?.id,
        playbackUrl: asset.playback_ids?.[0]?.id
          ? this.getPlaybackUrl(asset.playback_ids[0].id)
          : null,
        thumbnail: asset.playback_ids?.[0]?.id
          ? `https://image.mux.com/${asset.playback_ids[0].id}/thumbnail.jpg`
          : null,
      };
    } catch (error) {
      this.logger.error(`Failed to get asset ${assetId}`, error);
      throw error;
    }
  }

  getPlaybackUrl(playbackId: string): string {
    return `https://stream.mux.com/${playbackId}.m3u8`;
  }

  verifyWebhookSignature(rawBody: string, signature: string, secret?: string): boolean {
    const webhookSecret = secret ?? this.configService.get<string>('MUX_WEBHOOK_SECRET');

    if (!webhookSecret) {
      this.logger.error('Webhook verification failed: missing secret');
      return false;
    }

    try {
      this.mux.webhooks.verifySignature(
        rawBody,
        { 'mux-signature': signature } as HeadersLike,
        webhookSecret,
      );
      return true;
    } catch (error) {
      this.logger.error('Webhook verification failed', error);
      return false;
    }
  }

  async deleteAsset(assetId: string) {
    try {
      await this.mux.video.assets.delete(assetId);
      this.logger.log(`Deleted asset: ${assetId}`);
      return {
        success: true,
        message: 'Video deleted successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to delete asset ${assetId}`, error);
      throw error;
    }
  }
}
