import { api } from '../lib/api.js';

export const getAwards = (signal) => api('/awards', { signal });
export const vote = (nominationId, nomineeId) =>
  api(`/awards/${nominationId}/vote`, { method: 'POST', body: { nomineeId } });