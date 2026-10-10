import { apiRequest, apiUrl } from './httpClient';

export const ATTACHMENT_REF_PREFIX = 'attachment:';

interface SignedAttachment {
  id: string;
  ref: string;
  url: string;
  expiresAt: string;
}

export const isAttachmentRef = (value: string) => value.startsWith(ATTACHMENT_REF_PREFIX);

export const attachmentsApi = {
  /** Sube una imagen y devuelve la referencia que se guarda en el caso. */
  uploadImage: async (file: File): Promise<SignedAttachment> => {
    const formData = new FormData();
    formData.append('file', file);
    const result = await apiRequest<{ attachment: SignedAttachment }>('/attachments', { method: 'POST', formData });
    return result.attachment;
  },

  /** URL firmada vigente para mostrar la imagen. */
  signedUrl: async (ref: string): Promise<{ url: string; expiresAt: string }> => {
    const id = ref.slice(ATTACHMENT_REF_PREFIX.length);
    const result = await apiRequest<{ attachment: SignedAttachment }>(`/attachments/${id}/url`);
    return { url: apiUrl(result.attachment.url), expiresAt: result.attachment.expiresAt };
  },

  remove: (ref: string) => apiRequest<void>(`/attachments/${ref.slice(ATTACHMENT_REF_PREFIX.length)}`, { method: 'DELETE' }),
};
