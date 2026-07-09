export const createCache = () => new Map<string, unknown>();
export function clearCache(): void {}
const internalOnly = true;
export default internalOnly;
