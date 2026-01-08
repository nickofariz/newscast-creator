import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Video, Mail, Lock, Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

// Validation schemas
const emailSchema = z.string().email("Email tidak valid").max(255, "Email terlalu panjang");
const passwordSchema = z.string().min(6, "Password minimal 6 karakter").max(128, "Password terlalu panjang");

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isLoading: authLoading, signIn, signUp, signInWithGoogle, resetPassword } = useAuth();
  
  const [isLogin, setIsLogin] = useState(searchParams.get("mode") !== "signup");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/editor", { replace: true });
    }
  }, [user, navigate]);

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }
    
    if (!showForgotPassword) {
      const passwordResult = passwordSchema.safeParse(password);
      if (!passwordResult.success) {
        newErrors.password = passwordResult.error.errors[0].message;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      if (showForgotPassword) {
        const { error } = await resetPassword(email);
        if (error) {
          toast.error("Gagal mengirim email reset password");
          return;
        }
        toast.success("Link reset password telah dikirim ke email Anda");
        setShowForgotPassword(false);
        return;
      }

      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast.error("Email atau password salah");
          } else if (error.message.includes("Email not confirmed")) {
            toast.error("Email belum dikonfirmasi. Cek inbox Anda.");
          } else {
            toast.error("Gagal masuk. Coba lagi.");
          }
          return;
        }
        toast.success("Berhasil masuk!");
        navigate("/editor", { replace: true });
      } else {
        const { error } = await signUp(email, password);
        if (error) {
          if (error.message.includes("User already registered")) {
            toast.error("Email sudah terdaftar. Silakan login.");
          } else if (error.message.includes("Password")) {
            toast.error("Password tidak memenuhi kriteria keamanan");
          } else {
            toast.error("Gagal mendaftar. Coba lagi.");
          }
          return;
        }
        toast.success("Akun berhasil dibuat! Silakan login.");
        setIsLogin(true);
        setPassword("");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        toast.error("Gagal login dengan Google");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = (loginMode: boolean) => {
    setIsLogin(loginMode);
    setShowForgotPassword(false);
    setErrors({});
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -left-32 w-64 md:w-96 h-64 md:h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-32 w-64 md:w-96 h-64 md:h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      {/* Back to Home */}
      <Link 
        to="/" 
        className="absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors z-10"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">Kembali</span>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl gradient-news flex items-center justify-center shadow-glow">
              <Video className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
            </div>
          </Link>
        </div>

        {/* Folder Tabs - Above the card */}
        {!showForgotPassword && (
          <div className="flex">
            <button
              type="button"
              onClick={() => handleToggle(true)}
              disabled={isSubmitting}
              className={`relative px-6 sm:px-8 py-3 rounded-t-xl font-medium text-sm transition-all ${
                isLogin 
                  ? "bg-card text-foreground z-10 border-t border-l border-r border-border/50" 
                  : "bg-secondary/30 text-muted-foreground hover:text-foreground -mr-2"
              }`}
              style={isLogin ? { marginBottom: "-1px" } : {}}
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={() => handleToggle(false)}
              disabled={isSubmitting}
              className={`relative px-6 sm:px-8 py-3 rounded-t-xl font-medium text-sm transition-all ${
                !isLogin 
                  ? "bg-card text-foreground z-10 border-t border-l border-r border-border/50" 
                  : "bg-secondary/30 text-muted-foreground hover:text-foreground -ml-2"
              }`}
              style={!isLogin ? { marginBottom: "-1px" } : {}}
            >
              Daftar
            </button>
          </div>
        )}

        {/* Form Card */}
        <div className="glass-card rounded-2xl rounded-tl-none p-5 sm:p-6 md:p-8 border border-border/50">
          <AnimatePresence mode="wait">
            <motion.div
              key={showForgotPassword ? "forgot" : isLogin ? "login" : "signup"}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Title inside card */}
              <div className="text-center mb-6">
                <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground mb-1">
                  {showForgotPassword 
                    ? "Reset Password" 
                    : isLogin 
                      ? "Selamat Datang Kembali" 
                      : "Buat Akun Baru"
                  }
                </h1>
                <p className="text-muted-foreground text-sm">
                  {showForgotPassword
                    ? "Masukkan email untuk reset password"
                    : isLogin 
                      ? "Masuk untuk melanjutkan membuat video" 
                      : "Daftar gratis dan mulai buat video berita"
                  }
                </p>
              </div>

              {/* Google Login Button */}
              {!showForgotPassword && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-11 mb-4"
                    onClick={handleGoogleLogin}
                    disabled={isSubmitting}
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Lanjutkan dengan Google
                  </Button>

                  {/* Divider */}
                  <div className="relative my-5">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border/50"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="px-3 bg-card text-muted-foreground">atau dengan email</span>
                    </div>
                  </div>
                </>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="nama@email.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setErrors((prev) => ({ ...prev, email: undefined }));
                      }}
                      className={`pl-10 h-11 ${errors.email ? "border-destructive" : ""}`}
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email}</p>
                  )}
                </div>

                {!showForgotPassword && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      {isLogin && (
                        <button
                          type="button"
                          onClick={() => setShowForgotPassword(true)}
                          className="text-xs text-primary hover:underline"
                        >
                          Lupa password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setErrors((prev) => ({ ...prev, password: undefined }));
                        }}
                        className={`pl-10 pr-10 h-11 ${errors.password ? "border-destructive" : ""}`}
                        disabled={isSubmitting}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-xs text-destructive">{errors.password}</p>
                    )}
                    {!isLogin && (
                      <p className="text-xs text-muted-foreground">Minimal 6 karakter</p>
                    )}
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full h-11 gradient-news text-primary-foreground shadow-glow" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {showForgotPassword ? "Mengirim..." : isLogin ? "Masuk..." : "Mendaftar..."}
                    </>
                  ) : (
                    showForgotPassword ? "Kirim Link Reset" : isLogin ? "Masuk" : "Daftar Sekarang"
                  )}
                </Button>

                {showForgotPassword && (
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(false)}
                    className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Kembali ke login
                  </button>
                )}
              </form>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Dengan melanjutkan, Anda menyetujui{" "}
          <span className="text-foreground">Syarat & Ketentuan</span> dan{" "}
          <span className="text-foreground">Kebijakan Privasi</span> kami.
        </p>
      </motion.div>
    </div>
  );
};

export default Auth;