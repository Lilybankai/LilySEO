// Stub for react-day-picker
export const DayPicker = () => null;
export const useNavigation = () => ({
  goToMonth: () => {},
  nextMonth: () => {},
  previousMonth: () => {},
  setMonth: () => {},
  goToDate: () => {}
});

export const useInput = () => ({
  inputProps: {},
  dayPickerProps: {},
  selectedDay: null,
  setSelectedDay: () => {},
  reset: () => {}
});

export const useCalendarCell = () => ({
  buttonProps: {},
  isSelected: false,
  isInRange: false,
  isSelectionStart: false,
  isSelectionEnd: false
});

export const CaptionNavigation = () => null;
export const Caption = () => null;
export const Dropdown = () => null;
export const DateRange = () => null;
export const DateRangePicker = () => null;
export const MonthNavigation = () => null;
export const Weekday = () => null;
export const Week = () => null;
export const Month = () => null;
export const MonthCalendar = () => null;
export const YearNavigation = () => null;
export const YearMonthSelect = () => null;

// Mock calendar props and types
export const DateFormatter = {
  format: () => ''
};

export default {
  DayPicker,
  useNavigation,
  useInput,
  useCalendarCell,
  CaptionNavigation,
  Caption,
  Dropdown,
  DateRange,
  DateRangePicker,
  MonthNavigation,
  Weekday,
  Week,
  Month,
  MonthCalendar,
  YearNavigation,
  YearMonthSelect,
  DateFormatter
}; 