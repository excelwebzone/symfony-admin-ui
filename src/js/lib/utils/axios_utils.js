import axios from 'axios';
import csrf from './csrf';

// Use an instance so we control interceptors without polluting global axios
const client = axios.create();

// Headers
client.defaults.headers.common[csrf.headerKey] = csrf.token;
// Used by Rails to check if it is a valid XHR request
client.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

/**
 * Bridge AbortController -> CancelToken for adapters that ignore `signal`.
 * Keep this tiny so callers can pass `signal` and it "just works".
 */
client.interceptors.request.use((config) => {
  // Active request counter
  window.activeResources = window.activeResources || 0;
  window.activeResources += 1;

  // If a signal was provided but adapter ignores it, also wire a CancelToken.
  // Axios v1 still supports CancelToken (deprecated), but it cancels XHR reliably.
  const hasSignal = typeof config.signal !== 'undefined' && config.signal != null;
  const hasCancelToken = typeof config.cancelToken !== 'undefined' && config.cancelToken != null;

  if (hasSignal && !hasCancelToken && axios.CancelToken) {
    const src = axios.CancelToken.source();
    config.cancelToken = src.token;

    const abort = () => {
      try { src.cancel('canceled'); } catch (_) {}
    };

    if (config.signal.aborted) {
      abort();
    } else {
      // Ensure we don’t leak the listener
      config.signal.addEventListener('abort', abort, { once: true });
    }
  }

  return config;
});

// Decrement counter on success
client.interceptors.response.use(
  (response) => {
    if (window.activeResources > 0) window.activeResources -= 1;
    return response;
  },
  (error) => {
    if (window.activeResources > 0) window.activeResources -= 1;
    return Promise.reject(error);
  }
);

export default client;

/**
 * @return The adapter that axios uses for dispatching requests. This may be overwritten in tests.
 *
 * @see https://github.com/axios/axios/tree/master/lib/adapters
 * @see https://github.com/ctimmerm/axios-mock-adapter/blob/v1.12.0/src/index.js#L39
 */
export const getDefaultAdapter = () => client.defaults.adapter;
