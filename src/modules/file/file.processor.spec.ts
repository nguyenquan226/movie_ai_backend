import { FileProcessor } from './file.processor';

describe('FileProcessor upload retry identity', () => {
  it('reuses the Bull job ID as the upload idempotency key', async () => {
    const fileService = {
      uploadFile: jest.fn().mockResolvedValue({ EC: 0, url: 'https://cdn.example/image.png' }),
    };
    const processor = new FileProcessor(fileService as any);
    const bytes = Buffer.from('image-content');
    const job = {
      id: 'upload-job-123',
      data: {
        jobId: 'upload-job-123',
        filename: 'poster.png',
        mimetype: 'image/png',
        buffer: bytes.toString('base64'),
        size: bytes.length,
      },
      progress: jest.fn().mockResolvedValue(undefined),
    };

    await processor.handleUpload(job as any);

    expect(fileService.uploadFile).toHaveBeenCalledWith(
      expect.objectContaining({ originalname: 'poster.png' }),
      'upload-job-123',
    );
    expect(job.progress).toHaveBeenLastCalledWith(100);
  });
});
