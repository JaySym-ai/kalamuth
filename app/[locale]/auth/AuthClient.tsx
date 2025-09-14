"use client";

import {useState, useEffect} from "react";
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
  }, []);

  async function afterAuthRedirect() {
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
      if (!json?.onboardingDone) {
        router.push(`/${locale}/onboarding`);
      } else {
        router.push(`/${locale}`);
      }
    } catch {
      router.push(`/${locale}/onboarding`);
    }
  }

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
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold">{mode === "login" ? t("title.login") : t("title.register")}</h1>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-2xl">
          <button onClick={handleGoogle} disabled={loading} className="w-full py-3 rounded-xl bg-white text-black font-medium active:scale-[.99] disabled:opacity-60">
            {t("cta.google")}
          </button>
          <div className="flex items-center my-4">
            <div className="flex-1 h-px bg-zinc-800" />
            <span className="mx-3 text-zinc-400 text-sm">{t("or")}</span>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>

          <AnimatePresence mode="wait" initial={false}>
            {mode === "login" ? (
              <motion.form key="login" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} transition={{duration:0.2}} onSubmit={handleEmailLogin} className="space-y-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">{t("email")}</label>
                  <input name="email" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-3 outline-none focus:border-zinc-600" autoComplete="email" inputMode="email" required />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">{t("password")}</label>
                  <input name="password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-3 outline-none focus:border-zinc-600" autoComplete="current-password" required />
                </div>
                {error && <p className="text-sm text-red-400">{error}</p>}
                <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-indigo-600 font-medium active:scale-[.99] disabled:opacity-60">{t("cta.login")}</button>
              </motion.form>
            ) : (
              <motion.form key="register" initial={{opacity:0, x:-20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:20}} transition={{duration:0.2}} onSubmit={handleEmailRegister} className="space-y-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">{t("email")}</label>
                  <input name="email" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-3 outline-none focus:border-zinc-600" autoComplete="email" inputMode="email" required />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">{t("password")}</label>
                  <input name="password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-3 outline-none focus:border-zinc-600" autoComplete="new-password" required />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">{t("passwordConfirm")}</label>
                  <input name="passwordConfirm" type="password" value={passwordConfirm} onChange={(e)=>setPasswordConfirm(e.target.value)} className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-3 outline-none focus:border-zinc-600" autoComplete="new-password" required />
                </div>
                {error && <p className="text-sm text-red-400">{error}</p>}
                <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-indigo-600 font-medium active:scale-[.99] disabled:opacity-60">{t("cta.register")}</button>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="mt-4 text-center">
            {mode === "login" ? (
              <button className="text-sm text-zinc-400 underline underline-offset-4" onClick={()=>setMode("register")}>{t("switch.toRegister")}</button>
            ) : (
              <button className="text-sm text-zinc-400 underline underline-offset-4" onClick={()=>setMode("login")}>{t("switch.toLogin")}</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
