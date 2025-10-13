import React, { useState } from "react";
import BaseModal from "../BaseModal";

const WebsiteModal: React.FC<{
  open: boolean;
  onClose: () => void;
}> = ({ open, onClose }) => {
  const [link, setLink] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Website link:", link);
    onClose();
  };

  return (
    <BaseModal open={open} onClose={onClose} title="Add Website Link">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="url"
          required
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="Enter website link..."
          className="w-full border border-red-500 rounded-lg px-4 py-2 text-[var(--black)] focus:outline-none focus:ring-2 focus:ring-red-500 bg-white placeholder:text-gray-400"
        />
        <button
          type="submit"
          className="bg-red-500 text-white font-semibold py-2 rounded-lg hover:bg-red-600 transition"
        >
          Save Link
        </button>
      </form>
    </BaseModal>
  );
};

export default WebsiteModal;
