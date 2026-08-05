export function fmtMoney(amount: number, symbol = "₦") {
  const rounded = Math.round((amount + Number.EPSILON) * 100) / 100;
  return `${symbol}${rounded.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function fmtQty(value: number, decimals = 2) {
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(decimals);
}
