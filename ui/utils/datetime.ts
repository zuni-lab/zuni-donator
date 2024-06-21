import moment from 'moment';

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
