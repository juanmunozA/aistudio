import { Router } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { aiController } from '../controllers/aiController.js';
import { attachmentController } from '../controllers/attachmentController.js';
import { authController } from '../controllers/authController.js';
import { caseController } from '../controllers/caseController.js';
import { documentController } from '../controllers/documentController.js';
import { exportController, exportRequestSchema } from '../controllers/exportController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { validate } from '../middlewares/validate.js';
import { caseIdParamsSchema, createCaseSchema, updateCaseSchema } from '../models/case.js';
import { acpPlansRequestSchema } from '../models/domain.js';
import { loginSchema } from '../models/user.js';
import { aiRequestSchema } from '../services/aiService.js';
import { MAX_IMAGE_BYTES } from '../services/attachmentService.js';
import { SUPPORTED_DOCUMENT_EXTENSIONS } from '../services/documentService.js';
import { HttpError } from '../utils/httpError.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, done) => {
    const extension = file.originalname.split('.').pop()?.toLowerCase() ?? '';
    if (SUPPORTED_DOCUMENT_EXTENSIONS.includes(extension)) done(null, true);
    else done(HttpError.badRequest(`Tipo de archivo no soportado: .${extension}`));
  },
});

const imageUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_IMAGE_BYTES, files: 1 } });
const attachmentIdParams = z.object({ id: z.uuid() });

export const apiRouter = Router();

apiRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

apiRouter.post('/auth/login', validate(loginSchema), authController.login);
apiRouter.post('/auth/refresh', authenticate, authController.refresh);
apiRouter.get('/auth/me', authenticate, authController.me);

apiRouter.get('/cases', authenticate, caseController.list);
apiRouter.post('/cases', authenticate, validate(createCaseSchema), caseController.create);
apiRouter.post('/cases/normalize', authenticate, validate(createCaseSchema), caseController.normalize);
apiRouter.get('/cases/:id', authenticate, validate(caseIdParamsSchema, 'params'), caseController.get);
apiRouter.put('/cases/:id', authenticate, validate(caseIdParamsSchema, 'params'), validate(updateCaseSchema), caseController.update);
apiRouter.delete('/cases/:id', authenticate, validate(caseIdParamsSchema, 'params'), caseController.remove);
apiRouter.get('/cases/:id/history', authenticate, validate(caseIdParamsSchema, 'params'), caseController.history);

apiRouter.post('/ai/:operation', authenticate, validate(aiRequestSchema), aiController.run);
apiRouter.post('/domain/acp-plans', authenticate, validate(acpPlansRequestSchema), aiController.acpPlans);

apiRouter.post('/documents/extract-text', authenticate, upload.single('file'), documentController.extractText);

apiRouter.post('/attachments', authenticate, imageUpload.single('file'), attachmentController.upload);
apiRouter.get('/attachments/:id/url', authenticate, validate(attachmentIdParams, 'params'), attachmentController.sign);
apiRouter.get('/attachments/:id/content', validate(attachmentIdParams, 'params'), attachmentController.content);
apiRouter.delete('/attachments/:id', authenticate, validate(attachmentIdParams, 'params'), attachmentController.remove);

apiRouter.post('/exports/:type', authenticate, validate(exportRequestSchema), exportController.excel);
