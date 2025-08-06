import { X } from "lucide-react";
import React from "react";

type BaseModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};

const BaseModal: React.FC<BaseModalProps> = ({ open, onClose, title, children }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-[var(--white)] w-full max-w-md p-6 rounded-xl relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500 hover:text-[var(--black)]"
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
