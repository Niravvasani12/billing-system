export const parseSafeDate = (dateVal) => {
  if (!dateVal) return new Date();
  if (dateVal instanceof Date) return dateVal;
  
  if (typeof dateVal === "number") return new Date(dateVal);
  
  let str = String(dateVal).trim();
  
  // Custom YYYY-MM-DD local parsing to avoid UTC timezone shifts
  const ymdMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ymdMatch) {
    return new Date(
      parseInt(ymdMatch[1], 10),
      parseInt(ymdMatch[2], 10) - 1,
      parseInt(ymdMatch[3], 10)
    );
  }
  
  // SQLite format: YYYY-MM-DD HH:mm:ss -> parse as local standard ISO
  if (str.includes(" ") && !str.includes("T")) {
    str = str.replace(" ", "T");
  }
  
  const parsed = new Date(str);
  if (isNaN(parsed.getTime())) {
    const match = str.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
    if (match) {
      return new Date(
        parseInt(match[1], 10),
        parseInt(match[2], 10) - 1,
        parseInt(match[3], 10),
        parseInt(match[4], 10),
        parseInt(match[5], 10),
        parseInt(match[6], 10)
      );
    }
    return new Date();
  }
  return parsed;
};

export const formatDate = (date) => {
  if (!date) return "-";
  const d = parseSafeDate(date);
  return d.toLocaleDateString("en-GB"); // en-GB format is DD/MM/YYYY
};

export const formatDateTime = (date) => {
  if (!date) return "-";
  const d = parseSafeDate(date);
  return d.toLocaleString("en-GB");
};

