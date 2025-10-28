// src/Components/Models/BaseModal.tsx
import { X } from "lucide-react";
import React from "react";

type BaseModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;

  /** Extra classes for the inner panel (width, padding, etc.) */
  panelClassName?: string;
};

const BaseModal: React.FC<BaseModalProps> = ({
  open,
  onClose,
  title,
  children,
  panelClassName,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div
        className={
          // default width was max-w-md; allow override via panelClassName
          `bg-[var(--white)] w-full max-w-md p-6 rounded-xl relative ${panelClassName ?? ""}`
        }
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500 hover:text-[var(--black)] cursor-pointer"
          aria-label="Close"
        >
          <X size={20} />
        </button>
        <h2 className="text-xl font-bold mb-4 text-[var(--black)]">{title}</h2>
        {children}
      </div>
    </div>
  );
};

export default BaseModal;
