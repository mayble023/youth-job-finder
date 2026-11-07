import { useCallback, useEffect, useRef, useState } from 'react';

import {
  clearApplicationDraft,
  loadApplicationDraft,
  saveApplicationDraft,
} from '@/services/localCache';

import { useAuth } from './useAuth';

/**
 * Keeps an unsent cover note on the phone, so leaving the screen or losing signal does not
 * lose what the user typed.
 */
export function useApplicationDraft(jobId: string) {
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const [restoredDraft, setRestoredDraft] = useState<string | null>(null);
  // Set after a successful submit so a late autosave cannot bring the draft back.
  const isCleared = useRef(false);

  useEffect(() => {
    let isCurrent = true;
    loadApplicationDraft(userId, jobId).then((draft) => {
      if (isCurrent) setRestoredDraft(draft);
    });
    return () => {
      isCurrent = false;
    };
  }, [userId, jobId]);

  const saveDraft = useCallback(
    async (coverNote: string) => {
      if (!isCleared.current) await saveApplicationDraft(userId, jobId, coverNote);
    },
    [userId, jobId],
  );

  const clearDraft = useCallback(async () => {
    isCleared.current = true;
    await clearApplicationDraft(userId, jobId);
  }, [userId, jobId]);

  return { restoredDraft, isRestored: restoredDraft !== null, saveDraft, clearDraft };
}
