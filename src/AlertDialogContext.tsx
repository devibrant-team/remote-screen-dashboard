import React, {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

type AlertOptions = {
  title?: string;
  message: string;
  buttonText?: string;
};

type AlertContextValue = {
  alert: (options: AlertOptions) => Promise<void>;
};

const AlertDialogContext = createContext<AlertContextValue | null>(null);

export const useAlertDialog = () => {
  const ctx = useContext(AlertDialogContext);
  if (!ctx) throw new Error("useAlertDialog must be used inside AlertDialogProvider");
  return ctx.alert;
};

export const AlertDialogProvider = ({ children }: { children: ReactNode }) => {
  const [pending, setPending] = useState<AlertOptions & { isOpen: boolean }>({
    isOpen: false,
    title: "",
    message: "",
    buttonText: "OK",
  });

  const [resolver, setResolver] = useState<(() => void) | null>(null);

  const alert = useCallback((options: AlertOptions) => {
    return new Promise<void>((resolve) => {
      setResolver(() => resolve);
      setPending({
        isOpen: true,
        title: options.title ?? "Notice",
        message: options.message,
        buttonText: options.buttonText ?? "OK",
      });
    });
  }, []);

  const close = () => {
    if (resolver) resolver();
    setResolver(null);
    setPending((prev) => ({ ...prev, isOpen: false }));
  };

  const { isOpen, title, message, buttonText } = pending;

  return (
    <AlertDialogContext.Provider value={{ alert }}>
      {children}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-xs rounded-2xl bg-white shadow-xl border border-red-500/40 p-5">
            <h2 className="text-lg font-semibold text-red-500 mb-2">{title}</h2>
            <p className="text-sm text-gray-700 mb-4 whitespace-pre-line">
              {message}
            </p>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={close}
                className="px-4 py-2 text-sm rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 active:scale-95 transition"
              >
                {buttonText}
              </button>
            </div>
          </div>
        </div>
      )}
    </AlertDialogContext.Provider>
  );
};
