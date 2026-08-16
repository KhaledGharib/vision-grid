import { useEffect, useState } from 'react';
import { imageUrl } from '../storage';

/** Resolves an IndexedDB image id to an object URL. */
export function useImage(imageId: string | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    if (!imageId) {
      setUrl(null);
      return;
    }
    void imageUrl(imageId).then((u) => {
      if (alive) setUrl(u);
    });
    return () => {
      alive = false;
    };
  }, [imageId]);
  return url;
}
