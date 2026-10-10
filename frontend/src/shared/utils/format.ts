export const formatCurrencyInput = (value: string, currency: string) => {
  const numericValue = value.replace(/\D/g, "");
  if (!numericValue) return "";
  const amount = parseInt(numericValue, 10);
  if (isNaN(amount)) return "";
  let locale = 'es-CO';
  if (currency === 'USD') locale = 'en-US';
  if (currency === 'CRC') locale = 'es-CR';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};
