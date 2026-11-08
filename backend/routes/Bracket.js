// Одиночное выбывание на 2–8 команд. teamIds идут по посеву: первый — сильнейший.
// Если команд не степень двойки, топ-посевы проходят в следующий раунд без матча (бай).
// Возвращает план матчей: { key, round, slot, a, b }, где a/b = { team: id } или { from: key матча-источника }.
export function buildBracket(teamIds) {
  const n = teamIds.length;
  if (n < 2) throw new Error('Нужно минимум 2 команды');

  let size = 2;
  while (size < n) size *= 2;

  // Порядок посева в сетке: для 8 это [1, 8, 4, 5, 2, 7, 3, 6]
  let seeds = [1, 2];
  while (seeds.length < size) {
    const m = seeds.length * 2;
    seeds = seeds.flatMap((s) => [s, m + 1 - s]);
  }

  let current = seeds.map((s) => (s <= n ? { team: teamIds[s - 1] } : null));
  const matches = [];
  let round = 1;

  while (current.length > 1) {
    const next = [];
    let slot = 0;
    for (let i = 0; i < current.length; i += 2) {
      const a = current[i];
      const b = current[i + 1];
      if (a && b) {
        const m = { key: matches.length, round, slot: ++slot, a, b };
        matches.push(m);
        next.push({ from: m.key });
      } else {
        next.push(a ?? b ?? null); // бай
      }
    }
    current = next;
    round += 1;
  }
  return matches;
}