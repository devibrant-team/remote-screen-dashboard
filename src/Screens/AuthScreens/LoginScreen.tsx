// src/Screens/AuthScreens/LoginScreen.tsx
import React, { useEffect, useState, type FormEvent } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginUser } from "../../Redux/Authentications/AuthSlice";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../../store";
import { useNavigate } from "react-router-dom";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

interface LoginPayload extends LoginFormInputs {
  machineId: string | null;
}

const LoginScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state: RootState) => state.auth);
  const token = useSelector((state: RootState) => state.auth.token);
  const machineId: string | null = useSelector(
    (state: RootState) => state.machine.machineId
  );

  const [helpOpen, setHelpOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (token) navigate("/mediacontent", { replace: true });
  }, [token, navigate]);

  const onSubmit = async (data: LoginFormInputs) => {
    const payload: LoginPayload = { ...data, machineId };
    try {
      await dispatch(loginUser(payload)).unwrap();
    } catch (e) {
      // error state already handled in slice
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-red-300 to-red-800 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background IGUANA text with inverted gradient */}
      <div className="absolute z-0 text-[160px] md:text-[200px] lg:text-[240px] font-extrabold bg-clip-text text-white opacity-30 select-none pointer-events-none">
        IGUANA
      </div>

      {/* Foreground login box */}
      <div className="z-10 w-full max-w-md backdrop-blur-sm bg-white/65 text-gray-800 p-10 rounded-3xl shadow-2xl border border-gray-200">
        <h1 className="text-4xl font-bold text-center mb-8 text-[var(--black)] tracking-wide">
          Login
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              {...register("email")}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--mainred)] transition-all"
              placeholder="you@example.com"
              disabled={loading}
            />
            {errors.email && (
              <p className="text-sm text-red-600 mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-2"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              {...register("password")}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--mainred)] transition-all"
              placeholder="••••••••"
              disabled={loading}
            />
            {errors.password && (
              <p className="text-sm text-red-600 mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Server-side error message */}
          {error && (
            <p className="text-sm text-red-700 text-center mt-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-semibold transition-all ${
              loading
                ? "bg-gray-400 cursor-not-allowed text-gray-700"
                : "bg-[var(--mainred)] text-[var(--white)] hover:opacity-90"
            }`}
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setHelpOpen(true)}
          className="font-bold text-red-500 mt-5 hover:text-red-400"
        >
          Need help?
        </button>
      </div>

      <LoginHelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
};

type LoginHelpModalProps = {
  open: boolean;
  onClose: () => void;
};

const LoginHelpModal: React.FC<LoginHelpModalProps> = ({ open, onClose }) => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  if (!open) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !message.trim()) return;

    const subject = "[Iguana Signage] Login help";
    const bodyLines = [
      `User email: ${email}`,
      "",
      "Problem / question:",
      message,
    ];
    const body = bodyLines.join("\n");

    const mailto = `mailto:support@signage-app.com?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;

    window.location.href = mailto;
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold mb-3 text-gray-900">
          Need help with login?
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Write your email and describe the problem you&apos;re facing. Your
          email app will open with everything filled in.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Your email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--mainred)]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              What is the problem?
            </label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe what happens when you try to log in..."
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--mainred)]"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[var(--mainred)] text-[var(--white)] text-sm font-semibold hover:opacity-90"
            >
              Open email app
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginScreen;
