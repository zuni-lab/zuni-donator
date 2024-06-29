import moment from 'moment';
import classNames from 'classnames';

/**
 * Mapping hotkey into className package for better usage
 */
export const cx: typeof classNames = classNames;

export const formatWalletAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
};

export const getFomattedTimeAndDate = (inputDate: string | number) => {
  const date = moment(inputDate);
  const formattedDate = date.format('HH:mm Do MMM');
  return date.isValid() ? formattedDate : 'Never';
};

export const getForrmattedFullDate = (inputDate: string | number) => {
  const date = moment(inputDate).utc();
  const formattedDate = date.format('HH:mm Do MMM YYYY');
  return date.isValid() ? formattedDate : 'Never';
};

// HH, DD/MM/YYYY
export const getFormattedDate = (inputDate: string | number) => {
  const date = moment(inputDate);
  const formattedDate = date.format('DD-MM-YYYY');
  return date.isValid() ? formattedDate : 'Never';
};

export const toUtcTime = (date: Date) => {
  const time = new Date(date);
  time.setMinutes(time.getMinutes() - time.getTimezoneOffset());
  return time;
};

// hex
export const isValidBytes = (val: string) => {
  return /^0x([0-9a-fA-F]{2})+$/.test(val);
};

export const isValidBytesWithLength = (val: string, length: number) => {
  return new RegExp(`^0x([0-9a-fA-F]{${length * 2}})$`).test(val);
};

export const isValidAddress = (val: string) => {
  return isValidBytesWithLength(val, 20);
};

const FLOAT_REGEX = /^[+-]?([0-9]*[.])?[0-9]+$/;
export const isValidFloat = (val: string) => {
  return FLOAT_REGEX.test(val);
};
