/**
 * Recursively converts remove null values from an object
 * @param data
 * @returns
 */
export function toFormDTO(data: unknown): unknown {
  if (Array.isArray(data)) return data.map(toFormDTO);
  if (typeof data === 'object' && data !== null) {
    const result: Record<string, unknown> = {};
    for (const key in data) {
      const value = toFormDTO((data as Record<string, unknown>)[key]);
      if (value !== null) {
        result[key] = value;
      }
    }
    return result;
  }
  return data;
}
