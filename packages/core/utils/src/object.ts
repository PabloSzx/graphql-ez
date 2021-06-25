export function cleanObject<T extends object>(obj: Partial<T> = {}): Partial<T> {
  const clean = { ...obj };
  for (const key in clean) clean[key] === undefined && delete clean[key];
  return clean;
}

export function uniqueArray<T>(array?: T[]): T[] {
  return array?.filter((value, index) => array.indexOf(value) === index) || [];
}

export function toPlural<T>(value: undefined | T | T[]): T[] {
  return Array.isArray(value) ? value : value === undefined ? [] : [value];
}

export function getObjectValue<Obj extends object>(value: Obj | number | string | boolean | null | undefined): Obj | undefined {
  if (value != null && typeof value === 'object') return value;
  return undefined;
}
