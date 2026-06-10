import { Injectable } from '@nestjs/common';
import { MulterModuleOptions, MulterOptionsFactory } from '@nestjs/platform-express';
import { diskStorage, memoryStorage } from 'multer';
import path, { join } from 'path';
import { mkdirSync } from 'fs';

@Injectable()
export class MulterConfigService implements MulterOptionsFactory {
  getRootPath = () => {
    return process.cwd();
  };

  createMulterOptions(): MulterModuleOptions {
    return {
      // storage: diskStorage({
      //   destination: (req, file, cb) => {
      //     const folder = (req.headers['folder_type'] as string) ?? 'default';
      //     const uploadPath = join(process.cwd(), 'public/images', folder);
      //     mkdirSync(uploadPath, { recursive: true });
      //     cb(null, uploadPath);
      //   },
      //   filename: (req, file, cb) => {
      //     const extName = path.extname(file.originalname);
      //     const baseName = path.basename(file.originalname, extName);

      //     const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      //     const finalName = `${baseName}-${uniqueSuffix}${extName}`;

      //     cb(null, finalName);
      //   },
      // }),
      storage: memoryStorage(),
      fileFilter: (req, file, cb) => {
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (allowedMimeTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type. Only image files are allowed.'), false);
        }
      },
      limits: { fileSize: 1024 * 1024 * 5 },
    };
  }
}
