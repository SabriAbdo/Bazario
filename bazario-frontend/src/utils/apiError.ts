import { AxiosError } from 'axios';

/** Extracts the backend's error message (e.g. "Catégorie déjà existante") from an Axios error, falling back otherwise. */
export function getApiErrorMessage(err: unknown, fallback: string): string {
  const message = (err as AxiosError<{ message?: string }>)?.response?.data?.message;
  return message || fallback;
}
