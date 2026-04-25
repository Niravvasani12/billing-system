const ones = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen"
];

const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

const twoDigits = (num) => {
  if (num < 20) return ones[num];
  const t = Math.floor(num / 10);
  const o = num % 10;
  return `${tens[t]}${o ? ` ${ones[o]}` : ""}`.trim();
};

const threeDigits = (num) => {
  const h = Math.floor(num / 100);
  const rem = num % 100;
  const hPart = h ? `${ones[h]} Hundred` : "";
  const rPart = rem ? twoDigits(rem) : "";
  return `${hPart}${hPart && rPart ? " " : ""}${rPart}`.trim();
};

export const numberToWordsIndian = (value) => {
  const num = Math.floor(Number(value || 0));
  if (!num) return "Zero Rupees";

  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const hundred = num % 1000;

  const parts = [];
  if (crore) parts.push(`${threeDigits(crore)} Crore`);
  if (lakh) parts.push(`${threeDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${threeDigits(thousand)} Thousand`);
  if (hundred) parts.push(threeDigits(hundred));

  return `${parts.join(" ")} Rupees`.trim();
};
