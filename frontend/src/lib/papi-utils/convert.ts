export const plancksToDot = (value: bigint): number => {
  return Number(value) / (10 ** 10);
}

export const dotToPlancks = (value: number): bigint => {
  return BigInt(value) * BigInt(10 ** 10);
}

export const perbillToDecimal = (perbillValue: number | bigint): number => {
  const PERBILL_DIVISOR = 1_000_000_000; 
  return Number(perbillValue) / PERBILL_DIVISOR;
};