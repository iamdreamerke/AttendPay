export const formatKES = (amount: number): string => {
  return `KES ${Math.round(amount).toLocaleString('en-KE')}`;
};

export const formatHours = (hours: number): string => {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m.toString().padStart(2, '0')}m`;
};