import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { env } from '../config/env.js';
import type { AuthUser } from '../models/user.js';
import { attachmentRepository } from '../repositories/attachmentRepository.js';
import { getFileStorage } from '../storage/index.js';
import { HttpError } from '../utils/httpError.js';

/** Referencia que se guarda en el caso en lugar del archivo en base64. */
export const ATTACHMENT_REF_PREFIX = 'attachment:';

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

const signingKey = env.ATTACHMENT_URL_SECRET ?? env.JWT_SECRET!;

// Se valida el contenido real (firma del archivo), no solo la extensión que envía el navegador.
function detectImageType(buffer: Buffer): string | null {
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  return null;
}

const signature = (id: string, expires: number) => createHmac('sha256', signingKey).update(`${id}.${expires}`).digest('base64url');

export interface SignedAttachment {
  id: string;
  ref: string;
  /** Ruta relativa a la API (/attachments/:id/content?...). */
  url: string;
  expiresAt: string;
}

function signedUrl(id: string): SignedAttachment {
  const expires = Math.floor(Date.now() / 1000) + env.ATTACHMENT_URL_TTL_SECONDS;
  return {
    id,
    ref: `${ATTACHMENT_REF_PREFIX}${id}`,
    url: `/attachments/${id}/content?expires=${expires}&signature=${signature(id, expires)}`,
    expiresAt: new Date(expires * 1000).toISOString(),
  };
}

export const attachmentService = {
  async uploadImage(user: AuthUser, fileName: string, content: Buffer): Promise<SignedAttachment> {
    const contentType = detectImageType(content);
    if (!contentType) throw HttpError.badRequest('Solo se permiten imágenes PNG, JPG o WEBP');

    const id = randomUUID();
    const storageKey = `${user.sub}/${id}`;
    await getFileStorage().put(storageKey, content, contentType);
    await attachmentRepository.insert({ id, ownerSub: user.sub, fileName, contentType, sizeBytes: content.length, storageKey });
    return signedUrl(id);
  },

  /** Nueva URL firmada para un adjunto del usuario (las URLs vencen). */
  async sign(user: AuthUser, id: string): Promise<SignedAttachment> {
    const attachment = await attachmentRepository.findOwned(id, user.sub);
    if (!attachment) throw HttpError.notFound('Adjunto no encontrado');
    return signedUrl(id);
  },

  /** Contenido de un adjunto a partir de una URL firmada vigente. */
  async readSigned(id: string, expires: number, providedSignature: string) {
    const expected = Buffer.from(signature(id, expires));
    const provided = Buffer.from(providedSignature);
    const valid = expected.length === provided.length && timingSafeEqual(expected, provided);
    if (!valid || expires * 1000 < Date.now()) throw HttpError.forbidden('URL de adjunto inválida o vencida');

    const attachment = await attachmentRepository.findById(id);
    if (!attachment) throw HttpError.notFound('Adjunto no encontrado');
    return { attachment, content: await getFileStorage().get(attachment.storageKey) };
  },

  async remove(user: AuthUser, id: string) {
    const deleted = await attachmentRepository.deleteOwned(id, user.sub);
    if (!deleted) throw HttpError.notFound('Adjunto no encontrado');
    await getFileStorage().remove(deleted.storageKey);
  },

  /**
   * Para la IA: convierte las referencias "attachment:<id>" del usuario en data URLs.
   * Las imágenes en base64 de casos anteriores se mantienen tal cual.
   */
  async resolveImagesForAi(user: AuthUser, images: unknown): Promise<unknown> {
    if (!Array.isArray(images)) return images;
    return Promise.all(
      images.map(async (image) => {
        if (typeof image !== 'string' || !image.startsWith(ATTACHMENT_REF_PREFIX)) return image;
        const attachment = await attachmentRepository.findOwned(image.slice(ATTACHMENT_REF_PREFIX.length), user.sub);
        if (!attachment) throw HttpError.badRequest('Imagen adjunta no encontrada');
        const content = await getFileStorage().get(attachment.storageKey);
        return `data:${attachment.contentType};base64,${content.toString('base64')}`;
      }),
    );
  },
};
