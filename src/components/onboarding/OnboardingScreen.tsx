import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Palette, 
  ShoppingBag, 
  Store, 
  ArrowRight, 
  Check, 
  ChevronDown, 
  Globe, 
  User, 
  Phone, 
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  Sparkles
} from 'lucide-react';
import { Language, UserRole } from '../../types';
import { SUPPORTED_LANGUAGES } from '../../i18n';

export const OnboardingScreen: React.FC = () => {
  const { 
    language, 
    setLanguage, 
    signIn,
    signUp,
    resendVerificationEmail,
    t
  } = useApp();

  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUnconfirmedEmail, setIsUnconfirmedEmail] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Signup-specific fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('artisan');
  const [selectedLanguage, setSelectedLanguage] = useState<string>(language);

  // Language Dropdown Menu State
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  // Close language menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    setResendStatus(null);
    const res = await resendVerificationEmail(email);
    setResending(false);
    if (res.success) {
      setResendStatus('Verification link resent! Please check your inbox.');
    } else {
      setResendStatus(res.error || 'Failed to resend email.');
    }
  };

  const handleQuickLogin = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMessage(null);
    setIsUnconfirmedEmail(false);
    setResendStatus(null);
    setLoading(true);
    const result = await signIn(demoEmail, demoPass);
    setLoading(false);
    if (!result.success) {
      setErrorMessage(result.error || 'Login failed. Please check credentials.');
      if (result.isEmailNotConfirmed) {
        setIsUnconfirmedEmail(true);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsUnconfirmedEmail(false);
    setResendStatus(null);

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    if (authMode === 'login') {
      const res = await signIn(email, password);
      setLoading(false);
      if (!res.success) {
        setErrorMessage(res.error || 'Invalid email or password.');
        if (res.isEmailNotConfirmed) {
          setIsUnconfirmedEmail(true);
        }
      }
    } else {
      if (!name.trim()) {
        setLoading(false);
        setErrorMessage('Please enter your full name.');
        return;
      }

      const res = await signUp({
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim(),
        role,
        language: selectedLanguage,
      });

      setLoading(false);
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to create account. Please try again.');
        if (res.isEmailNotConfirmed) {
          setIsUnconfirmedEmail(true);
        }
      } else if (res.isEmailNotConfirmed) {
        setIsUnconfirmedEmail(true);
        setErrorMessage('Account created! Please check your inbox to confirm your email before signing in.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#222222] flex flex-col justify-between selection:bg-[#F4E39E]">
      {/* Top Bar with Brand & Language Selector */}
      <header className="w-full max-w-7xl mx-auto px-4 py-4 flex items-center justify-between border-b border-[#EBE7E4]/80">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#423a6e] text-white flex items-center justify-center font-bold text-base shadow-sm">
            क
          </div>
          <div>
            <h1 className="text-base font-extrabold text-[#1a1c1a] tracking-tight">KalaSetu</h1>
            <p className="text-[10px] text-[#797580] font-medium leading-none">Artisan & Heritage Commerce</p>
          </div>
        </div>

        {/* Language Dropdown */}
        <div className="relative" ref={langMenuRef}>
          <button
            type="button"
            onClick={() => setLangMenuOpen(!langMenuOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#D0C9D6] bg-white text-xs font-semibold text-[#423a6e] hover:bg-[#F4F1F8] transition-all cursor-pointer shadow-xs"
            id="btn-language-selector"
          >
            <Globe className="w-3.5 h-3.5 text-[#423a6e]" />
            <span>{SUPPORTED_LANGUAGES.find((l) => l.code === language)?.label || 'हिन्दी'}</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${langMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {langMenuOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-[#EBE7E4] py-2 z-50 max-h-72 overflow-y-auto">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#797580] border-b border-[#F4F1F8]">
                Select Language
              </div>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    setLanguage(lang.code as Language);
                    setSelectedLanguage(lang.code);
                    setLangMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors text-left cursor-pointer ${
                    language === lang.code ? 'bg-[#F4F1F8] text-[#423a6e] font-bold' : 'text-[#48454F] hover:bg-[#FAF9F6]'
                  }`}
                >
                  <div>
                    <p className="font-medium text-xs text-[#1a1c1a]">{lang.label}</p>
                    <p className="text-[10px] text-[#797580]">{lang.englishName}</p>
                  </div>
                  {language === lang.code && <Check className="w-3.5 h-3.5 text-[#423a6e]" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Main Authentication Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-4">
        <div className="w-full max-w-md bg-white rounded-3xl border border-[#E8E4DF] shadow-md p-6 sm:p-8">
          {/* Header Switcher */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-[#1a1c1a] tracking-tight">
              {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-xs text-[#797580] mt-1.5">
              {authMode === 'login'
                ? 'Sign in to access your artisan studio or buyer marketplace'
                : 'Join KalaSetu to preserve and trade authentic Indian craft heritage'}
            </p>

            {/* Tab switch */}
            <div className="mt-5 grid grid-cols-2 p-1 bg-[#F4F1F8] rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setErrorMessage(null);
                }}
                className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  authMode === 'login'
                    ? 'bg-white text-[#423a6e] shadow-xs'
                    : 'text-[#6C6775] hover:text-[#1a1c1a]'
                }`}
                id="tab-login"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signup');
                  setErrorMessage(null);
                }}
                className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  authMode === 'signup'
                    ? 'bg-white text-[#423a6e] shadow-xs'
                    : 'text-[#6C6775] hover:text-[#1a1c1a]'
                }`}
                id="tab-signup"
              >
                New Account
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-5 p-3 rounded-2xl bg-[#BA1A1A]/10 border border-[#BA1A1A]/20 flex flex-col gap-2 text-xs text-[#BA1A1A]" id="auth-error-banner">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="flex-1 font-medium">{errorMessage}</p>
              </div>
              {isUnconfirmedEmail && (
                <div className="pl-6.5 pt-1.5 border-t border-[#BA1A1A]/20 flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending}
                    className="text-left font-bold underline hover:opacity-85 cursor-pointer text-[#423a6e]"
                  >
                    {resending ? 'Sending verification link...' : 'Resend verification email'}
                  </button>
                  {resendStatus && (
                    <p className="text-[11px] text-[#48454F] font-normal">{resendStatus}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {authMode === 'signup' && (
              <>
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-[#48454F] mb-1.5" htmlFor="signup-name">
                    Full Name <span className="text-[#BA1A1A]">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#797580] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="signup-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Radhika Devi"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#D0C9D6] text-sm text-[#1a1c1a] placeholder:text-[#9e9aa5] focus:outline-hidden focus:ring-2 focus:ring-[#423a6e]/30 focus:border-[#423a6e]"
                    />
                  </div>
                </div>

                {/* Role Selection */}
                <div>
                  <label className="block text-xs font-bold text-[#48454F] mb-1.5">
                    Select Your Role <span className="text-[#BA1A1A]">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setRole('artisan')}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        role === 'artisan'
                          ? 'border-[#423a6e] bg-[#F4F1F8] ring-2 ring-[#423a6e]/20'
                          : 'border-[#E8E4DF] bg-white hover:bg-[#FAF9F6]'
                      }`}
                      id="role-select-artisan"
                    >
                      <div className="w-8 h-8 rounded-xl bg-[#EDE7F6] text-[#423a6e] flex items-center justify-center mb-2">
                        <Palette className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#1a1c1a]">Artisan / Karigar</p>
                        <p className="text-[10px] text-[#797580] mt-0.5">Sell crafts & studio</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRole('buyer')}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        role === 'buyer'
                          ? 'border-[#6e5d13] bg-[#FBF8EF] ring-2 ring-[#6e5d13]/20'
                          : 'border-[#E8E4DF] bg-white hover:bg-[#FAF9F6]'
                      }`}
                      id="role-select-buyer"
                    >
                      <div className="w-8 h-8 rounded-xl bg-[#F4E39E]/40 text-[#6e5d13] flex items-center justify-center mb-2">
                        <ShoppingBag className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#1a1c1a]">Craft Buyer</p>
                        <p className="text-[10px] text-[#797580] mt-0.5">Retail & B2B orders</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Mobile Phone (Optional) */}
                <div>
                  <label className="block text-xs font-bold text-[#48454F] mb-1.5" htmlFor="signup-phone">
                    Mobile Phone <span className="text-[#797580] font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-[#797580] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="signup-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#D0C9D6] text-sm text-[#1a1c1a] placeholder:text-[#9e9aa5] focus:outline-hidden focus:ring-2 focus:ring-[#423a6e]/30 focus:border-[#423a6e]"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold text-[#48454F] mb-1.5" htmlFor="input-email">
                Email Address <span className="text-[#BA1A1A]">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#797580] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="input-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#D0C9D6] text-sm text-[#1a1c1a] placeholder:text-[#9e9aa5] focus:outline-hidden focus:ring-2 focus:ring-[#423a6e]/30 focus:border-[#423a6e]"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-[#48454F] mb-1.5" htmlFor="input-password">
                Password <span className="text-[#BA1A1A]">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#797580] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="input-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#D0C9D6] text-sm text-[#1a1c1a] placeholder:text-[#9e9aa5] focus:outline-hidden focus:ring-2 focus:ring-[#423a6e]/30 focus:border-[#423a6e]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#797580] hover:text-[#1a1c1a] cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#423a6e] hover:bg-[#342e57] active:scale-[0.99] text-white font-bold text-sm shadow-md transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                id="btn-submit-auth"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>{authMode === 'login' ? 'Sign In' : 'Create Account'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Demo Accounts */}
          {authMode === 'login' && (
            <div className="mt-6 pt-5 border-t border-[#EBE7E4]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#797580] flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#6e5d13]" />
                  Quick Demo Access
                </span>
                <span className="text-[10px] text-[#797580]">Instant 1-Click Fill</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleQuickLogin('artisan.radhika@kalasetu.org', 'KalaSetuArtisan@2026')}
                  className="p-2.5 rounded-xl border border-[#D0C9D6] bg-[#F4F1F8]/60 hover:bg-[#F4F1F8] text-left transition-all cursor-pointer"
                  id="btn-demo-artisan"
                >
                  <p className="text-xs font-bold text-[#423a6e] flex items-center gap-1">
                    <Palette className="w-3 h-3" /> Artisan Demo
                  </p>
                  <p className="text-[10px] text-[#797580] truncate mt-0.5">Radhika Devi</p>
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleQuickLogin('buyer.aarav@kalasetu.org', 'KalaSetuBuyer@2026')}
                  className="p-2.5 rounded-xl border border-[#D0C9D6] bg-[#FBF8EF]/70 hover:bg-[#FBF8EF] text-left transition-all cursor-pointer"
                  id="btn-demo-buyer"
                >
                  <p className="text-xs font-bold text-[#6e5d13] flex items-center gap-1">
                    <ShoppingBag className="w-3 h-3" /> Buyer Demo
                  </p>
                  <p className="text-[10px] text-[#797580] truncate mt-0.5">Aarav Sharma</p>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-4 py-4 text-center text-xs text-[#797580]">
        KalaSetu • Authentic Heritage Commerce Platform powered by Supabase Auth
      </footer>
    </div>
  );
};
