export const generateKeyMap = (type: string, value: string) => {
  if (!type || !value) {
    throw new Error('Type and value are required to generate keyMap');
  }

  const normalizedType = type.trim().toUpperCase();
  const normalizedValue = value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  return `${normalizedType}_${normalizedValue}`;
};
