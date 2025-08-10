import  { useContext, useEffect, useRef, useState } from "react";
import { useBeforeUnload, UNSAFE_NavigationContext, useNavigate } from "react-router-dom";

type Options = {
  when: boolean;
  onConfirmLeave: () => void;
  redirectPath?: string;
};

export function useLeaveGuard({ when, onConfirmLeave, redirectPath = "/playlist" }: Options) {
  const navCtx = useContext(UNSAFE_NavigationContext) as any; // { navigator }
  const navigatorObj = navCtx?.navigator;
  const navigate = useNavigate();

  const unblockRef = useRef<null | (() => void)>(null);
  const pendingTxRef = useRef<any>(null);
  const [open, setOpen] = useState(false);

  // Always pass a handler (fixes TS: handler cannot be undefined)
  useBeforeUnload((e) => {
    if (!when) return;
    e.preventDefault();
    e.returnValue = "";
  });

  // In-app navigation block (only if supported)
  useEffect(() => {
    if (!when) return;
    const canBlock = navigatorObj && typeof navigatorObj.block === "function";
    if (!canBlock) return; // ← no crash, just skip route blocking

    unblockRef.current = navigatorObj.block((tx: any) => {
      pendingTxRef.current = tx;
      setOpen(true);
    });

    return () => {
      unblockRef.current?.();
      unblockRef.current = null;
    };
  }, [navigatorObj, when]);

  const stay = () => {
    setOpen(false);
    // If we were using history.block, keep it active and drop the pending tx
    pendingTxRef.current = null;
  };

  const leave = () => {
    onConfirmLeave?.();
    // Unblock if we had blocked
    unblockRef.current?.();
    unblockRef.current = null;
    const tx = pendingTxRef.current;
    pendingTxRef.current = null;
    setOpen(false);

    if (tx?.retry) {
      // let original navigation proceed (if available)
      tx.retry();
    } else {
      // otherwise force to /playlist as requested
      navigate(redirectPath, { replace: true });
    }
  };

  const Dialog = () =>
    !open ? null : (
      <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
          <h3 className="text-lg font-semibold">Leave and delete this work?</h3>
          <p className="mt-2 text-sm text-gray-600">
            If you leave or refresh now, your current playlist data will be deleted.
          </p>
          <div className="mt-5 flex items-center justify-end gap-2">
            <button
              onClick={stay}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50"
            >
              Continue editing
            </button>
            <button
              onClick={leave}
              className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Delete & leave
            </button>
          </div>
        </div>
      </div>
    );

  return { Dialog, stay, leave, open };
}
