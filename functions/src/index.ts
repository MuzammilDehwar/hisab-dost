import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { defineJsonSecret } from 'firebase-functions/params';
import { onCall, HttpsError } from 'firebase-functions/v2/https';

const b2Config = defineJsonSecret('B2_CONFIG');

type B2Config = {
  endpoint: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
};

function getClient(): { client: S3Client; bucket: string } {
  const config = b2Config.value() as B2Config;
  if (!config?.endpoint || !config.bucket || !config.accessKeyId || !config.secretAccessKey) {
    throw new Error('B2_CONFIG is incomplete.');
  }
  return {
    client: new S3Client({
      region: 'us-east-005',
      endpoint: config.endpoint.startsWith('http') ? config.endpoint : `https://${config.endpoint}`,
      credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
    }),
    bucket: config.bucket,
  };
}

function assertAuth(uid?: string): string {
  if (!uid) throw new HttpsError('unauthenticated', 'Firebase login required.');
  return uid;
}

async function bodyToString(body: unknown): Promise<string> {
  if (!body || typeof (body as AsyncIterable<Uint8Array>)[Symbol.asyncIterator] !== 'function') {
    throw new Error('Empty B2 object.');
  }
  const chunks: Uint8Array[] = [];
  for await (const chunk of body as AsyncIterable<Uint8Array>) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

export const uploadEncryptedBackup = onCall({ secrets: [b2Config], cors: true }, async (request) => {
  const uid = assertAuth(request.auth?.uid);
  const encryptedPayload = request.data?.encryptedPayload;
  if (typeof encryptedPayload !== 'string' || encryptedPayload.length < 40 || encryptedPayload.length > 25_000_000) {
    throw new HttpsError('invalid-argument', 'Encrypted backup payload invalid hai.');
  }
  try {
    const { client, bucket } = getClient();
    const key = `users/${uid}/backups/latest.json`;
    await client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: encryptedPayload,
      ContentType: 'application/json',
      Metadata: { encrypted: 'true', ownerUid: uid },
    }));
    return { ok: true, key };
  } catch (error) {
    console.error('B2 upload failed', error);
    throw new HttpsError('internal', 'Encrypted backup upload failed.');
  }
});

export const restoreEncryptedBackup = onCall({ secrets: [b2Config], cors: true }, async (request) => {
  const uid = assertAuth(request.auth?.uid);
  try {
    const { client, bucket } = getClient();
    const response = await client.send(new GetObjectCommand({ Bucket: bucket, Key: `users/${uid}/backups/latest.json` }));
    return { ok: true, encryptedPayload: await bodyToString(response.Body) };
  } catch (error) {
    console.error('B2 restore failed', error);
    throw new HttpsError('not-found', 'Encrypted backup not found.');
  }
});
