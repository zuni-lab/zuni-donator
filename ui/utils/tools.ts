import classNames from 'classnames';
import moment from 'moment';

/**
 * Mapping hotkey into className package for better usage
 */
export const cx = classNames;

export const formatWalletAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
};

export const getFormattedTimeAndDate = (inputDate: string | number) => {
  const date = moment(inputDate);
  const formattedDate = date.format('HH:mm Do MMM');
  return date.isValid() ? formattedDate : 'Never';
};

// HH, DD/MM/YYYY
export const getFormattedDate = (inputDate: string | number) => {
  const date = moment(inputDate);
  const formattedDate = date.format('DD/MM/YYYY');
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

export const isValidBytes32 = (val: string) => {
  return /^0x([0-9a-fA-F]{64})$/.test(val);
};

export const isValidAddress = (val: string) => {
  return /^0x[a-fA-F0-9]{40}$/.test(val);
};
