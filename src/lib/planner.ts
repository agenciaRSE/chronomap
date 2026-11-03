// Slot search for the meeting planner. Hours are local hours (0-24), one list per column.
export const isWork = (h: number) => h >= 9 && h < 18;
export const isNight = (h: number) => h < 7 || h >= 22;

// `all`: columns when everyone is in working hours. `best`: the column closest to that,
// with the most people working, then the fewest people asleep, then the earliest.
export function findSlots(columns: number[][]) {
  const all: number[] = [];
  let best = { col: 0, inWork: -1, inNight: Infinity };
  columns.forEach((hours, col) => {
    const inWork = hours.filter(isWork).length;
    const inNight = hours.filter(isNight).length;
    if (inWork === hours.length) all.push(col);
    if (inWork > best.inWork || (inWork === best.inWork && inNight < best.inNight)) best = { col, inWork, inNight };
  });
  return { all, best };
}
