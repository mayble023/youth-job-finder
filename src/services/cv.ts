import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import * as WebBrowser from 'expo-web-browser';

import { AppError } from '@/utils/errors';

import { getCurrentUserId } from './auth';
import { setMyCvPath } from './profile';
import { runQuery } from './request';
import { supabase } from './supabase';

const BUCKET = 'cvs';
const CV_FILE_NAME = 'cv.pdf';
// Matches the bucket's file_size_limit in 001_schema.sql.
export const CV_MAX_BYTES = 5 * 1024 * 1024;
const SIGNED_URL_SECONDS = 60 * 60;
// A 5 MB file can take a while on slow mobile data.
const UPLOAD_TIMEOUT_MS = 90_000;

export type CvFileErrorKind = 'too_large' | 'not_pdf' | 'unreadable';

export type PickedCv = { uri: string; name: string; sizeBytes: number };

export type CvInfo = { path: string; uploadedAt: string | null };

function cvFileError(kind: CvFileErrorKind, message: string) {
  return new AppError<CvFileErrorKind>(kind, message);
}

function toMegabytes(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(1);
}

/** Opens the phone's file picker for a PDF. Returns null if the user cancels. */
export async function pickCvFile(): Promise<PickedCv | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/pdf',
    // Copying into the app's cache lets us read the file bytes reliably.
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled) return null;

  const [asset] = result.assets;
  if (!asset) return null;

  const isPdf = asset.mimeType === 'application/pdf' || asset.name.toLowerCase().endsWith('.pdf');
  if (!isPdf) throw cvFileError('not_pdf', 'Please choose a PDF file.');

  const sizeBytes = asset.size ?? new File(asset.uri).size;
  if (sizeBytes > CV_MAX_BYTES) {
    throw cvFileError(
      'too_large',
      `That file is ${toMegabytes(sizeBytes)} MB. Please choose a PDF under 5 MB.`,
    );
  }

  return { uri: asset.uri, name: asset.name, sizeBytes };
}

/**
 * Uploads the PDF to `cvs/<userId>/cv.pdf`, replacing any earlier CV, then saves that
 * storage path on the profile. The bucket is private; storage RLS only allows the user's
 * own folder.
 */
export async function uploadCv(file: PickedCv): Promise<string> {
  const userId = await getCurrentUserId();
  const path = `${userId}/${CV_FILE_NAME}`;

  let body: ArrayBuffer;
  try {
    // Supabase's React Native guidance is to upload an ArrayBuffer (Blob/FormData are
    // unreliable in RN).
    body = await new File(file.uri).arrayBuffer();
  } catch {
    throw cvFileError('unreadable', 'We could not read that file. Please choose it again.');
  }

  await runQuery(
    () =>
      supabase.storage
        .from(BUCKET)
        .upload(path, body, { contentType: 'application/pdf', upsert: true }),
    undefined,
    { timeoutMs: UPLOAD_TIMEOUT_MS },
  );
  await setMyCvPath(path);
  return path;
}

/** When the CV at `path` was last uploaded, from the storage object's metadata. */
export async function getCvInfo(path: string, signal?: AbortSignal): Promise<CvInfo | null> {
  const [folder, fileName] = path.split('/');
  const objects = await runQuery(
    () => supabase.storage.from(BUCKET).list(folder, { search: fileName, limit: 1 }),
    signal,
  );
  const object = objects?.find((item) => item.name === fileName);
  if (!object) return null;
  return { path, uploadedAt: object.updated_at ?? object.created_at ?? null };
}

/**
 * Opens the CV in an in-app browser using a signed URL that expires after 60 minutes,
 * so the private file is never exposed through a permanent public link.
 */
export async function viewCv(path: string): Promise<void> {
  const data = await runQuery(() =>
    supabase.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_SECONDS),
  );
  if (!data?.signedUrl) throw cvFileError('unreadable', 'We could not open your CV right now.');
  await WebBrowser.openBrowserAsync(data.signedUrl);
}

export async function deleteCv(path: string): Promise<void> {
  await runQuery(() => supabase.storage.from(BUCKET).remove([path]));
  await setMyCvPath(null);
}
