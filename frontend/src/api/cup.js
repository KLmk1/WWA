import { api } from '../lib/api.js';
import { cupMock } from '../mocks/cup.js';

export const getCup = (signal) =>
  import.meta.env.VITE_USE_MOCK ? Promise.resolve(cupMock) : api('/cup', { signal });