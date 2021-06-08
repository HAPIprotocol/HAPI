export function seconds(count: number): number {
  return count;
}

export function minutes(count: number): number {
  return seconds(count * 60);
}

export function hours(count: number): number {
  return minutes(count * 60);
}

export function days(count: number): number {
  return hours(count * 24);
}
