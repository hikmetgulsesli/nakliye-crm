export function computeDiff(
  oldData: Record<string, unknown>,
  newData: Record<string, unknown>
): Record<string, { old: unknown; new: unknown }> | null {
  const changes: Record<string, { old: unknown; new: unknown }> = {};

  for (const key of Object.keys(newData)) {
    if (newData[key] !== undefined && JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
      changes[key] = { old: oldData[key], new: newData[key] };
    }
  }

  return Object.keys(changes).length > 0 ? changes : null;
}
