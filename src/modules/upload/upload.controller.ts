import { Request, Response } from 'express';
import { uploadService, UploadFolder } from './upload.service';

export class UploadController {
  /**
   * Upload single file
   */
  async uploadFile(req: Request, res: Response) {
    try {
      const file = req.file;
      const folder = (req.params.folder || req.body.folder || 'attachments') as UploadFolder;

      if (!file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded',
        });
      }

      // Validate folder
      const validFolders: UploadFolder[] = ['templates', 'documents', 'avatars', 'attachments'];
      if (!validFolders.includes(folder)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid folder. Must be one of: ' + validFolders.join(', '),
        });
      }

      const result = await uploadService.uploadFile(file, folder);

      res.json({
        success: true,
        message: 'File uploaded successfully',
        data: result,
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to upload file',
      });
    }
  }

  /**
   * Upload multiple files
   */
  async uploadFiles(req: Request, res: Response) {
    try {
      const files = req.files as Express.Multer.File[];
      const folder = (req.params.folder || req.body.folder || 'attachments') as UploadFolder;

      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files uploaded',
        });
      }

      const results = await uploadService.uploadFiles(files, folder);

      res.json({
        success: true,
        message: `${results.length} files uploaded successfully`,
        data: results,
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to upload files',
      });
    }
  }

  /**
   * Delete file
   */
  async deleteFile(req: Request, res: Response) {
    try {
      const { key, url } = req.body;

      const fileKey = key || uploadService.extractKeyFromUrl(url);

      if (!fileKey) {
        return res.status(400).json({
          success: false,
          message: 'File key or URL is required',
        });
      }

      await uploadService.deleteFile(fileKey);

      res.json({
        success: true,
        message: 'File deleted successfully',
      });
    } catch (error: any) {
      console.error('Delete error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete file',
      });
    }
  }

  /**
   * Get presigned URL for direct upload
   */
  async getPresignedUrl(req: Request, res: Response) {
    try {
      const { folder, filename, contentType } = req.body;

      if (!folder || !filename || !contentType) {
        return res.status(400).json({
          success: false,
          message: 'folder, filename, and contentType are required',
        });
      }

      const result = await uploadService.getPresignedUrl(
        folder as UploadFolder,
        filename,
        contentType
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Presigned URL error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to generate presigned URL',
      });
    }
  }
}

export const uploadController = new UploadController();
