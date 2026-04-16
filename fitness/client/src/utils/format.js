// Display formatting utilities

// Convert YYYY-MM-DD to MM/DD
export function formatDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [, m, d] = parts;
  return `${m}/${d}`;
}

// Convert YYYY-MM-DD to MM/DD/YY
export function formatDateLong(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [y, m, d] = parts;
  return `${m}/${d}/${y.slice(-2)}`;
}
