import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import type { HandleUploadBody } from '@vercel/blob/client';

function isAdmin() {
  const cookieStore = cookies();
  const auth = cookieStore.get('admin_auth')?.value;
  if (!auth) return false;
  const [_, role] = decodeURIComponent(auth).split(':');
  return role === 'admin';
}

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const { handleUpload } = await import('@vercel/blob/client');
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!isAdmin()) {
          throw new Error('Tylko administrator może przesyłać pliki');
        }

        return {
          allowedContentTypes: ['application/zip', 'application/x-zip-compressed'],
          tokenPayload: JSON.stringify({
            // Dodatkowe dane
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Tu można zapisać URL do KV, aby GET wiedział co serwować
        try {
          // Importujemy dynamicznie, aby uniknąć problemów w edge
          const { getKvClient } = await import('../../../../lib/kv');
          const kv = getKvClient();
          if (kv) {
            await kv.set('server_zip_url', { url: blob.url, filename: blob.pathname, updatedAt: Date.now() });
          }
        } catch (error) {
          console.error('Błąd zapisu URL do KV:', error);
        }
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}
