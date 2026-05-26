import toast, { Toaster, type ToastOptions } from 'react-hot-toast'

const defaultOptions: ToastOptions = {
  duration: 3000,
  style: {
    background: 'var(--surface)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border)',
    fontSize: '13px',
  },
}

const showToast = {
  success: (msg: string, opts?: ToastOptions) =>
    toast.success(msg, { ...defaultOptions, ...opts }),
  error: (msg: string, opts?: ToastOptions) =>
    toast.error(msg, { ...defaultOptions, ...opts }),
  loading: (msg: string, opts?: ToastOptions) =>
    toast.loading(msg, { ...defaultOptions, ...opts }),
  dismiss: toast.dismiss,
}

export { showToast, Toaster }
