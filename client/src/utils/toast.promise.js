import toast from "react-hot-toast";

export const toastPromise = (promiseFunc, message) => {
  return toast.promise(promiseFunc, {
    loading: message.loading,
    success: message.success,
    error: message.error,
  });
};
