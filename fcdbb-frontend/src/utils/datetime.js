export const VIETNAM_TIME_ZONE = 'Asia/Ho_Chi_Minh';

const isNaiveVietnamInput = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(value);

export const parseVietnamDate = (value) => {
  if (!value) return null;
  const raw = String(value);
  const normalized = isNaiveVietnamInput(raw) ? `${raw.length === 16 ? `${raw}:00` : raw}+07:00` : raw;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatVietnamDateTime = (value, options = {}) => {
  const date = parseVietnamDate(value);
  if (!date) return '—';
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: VIETNAM_TIME_ZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    ...options,
  }).format(date);
};

export const formatVietnamDate = (value) => formatVietnamDateTime(value, {
  hour: undefined,
  minute: undefined,
  second: undefined,
});

export const toVietnamInput = (value) => {
  const date = parseVietnamDate(value);
  if (!date) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: VIETNAM_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date).reduce((result, part) => {
    result[part.type] = part.value;
    return result;
  }, {});
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`;
};

export const vietnamInputToIso = (value) => {
  if (!value) return null;
  const normalized = value.length === 16 ? `${value}:00` : value;
  const date = new Date(`${normalized}+07:00`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};
