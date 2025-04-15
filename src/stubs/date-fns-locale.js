// Stub for date-fns/locale
export const enUS = {
  code: 'en-US',
  formatDistance: () => '',
  formatRelative: () => '',
  localize: {
    ordinalNumber: () => '',
    era: () => '',
    quarter: () => '',
    month: () => '',
    day: () => '',
    dayPeriod: () => ''
  },
  formatLong: {
    date: () => '',
    time: () => '',
    dateTime: () => ''
  },
  match: {
    ordinalNumber: () => [],
    era: () => [],
    quarter: () => [],
    month: () => [],
    day: () => [],
    dayPeriod: () => []
  },
  options: {
    weekStartsOn: 0,
    firstWeekContainsDate: 1
  }
};

// Add additional locales as needed
export const enGB = { ...enUS, code: 'en-GB' };
export const es = { ...enUS, code: 'es' };
export const fr = { ...enUS, code: 'fr' };
export const de = { ...enUS, code: 'de' };
export const ja = { ...enUS, code: 'ja' };
export const ru = { ...enUS, code: 'ru' };
export const zh = { ...enUS, code: 'zh' };

// Default export
export default {
  enUS,
  enGB,
  es,
  fr,
  de,
  ja,
  ru,
  zh
}; 