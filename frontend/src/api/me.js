import { api } from '../lib/api.js';

const mockUser = {
  id: 1,
  discordId: '1',
  username: 'test',
  avatar: null,
  isAdmin: true, // поставьте false, чтобы проверить, как выглядит обычный участник
};

export const getMe = (signal) =>
  import.meta.env.VITE_USE_MOCK === 'true'
    ? Promise.resolve(mockUser)
    : api('/me', { signal });