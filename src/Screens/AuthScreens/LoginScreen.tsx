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
  const machineId: string | null = useSelector(
    (state: RootState) => state.machine.machineId
  );
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginFormInputs) => {
    const payload: LoginPayload = { ...data, machineId };
    dispatch(loginUser(payload));
    navigate("/mediacontent")
    
    
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-red-300 to-red-800 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background IGUANA text with inverted gradient */}
      <div className="absolute z-0 text-[160px] md:text-[200px] lg:text-[240px] font-extrabold  bg-clip-text text-white  opacity-30 select-none pointer-events-none">
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
      </div>
    </div>
  );
};

export default LoginScreen;
