import React, { useEffect, useState } from 'react';
import { attachmentsApi, isAttachmentRef } from '../../services/api/attachmentsApi';

const cache = new Map<string, { url: string; expiresAt: number }>();

/** Resuelve la URL firmada de un adjunto (con caché hasta poco antes de que venza). */
function useImageSource(source: string): string | undefined {
  const [url, setUrl] = useState<string | undefined>(() => (isAttachmentRef(source) ? undefined : source));

  useEffect(() => {
    if (!isAttachmentRef(source)) {
      setUrl(source);
      return;
    }
    const cached = cache.get(source);
    if (cached && cached.expiresAt - Date.now() > 60_000) {
      setUrl(cached.url);
      return;
    }
    let cancelled = false;
    attachmentsApi
      .signedUrl(source)
      .then(({ url: signed, expiresAt }) => {
        cache.set(source, { url: signed, expiresAt: new Date(expiresAt).getTime() });
        if (!cancelled) setUrl(signed);
      })
      .catch((error) => console.error('Error loading attachment:', error));
    return () => {
      cancelled = true;
    };
  }, [source]);

  return url;
}

/** Imagen del caso: acepta referencias a adjuntos y también imágenes en base64 de casos anteriores. */
export const CaseImage: React.FC<{ source: string } & Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'>> = ({ source, ...props }) => {
  const url = useImageSource(source);
  if (!url) return <div className={`${props.className ?? ''} bg-slate-100 animate-pulse`} />;
  return <img src={url} {...props} />;
};
