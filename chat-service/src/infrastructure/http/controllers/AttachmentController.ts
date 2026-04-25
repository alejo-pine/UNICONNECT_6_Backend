// src/infrastructure/http/controllers/AttachmentController.ts

import { Request, Response, NextFunction } from 'express';
import { GetDmAttachmentUrlUseCase } from '../../../application/use-cases/GetDmAttachmentUrlUseCase';
import { GetWallAttachmentUrlUseCase } from '../../../application/use-cases/GetWallAttachmentUrlUseCase';

export class AttachmentController {
  constructor(
    private readonly getDmAttachmentUrl: GetDmAttachmentUrlUseCase,
    private readonly getWallAttachmentUrl: GetWallAttachmentUrlUseCase
  ) {}

  getDmSignedUrl = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { attachmentId } = req.params as { attachmentId: string };
      const url = await this.getDmAttachmentUrl.execute(attachmentId, req.userId);
      res.status(200).json({ url });
    } catch (error) {
      next(error);
    }
  };

  getWallSignedUrl = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { attachmentId } = req.params as { attachmentId: string };
      const url = await this.getWallAttachmentUrl.execute(attachmentId, req.userId);
      res.status(200).json({ url });
    } catch (error) {
      next(error);
    }
  };
}
