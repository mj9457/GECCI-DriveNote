// lib/timeUtils.ts
export const formatDate = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// "09:00", "9-00", "900", "9 00", "9_00" 등 → "HH:MM"
export const normalizeTimeInput = (input: string): string | null => {
  if (!input) return null;

  let s = input.trim();
  s = s.replace(/[-_\s]/g, ':');

  if (!s.includes(':')) {
    const digits = s.replace(/\D/g, '');
    if (digits.length === 3) {
      const h = digits.slice(0, 1);
      const m = digits.slice(1);
      s = `${h}:${m}`;
    } else if (digits.length === 4) {
      const h = digits.slice(0, 2);
      const m = digits.slice(2);
      s = `${h}:${m}`;
    } else {
      return null;
    }
  }

  const [hStr, mStrRaw] = s.split(':');
  const mStr = mStrRaw ?? '0';

  const h = Number(hStr);
  const m = Number(mStr);

  if (!Number.isInteger(h) || !Number.isInteger(m)) return null;
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;

  const hh = String(h).padStart(2, '0');
  const mm = String(m).padStart(2, '0');

  return `${hh}:${mm}`;
};

export const parseTimeToParts = (timeStr: string) => {
  if (!timeStr) {
    return { ampm: 'AM' as 'AM' | 'PM', hour: '09', minute: '00' };
  }

  const [hStr, mStr] = timeStr.split(':');
  let h = parseInt(hStr || '9', 10);
  let ampm: 'AM' | 'PM' = 'AM';

  if (h === 0) {
    h = 12;
    ampm = 'AM';
  } else if (h === 12) {
    ampm = 'PM';
  } else if (h > 12) {
    h = h - 12;
    ampm = 'PM';
  } else {
    ampm = 'AM';
  }

  const hour = String(h).padStart(2, '0');
  const minute = mStr ?? '00';

  return { ampm, hour, minute };
};

export const partsToTime24 = (parts: { ampm: string; hour: string; minute: string }) => {
  let h = parseInt(parts.hour || '9', 10);

  if (parts.ampm === 'AM') {
    if (h === 12) h = 0;
  } else {
    if (h !== 12) h = h + 12;
  }

  const hStr = String(h).padStart(2, '0');
  return `${hStr}:${parts.minute}`;
};
