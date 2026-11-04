// Тестовые данные, пока бэкенд не готов. Включаются: VITE_USE_MOCK=true
const p = (id, username, position) => ({ id, username, avatar: null, position });

export const cupMock = {
  status: 'live',
  teams: [
    { id: 1, name: 'Снегурочки', members: [p(1, 'alpha', 1), p(2, 'bravo', 2), p(3, 'charlie', 3), p(4, 'delta', 4), p(5, 'echo', 5)] },
    { id: 2, name: 'Дед Морозы', members: [p(6, 'foxtrot', 1), p(7, 'golf', 2), p(8, 'hotel', 3), p(9, 'india', 4), p(10, 'juliet', 5)] },
    { id: 3, name: 'Оливье', members: [p(11, 'kilo', 1), p(12, 'lima', 2), p(13, 'mike', 3), p(14, 'november', 4), p(15, 'oscar', 5)] },
    { id: 4, name: 'Мандарины', members: [p(16, 'papa', 1), p(17, 'quebec', 2), p(18, 'romeo', 3), p(19, 'sierra', 4), p(20, 'tango', 5)] },
  ],
  matches: [
    { id: 1, round: 1, slot: 1, status: 'finished', teamA: { id: 1, name: 'Снегурочки' }, teamB: { id: 2, name: 'Дед Морозы' }, scoreA: 2, scoreB: 1, winnerId: 1 },
    { id: 2, round: 1, slot: 2, status: 'live', teamA: { id: 3, name: 'Оливье' }, teamB: { id: 4, name: 'Мандарины' }, scoreA: 1, scoreB: 1, winnerId: null },
    { id: 3, round: 2, slot: 1, status: 'pending', teamA: { id: 1, name: 'Снегурочки' }, teamB: null, scoreA: 0, scoreB: 0, winnerId: null },
  ],
};