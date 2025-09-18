"use client";

import {useState, useEffect, useCallback} from "react";
import {useRouter} from "next/navigation";
import {useLocale, useTranslations} from "next-intl";
import {motion, AnimatePresence} from "framer-motion";
import {getClientAuth} from "@/lib/firebase/client";
import {signInWithEmailAndPassword, createUserWithEmailAndPassword, getRedirectResult} from "firebase/auth";
import {signInWithGoogle} from "@/lib/firebase/auth-client";

export default function AuthClient() {
  const t = useTranslations("Auth");
  const locale = useLocale();
  const router = useRouter();

  const [mode, setMode] = useState<"login"|"register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const afterAuthRedirect = useCallback(async () => {
    try {
      // First try cookie-based session
      let res = await fetch("/api/user", { method: "GET" });

      // If unauthorized, retry with Authorization: Bearer <idToken> (native or cookie-exchange failure)
      if (res.status === 401) {
        try {
          const auth = getClientAuth();
          const user = auth.currentUser;
          if (user) {
            const idToken = await user.getIdToken();
            res = await fetch("/api/user", {
              method: "GET",
              headers: { Authorization: `Bearer ${idToken}` },
            });
          }
        } catch {}
      }

      if (res.status === 401) {
        router.push(`/${locale}`);
        return;
      }

      const json = await res.json().catch(() => ({}));

      // Check if user has a ludus (server selected)
      const hasLudus = json?.hasLudus || false;

      if (!hasLudus) {
        // No ludus yet, go to server selection
        router.push(`/${locale}/server-selection`);
      } else if (!json?.onboardingDone) {
        router.push(`/${locale}/initial-gladiators`);
      } else {
        router.push(`/${locale}/dashboard`);
      }
    } catch {
      router.push(`/${locale}/initial-gladiators`);
    }
  }, [locale, router]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const auth = getClientAuth();
        const result = await getRedirectResult(auth);
        if (!cancelled && result?.user) {
          const idToken = await result.user.getIdToken();
          await fetch("/api/auth/session", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ idToken })
          });
          await afterAuthRedirect();
        }

        // If user is already signed in (e.g., returning visit) ensure redirect
        // and session cookie exchange if needed.
        if (!cancelled && auth.currentUser && !result?.user) {
          // Try to ensure server session exists; if not, exchange token
          try {
            const res = await fetch("/api/user", { method: "GET" });
            if (res.status === 401) {
              const token = await auth.currentUser.getIdToken();
              await fetch("/api/auth/session", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ idToken: token })
              });
            }
          } catch {}
          await afterAuthRedirect();
        }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [afterAuthRedirect]);

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError(t("errors.missingFields"));
      return;
    }
    setLoading(true);
    try {
      const auth = getClientAuth();
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await cred.user.getIdToken();
      await fetch("/api/auth/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ idToken })
      });
      await afterAuthRedirect();
    } catch {
      setError(t("errors.generic"));
    } finally {
      setLoading(false);
    }
  }

  async function handleEmailRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email || !password || !passwordConfirm) {
      setError(t("errors.missingFields"));
      return;
    }
    if (password !== passwordConfirm) {
      setError(t("errors.passwordsMismatch"));
      return;
    }
    setLoading(true);
    try {
      const auth = getClientAuth();
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const idToken = await cred.user.getIdToken();
      await fetch("/api/auth/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ idToken })
      });
      // Try creating user doc using cookie; if 401, retry with Authorization header
      let resCreate = await fetch("/api/user", { method: "POST", headers: {"content-type":"application/json"}, body: JSON.stringify({ onboardingDone: false }) });
      if (resCreate.status === 401) {
        try {
          const token = await cred.user.getIdToken();
          resCreate = await fetch("/api/user", {
            method: "POST",
            headers: {"content-type":"application/json", Authorization: `Bearer ${token}`},
            body: JSON.stringify({ onboardingDone: false })
          });
        } catch {}
      }
      await afterAuthRedirect();
    } catch {
      setError(t("errors.generic"));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
      await afterAuthRedirect();
    } catch {
      setError(t("errors.generic"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-black text-white flex items-center justify-center px-4 py-safe">
      <div className="w-full max-w-md">
        {/* Logo/Brand Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 mb-4 bg-gradient-to-br from-amber-600 to-red-600 rounded-2xl shadow-2xl shadow-amber-600/20">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-red-500 bg-clip-text text-transparent">
            {mode === "login" ? t("title.login") : t("title.register")}
          </h1>
          <p className="mt-2 text-zinc-400">
            {mode === "login" ? t("subtitle.login") : t("subtitle.register")}
          </p>
          <p className="mt-3 text-amber-400/80 text-sm font-medium">
            {t("ludusContext")}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-gradient-to-b from-zinc-900/80 to-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-3xl p-6 sm:p-8 shadow-2xl"
        >
          {/* Google Sign In */}
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-white hover:bg-gray-50 text-black font-medium flex items-center justify-center gap-3 transition-all duration-200 active:scale-[.98] disabled:opacity-60 shadow-lg"
            data-testid="google-signin-button"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {t("cta.google")}
          </button>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />
            <span className="mx-4 text-zinc-500 text-sm font-medium">{t("or")}</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />
          </div>

          <AnimatePresence mode="wait" initial={false}>
            {mode === "login" ? (
              <motion.form
                key="login"
                initial={{opacity:0, y:10}}
                animate={{opacity:1, y:0}}
                exit={{opacity:0, y:-10}}
                transition={{duration:0.2}}
                onSubmit={handleEmailLogin}
                className="space-y-5"
              >
                {/* Email Input */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    {t("email")}
                  </label>
                  <div className="relative">
                    <input
                      name="email"
                      type="email"
                      value={email}
                      onChange={(e)=>setEmail(e.target.value)}
                      className="w-full rounded-2xl bg-black/50 border border-zinc-800 hover:border-zinc-700 focus:border-amber-600 px-4 py-4 pl-12 outline-none transition-all duration-200 text-white placeholder-zinc-600"
                      placeholder={t("emailPlaceholder")}
                      autoComplete="email"
                      inputMode="email"
                      required
                      data-testid="email-input"
                    />
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    {t("password")}
                  </label>
                  <div className="relative">
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e)=>setPassword(e.target.value)}
                      className="w-full rounded-2xl bg-black/50 border border-zinc-800 hover:border-zinc-700 focus:border-amber-600 px-4 py-4 pl-12 pr-12 outline-none transition-all duration-200 text-white placeholder-zinc-600"
                      placeholder={t("passwordPlaceholder")}
                      autoComplete="current-password"
                      required
                      data-testid="password-input"
                    />
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                      data-testid="toggle-password-visibility"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-zinc-700 bg-black/50 text-amber-600 focus:ring-amber-600 focus:ring-offset-0"
                      data-testid="remember-me-checkbox"
                    />
                    <span className="text-sm text-zinc-400">{t("rememberMe")}</span>
                  </label>
                  <button type="button" className="text-sm text-amber-500 hover:text-amber-400 transition-colors">
                    {t("forgotPassword")}
                  </button>
                </div>

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-xl bg-red-500/10 border border-red-500/20"
                  >
                    <p className="text-sm text-red-400 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {error}
                    </p>
                  </motion.div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-500 hover:to-red-500 text-white font-semibold transition-all duration-200 active:scale-[.98] disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-amber-600/20"
                  data-testid="login-submit-button"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t("loading")}
                    </span>
                  ) : t("cta.login")}
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="register"
                initial={{opacity:0, y:10}}
                animate={{opacity:1, y:0}}
                exit={{opacity:0, y:-10}}
                transition={{duration:0.2}}
                onSubmit={handleEmailRegister}
                className="space-y-5"
              >
                {/* Email Input */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    {t("email")}
                  </label>
                  <div className="relative">
                    <input
                      name="email"
                      type="email"
                      value={email}
                      onChange={(e)=>setEmail(e.target.value)}
                      className="w-full rounded-2xl bg-black/50 border border-zinc-800 hover:border-zinc-700 focus:border-amber-600 px-4 py-4 pl-12 outline-none transition-all duration-200 text-white placeholder-zinc-600"
                      placeholder={t("emailPlaceholder")}
                      autoComplete="email"
                      inputMode="email"
                      required
                      data-testid="register-email-input"
                    />
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    {t("password")}
                  </label>
                  <div className="relative">
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e)=>setPassword(e.target.value)}
                      className="w-full rounded-2xl bg-black/50 border border-zinc-800 hover:border-zinc-700 focus:border-amber-600 px-4 py-4 pl-12 pr-12 outline-none transition-all duration-200 text-white placeholder-zinc-600"
                      placeholder={t("passwordPlaceholder")}
                      autoComplete="new-password"
                      required
                      data-testid="register-password-input"
                    />
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password Input */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    {t("passwordConfirm")}
                  </label>
                  <div className="relative">
                    <input
                      name="passwordConfirm"
                      type={showPasswordConfirm ? "text" : "password"}
                      value={passwordConfirm}
                      onChange={(e)=>setPasswordConfirm(e.target.value)}
                      className="w-full rounded-2xl bg-black/50 border border-zinc-800 hover:border-zinc-700 focus:border-amber-600 px-4 py-4 pl-12 pr-12 outline-none transition-all duration-200 text-white placeholder-zinc-600"
                      placeholder={t("passwordConfirmPlaceholder")}
                      autoComplete="new-password"
                      required
                      data-testid="register-password-confirm-input"
                    />
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <button
                      type="button"
                      onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      {showPasswordConfirm ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Terms Checkbox */}
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    required
                    className="mt-1 w-4 h-4 rounded border-zinc-700 bg-black/50 text-amber-600 focus:ring-amber-600 focus:ring-offset-0"
                    data-testid="terms-checkbox"
                  />
                  <label className="text-sm text-zinc-400">
                    {t("agreeToTerms")} <button type="button" className="text-amber-500 hover:text-amber-400 transition-colors underline">{t("termsLink")}</button> {t("and")} <button type="button" className="text-amber-500 hover:text-amber-400 transition-colors underline">{t("privacyLink")}</button>
                  </label>
                </div>

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-xl bg-red-500/10 border border-red-500/20"
                  >
                    <p className="text-sm text-red-400 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {error}
                    </p>
                  </motion.div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-500 hover:to-red-500 text-white font-semibold transition-all duration-200 active:scale-[.98] disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-amber-600/20"
                  data-testid="register-submit-button"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t("loading")}
                    </span>
                  ) : t("cta.register")}
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Switch Mode */}
          <div className="mt-6 text-center">
            <p className="text-sm text-zinc-500">
              {mode === "login" ? (
                <>
                  {t("switch.noAccount")} {" "}
                  <button
                    className="text-amber-500 hover:text-amber-400 font-medium transition-colors"
                    onClick={()=>setMode("register")}
                    data-testid="switch-to-register"
                  >
                    {t("switch.signUp")}
                  </button>
                </>
              ) : (
                <>
                  {t("switch.haveAccount")} {" "}
                  <button
                    className="text-amber-500 hover:text-amber-400 font-medium transition-colors"
                    onClick={()=>setMode("login")}
                    data-testid="switch-to-login"
                  >
                    {t("switch.signIn")}
                  </button>
                </>
              )}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
