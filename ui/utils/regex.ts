export const HEXDECIMAL_REGEX = /^0x([0-9a-fA-F]{2})+$/;

export const isValidHex = (val: string) => HEXDECIMAL_REGEX.test(val);
