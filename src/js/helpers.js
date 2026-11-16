import { TIMEOUT_SEC } from './config.js';

// Los errores suben al controlador para mostrarlos en la vista correspondiente.
export const getJSON = async function (url, signal) {
  const request = new AbortController();
  const abort = () => request.abort();
  if (signal?.aborted) abort();
  signal?.addEventListener('abort', abort, { once: true });
  let timer;

  try {
    const fetchPromise = (async () => {
      const response = await fetch(url, { signal: request.signal });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('We could not find that recipe. Please try another one!');
        }
        if (response.status === 429) {
          throw new Error('Too many requests. Please wait a while and try again.');
        }
        throw new Error(data.message || `The request failed (${response.status}).`);
      }
      return data;
    })();

    const timeoutPromise = new Promise((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error('The request took too long. Please try again.'));
        request.abort();
      }, TIMEOUT_SEC * 1000);
    });

    return await Promise.race([fetchPromise, timeoutPromise]);
  } catch (error) {
    if (error instanceof TypeError && !signal?.aborted) {
      throw new Error('Could not connect. Check your internet connection and try again.');
    }
    throw error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
};

export const escapeHTML = function (value) {
  const characters = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(value ?? '').replace(/[&<>"']/g, character => characters[character]);
};

export const getSafeUrl = function (value) {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
};

export const getImageUrl = function (value) {
  return getSafeUrl(value).replace(/^http:/, 'https:');
};
