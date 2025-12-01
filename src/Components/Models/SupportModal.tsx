// src/Components/Models/SupportModal.tsx
import React, { type FormEvent, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../../store";
import {
  selectSupport,
  setSupportTopicType,
  setSupportScreenName,
  setSupportDescription,
  setSupportScreenDeviceType,
  resetSupportForm,
} from "../../Redux/Support/SupportSlice";
import type {
  SupportCategory,
  SupportTopicType,
  ScreenDeviceType,
} from "../../Redux/Support/SupportSlice";
import { useGetProfile } from "../../ReactQuery/Profile/GetProfile";
import {
  HelpCircle,
  Bug,
  Image as ImageIcon,
  MonitorSmartphone,
  Monitor,
  Smartphone,
} from "lucide-react";
import { useConfirmDialog } from "../ConfirmDialogContext";
import { useAlertDialog } from "@/AlertDialogContext";

type SupportModalProps = {
  open: boolean;
  onClose: () => void;
};

const categoryLabel = (category: SupportCategory) => {
  switch (category) {
    case "screen":
      return "Screen issue";
    case "content":
      return "Content / playlist issue";
    case "billing":
      return "Billing & account";
    default:
      return "General";
  }
};

const topicTypeLabel = (topicType: SupportTopicType) => {
  switch (topicType) {
    case "software":
      return "Software problem";
    default:
      return "Question";
  }
};

const screenDeviceTypeLabel = (t: ScreenDeviceType) => {
  switch (t) {
    case "windows":
      return "Windows screen / PC player";
    case "android_screen":
      return "Android TV / Android screen";
    case "android_stick":
      return "Android stick";
    default:
      return "—";
  }
};

const SupportModal: React.FC<SupportModalProps> = ({ open, onClose }) => {
  const dispatch = useDispatch();
  const { category, topicType, screenName, description, screenDeviceType } =
    useSelector((s: RootState) => selectSupport(s));
  const alert = useAlertDialog();
  // Get profile (name & email) – user doesn't have to type those
  const { data: profile, isLoading: loadingProfile } = useGetProfile();
  const confirm = useConfirmDialog();
  // Local state for up to 2 images (optional)
  const [image1, setImage1] = useState<File | null>(null);
  const [image2, setImage2] = useState<File | null>(null);

  if (!open) return null;

  // make this async 👇
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      await alert({
        title: "Description required",
        message: "Please describe your question or problem before sending.",
        buttonText: "OK",
      });
      return;
    }

    // If it's a screen software problem, device type is very helpful
    if (
      category === "screen" &&
      topicType === "software" &&
      !screenDeviceType
    ) {
      const confirmContinue = await confirm({
        title: "Continue without device type?",
        message:
          "You did not select the screen device type. This can help us debug faster.\n\nDo you want to continue anyway?",
        confirmText: "Continue",
        cancelText: "Go back",
      });

      if (!confirmContinue) return;
    }

    const userName = profile?.name ?? "Unknown user";
    const userEmail = profile?.email ?? "Unknown email";

    const subjectParts = [
      "[Support]",
      categoryLabel(category),
      "-",
      topicTypeLabel(topicType),
    ];

    const subject = subjectParts.join(" ");

    const bodyLines = [
      `Category: ${categoryLabel(category)}`,
      `Topic type: ${topicTypeLabel(topicType)}`,
      "",
      `User name: ${userName}`,
      `User email: ${userEmail}`,
      "",
      screenName ? `Screen name: ${screenName}` : "Screen name: —",
    ];

    if (category === "screen" && screenDeviceType) {
      bodyLines.push(
        `Screen device type: ${screenDeviceTypeLabel(screenDeviceType)}`
      );
    }

    bodyLines.push("", "Description:", description, "", "");

    if (topicType === "software") {
      bodyLines.push("Software problem screenshots:");
      if (image1) bodyLines.push(`- ${image1.name}`);
      if (image2) bodyLines.push(`- ${image2.name}`);
      if (!image1 && !image2) {
        bodyLines.push("- (no screenshots attached)");
      }
      bodyLines.push(
        "",
        "Please attach the above screenshot files to this email before sending."
      );
    }

    const body = bodyLines.join("\n");

    const mailto = `mailto:support@signage-app.com?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;

    // Open email app
    window.location.href = mailto;

    dispatch(resetSupportForm());
    setImage1(null);
    setImage2(null);
    onClose();
  };

  const handleTopicChange = (value: SupportTopicType) => {
    dispatch(setSupportTopicType(value));
  };

  const handleScreenDeviceChange = (value: ScreenDeviceType) => {
    dispatch(setSupportScreenDeviceType(value));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-lg">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-3 mb-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-red-500" />
              Contact support
            </h3>
          </div>
          <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-600">
            {categoryLabel(category)}
          </span>
        </div>

        {/* User summary (read from profile) */}
        <div className="mb-4 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-[11px] text-gray-600">
          {loadingProfile ? (
            <p>Loading your account details...</p>
          ) : (
            <div className="flex flex-col gap-1">
              <div className="flex justify-between gap-2">
                <span className="font-medium text-gray-700">Signed in as</span>
                <span className="truncate text-right">
                  {profile?.name ?? "—"}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-gray-500">Email</span>
                <span className="truncate text-right">
                  {profile?.email ?? "—"}
                </span>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Topic type: question vs software problem */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-700">
              What do you need help with?
            </label>
            <p className="mb-2 text-[11px] text-gray-500">
              Choose whether you just have a question or if something is broken
              in the software.
            </p>
            <div className="flex gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleTopicChange("question")}
                className={[
                  "flex-1 inline-flex items-center justify-center gap-1 rounded-lg border px-3 py-1.5",
                  topicType === "question"
                    ? "border-red-500 bg-red-50 text-red-700"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
                ].join(" ")}
              >
                <HelpCircle className="h-3 w-3" />
                <span>Question</span>
              </button>
              <button
                type="button"
                onClick={() => handleTopicChange("software")}
                className={[
                  "flex-1 inline-flex items-center justify-center gap-1 rounded-lg border px-3 py-1.5",
                  topicType === "software"
                    ? "border-red-500 bg-red-50 text-red-700"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
                ].join(" ")}
              >
                <Bug className="h-3 w-3" />
                <span>Software problem</span>
              </button>
            </div>
          </div>

          {/* Screen device type (only when screen software problem) */}
          {category === "screen" && topicType === "software" && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">
                Screen device type
              </label>
              <p className="mb-2 text-[11px] text-gray-500">
                Tell us what kind of player is connected to this screen.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleScreenDeviceChange("windows")}
                  className={[
                    "inline-flex items-center justify-center gap-1 rounded-lg border px-2 py-1.5",
                    screenDeviceType === "windows"
                      ? "border-red-500 bg-red-50 text-red-700"
                      : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
                  ].join(" ")}
                >
                  <Monitor className="h-3 w-3" />
                  <span>Windows</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleScreenDeviceChange("android_screen")}
                  className={[
                    "inline-flex items-center justify-center gap-1 rounded-lg border px-2 py-1.5",
                    screenDeviceType === "android_screen"
                      ? "border-red-500 bg-red-50 text-red-700"
                      : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
                  ].join(" ")}
                >
                  <MonitorSmartphone className="h-3 w-3" />
                  <span>Android screen</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleScreenDeviceChange("android_stick")}
                  className={[
                    "inline-flex items-center justify-center gap-1 rounded-lg border px-2 py-1.5",
                    screenDeviceType === "android_stick"
                      ? "border-red-500 bg-red-50 text-red-700"
                      : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
                  ].join(" ")}
                >
                  <Smartphone className="h-3 w-3" />
                  <span>Android stick</span>
                </button>
              </div>
            </div>
          )}

          {/* Screen name (optional but useful) */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Screen name <span className="text-gray-400">(optional)</span>
            </label>
            <input
              value={screenName}
              onChange={(e) => dispatch(setSupportScreenName(e.target.value))}
              placeholder="e.g. Front Window TV"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-1 focus:ring-red-300"
            />
            <p className="mt-1 text-[11px] text-gray-500">
              If this only affects one screen, tell us which one.
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              {topicType === "software"
                ? "Problem description *"
                : "Question / description *"}
            </label>
            <textarea
              value={description}
              onChange={(e) => dispatch(setSupportDescription(e.target.value))}
              rows={4}
              placeholder={
                topicType === "software"
                  ? "Describe what is happening, when it started, what you expected, and what you tried so far."
                  : "Write your question or explain what you need help with."
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-1 focus:ring-red-300"
            />
            <p className="mt-1 text-[11px] text-gray-500">
              The more detail you share, the faster we can help.
            </p>
          </div>

          {/* Images upload (only for software problems) */}
          {topicType === "software" && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-gray-700">
                  Screenshots (optional, up to 2)
                </label>
                <ImageIcon className="h-3.5 w-3.5 text-gray-400" />
              </div>
              <p className="text-[11px] text-gray-500 mb-2">
                Add screenshots to show the problem. We’ll list the file names
                in the email so you can attach them before sending.
              </p>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 text-xs">
                <label className="flex flex-col items-start rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-2 hover:border-red-300 hover:bg-red-50/40 cursor-pointer">
                  <span className="text-[11px] font-medium text-gray-700">
                    Screenshot 1
                  </span>
                  <span className="mt-0.5 text-[11px] text-gray-500">
                    JPG, PNG up to ~5 MB
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImage1(e.target.files?.[0] ?? null)}
                    className="mt-1 hidden"
                  />
                  {image1 && (
                    <span className="mt-1 text-[11px] text-gray-600 truncate w-full">
                      {image1.name}
                    </span>
                  )}
                </label>

                <label className="flex flex-col items-start rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-2 hover:border-red-300 hover:bg-red-50/40 cursor-pointer">
                  <span className="text-[11px] font-medium text-gray-700">
                    Screenshot 2
                  </span>
                  <span className="mt-0.5 text-[11px] text-gray-500">
                    Optional second image
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImage2(e.target.files?.[0] ?? null)}
                    className="mt-1 hidden"
                  />
                  {image2 && (
                    <span className="mt-1 text-[11px] text-gray-600 truncate w-full">
                      {image2.name}
                    </span>
                  )}
                </label>
              </div>

              <p className="mt-2 text-[11px] text-gray-500">
                After your email app opens, attach these files before sending.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => {
                dispatch(resetSupportForm());
                setImage1(null);
                setImage2(null);
                onClose();
              }}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-red-500 px-5 py-2 text-sm font-semibold text-white hover:bg-red-600"
            >
              Open email app
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SupportModal;
