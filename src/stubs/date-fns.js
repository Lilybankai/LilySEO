// Stub for date-fns
// This file is used during server-side rendering and building
// to prevent errors with date-fns functions

export function format() {
  return '';
}

export function formatDistanceToNow() {
  return '';
}

export function parseISO() {
  return new Date();
}

export function addDays() {
  return new Date();
}

export function subDays() {
  return new Date();
}

export function subMonths() {
  return new Date();
}

export function startOfWeek() {
  return new Date();
}

export function endOfWeek() {
  return new Date();
}

export function isSameDay() {
  return false;
}

export function addWeeks() {
  return new Date();
}

export function subWeeks() {
  return new Date();
}

export function isValid() {
  return true;
}

export function formatDistance() {
  return '';
}

// Explicitly export function 'D' to potentially match minified code error
export const D = () => 'stubbed-D-function-result'; 

// Default export for ES modules
export default {
  format,
  formatDistanceToNow,
  parseISO,
  addDays,
  subDays,
  subMonths,
  startOfWeek,
  endOfWeek,
  isSameDay,
  addWeeks,
  subWeeks,
  isValid,
  formatDistance,
  D // Include D in default export as well
};

// Create a stub for the locale submodule
export const locale = {
  enUS: {
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
  }
}; 