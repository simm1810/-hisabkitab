import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/useAuthStore';
import LogoMark from '../components/LogoMark';

export default function Login() {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [formHint, setFormHint] = useState('');
  const [googleHint, setGoogleHint] = useState('');

  const { user, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      const redirectTo = location.state?.from || '/';
      navigate(redirectTo, { replace: true });
    }
  }, [user, navigate, location]);

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setGoogleHint('');
    try {
      await signInWithGoogle();
    } catch (err) {
      const message = err.message || 'Google sign-in failed';
      setGoogleHint(message);
      toast.error(message);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormHint('');
    setSubmitting(true);
    try {
      const redirectTo = location.state?.from || '/';
      if (mode === 'signup') {
        if (!name.trim()) throw new Error('Please enter your name');
        const data = await signUpWithEmail(email, password, name);
        if (data?.session) {
          toast.success('Account created successfully!');
          navigate(redirectTo, { replace: true });
        } else {
          toast.success('Account created! Check your email to confirm, then sign in.');
          setMode('signin');
        }
      } else {
        const data = await signInWithEmail(email, password);
        if (!data?.session) {
          throw new Error('Login did not complete. Please check your email confirmation, then try again.');
        }

        toast.success('Logged in successfully!');
        navigate(redirectTo, { replace: true });
      }
    } catch (err) {
      const message = err.message || 'Something went wrong';

      if (mode === 'signin' && message.toLowerCase().includes('sign up')) {
        setFormHint(message);
      } else {
        toast.error(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-600 to-teal-700 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-12 pb-8">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-3"
        >
          <LogoMark className="h-16 w-16 rounded-2xl shadow-lg" />
        </motion.div>
        <h1 className="text-white text-2xl font-bold">HisabKitab</h1>
        <p className="text-teal-100 text-sm mt-1 text-center">
          Trip expenses, split fairly, hisaab clear.
        </p>
      </div>

      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-cream-50 rounded-t-[2rem] px-6 pt-8 pb-10 flex-1 shadow-2xl"
      >
        <div className="max-w-sm mx-auto">
          <div className="flex bg-teal-50 rounded-xl p-1 mb-6">
            <button
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                mode === 'signin' ? 'bg-white text-teal-700 shadow-sm' : 'text-teal-500'
              }`}
              onClick={() => {
                setMode('signin');
                setFormHint('');
              }}
            >
              Sign In
            </button>
            <button
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                mode === 'signup' ? 'bg-white text-teal-700 shadow-sm' : 'text-teal-500'
              }`}
              onClick={() => {
                setMode('signup');
                setFormHint('');
              }}
            >
              Sign Up
            </button>
          </div>

          <p className="text-center text-sm text-teal-600 mb-5">
            {mode === 'signin'
              ? 'Already have an account? Sign in to create and split trips.'
              : 'New here? Create your account, then start your first trip.'}
          </p>

          <button
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 bg-white border border-teal-100 rounded-xl py-3 font-semibold text-teal-800 shadow-card active:scale-[0.98] transition disabled:opacity-60 mb-5"
          >
            {googleLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            Continue with Google
          </button>

          {googleHint && (
            <div className="rounded-xl border border-saffron-200 bg-saffron-50 p-3 text-sm text-teal-800 mb-5">
              {googleHint}
            </div>
          )}

          <div className="flex items-center gap-3 mb-5">
            <div className="h-px bg-teal-100 flex-1" />
            <span className="text-xs text-teal-400 font-medium">OR</span>
            <div className="h-px bg-teal-100 flex-1" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {mode === 'signup' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <label className="label-text">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3.5 w-4 h-4 text-teal-400" />
                    <input
                      className="input-field pl-10"
                      placeholder="Rahul Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required={mode === 'signup'}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="label-text">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-4 h-4 text-teal-400" />
                <input
                  type="email"
                  className="input-field pl-10"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="label-text">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-4 h-4 text-teal-400" />
                <input
                  type="password"
                  className="input-field pl-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>
            </div>

            <button type="submit" disabled={submitting} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {mode === 'signup' ? 'Create Account' : 'Sign In'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {formHint && (
              <div className="rounded-xl border border-saffron-200 bg-saffron-50 p-3 text-sm text-teal-800">
                <p>{formHint}</p>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setFormHint('');
                  }}
                  className="mt-2 font-semibold text-teal-700 underline underline-offset-4"
                >
                  Create account with this email
                </button>
              </div>
            )}
          </form>
        </div>
      </motion.div>
    </div>
  );
}
