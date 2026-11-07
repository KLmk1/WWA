import { useSyncExternalStore } from 'react';

// Текущее время (мс), обновляется раз в секунду. Работает для любого числа подписчиков.
function subscribe(callback) {
  const id = setInterval(callback, 1000);
  return () => clearInterval(id);
}
const getSnapshot = () => Math.floor(Date.now() / 1000) * 1000;

export function useNow() {
  return useSyncExternalStore(subscribe, getSnapshot);
}