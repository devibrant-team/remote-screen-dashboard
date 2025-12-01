// src/components/ConfirmDialogContext.tsx
import  {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

type ConfirmOptions = {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
};

type ConfirmContextValue = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const ConfirmDialogContext = createContext<ConfirmContextValue | null>(null);

export const useConfirmDialog = () => {
  const ctx = useContext(ConfirmDialogContext);
  if (!ctx) {
    throw new Error("useConfirmDialog must be used inside ConfirmDialogProvider");
  }
  return ctx.confirm;
};

type PendingState = ConfirmOptions & {
  isOpen: boolean;
};

type Resolver = (value: boolean) => void;

export const ConfirmDialogProvider = ({ children }: { children: ReactNode }) => {
  const [pending, setPending] = useState<PendingState>({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Confirm",
    cancelText: "Cancel",
  });

  const [resolver, setResolver] = useState<Resolver | null>(null);

  const close = useCallback((result: boolean) => {
    if (resolver) {
      resolver(result);
      setResolver(null);
    }
    setPending((prev) => ({ ...prev, isOpen: false }));
  }, [resolver]);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setResolver(() => resolve);
      setPending({
        isOpen: true,
        title: options.title ?? "Are you sure?",
        message: options.message ?? "",
        confirmText: options.confirmText ?? "Yes",
        cancelText: options.cancelText ?? "No",
      });
    });
  }, []);

  const { isOpen, title, message, confirmText, cancelText } = pending;

  return (
    <ConfirmDialogContext.Provider value={{ confirm }}>
      {children}

      {/* Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          {/* Dialog */}
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl border border-red-500/40 p-5">
            {/* Title */}
            <h2 className="text-lg font-semibold text-red-500 mb-2">
              {title}
            </h2>

            {/* Message */}
            {message && (
              <p className="text-sm text-gray-700 mb-4">
                {message}
              </p>
            )}

            {/* Buttons */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => close(false)}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-100 transition"
              >
                {cancelText}
              </button>

              <button
                type="button"
                onClick={() => close(true)}
                className="px-4 py-2 text-sm rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 active:scale-[0.98] transition"
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmDialogContext.Provider>
  );
};
