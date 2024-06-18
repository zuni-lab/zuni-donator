import { toast, ToastOptions } from 'react-toastify';

const createToast = (msg: string, options?: ToastOptions) => () => toast(msg, options);

export const ToastTemplate = {
  Tesseract: {
    Failed: createToast('Failed to recognize the text from the image', { type: 'error' }),
  },
};
