export const toMonthKey = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
};

export const toDateInputValue = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const diffMinutes = (startTime: string, endTime: string) => {
  const [sh, sm] = startTime.split(':').map((v) => Number(v));
  const [eh, em] = endTime.split(':').map((v) => Number(v));

  const start = sh * 60 + sm;
  const end = eh * 60 + em;
  return end - start;
};

export const formatMinutes = (minutes: number) => {
  if (!Number.isFinite(minutes)) return '';
  const sign = minutes < 0 ? '-' : '';
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  if (m === 0) return `${sign}${h}h`;
  return `${sign}${h}h ${m}m`;
};

