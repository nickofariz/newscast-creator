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
  const { user, isLoading: authLoading, signIn, signUp } = useAuth();
  
  const [isLogin, setIsLogin] = useState(searchParams.get("mode") !== "signup");
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
    
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
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

  const handleToggle = (loginMode: boolean) => {
    setIsLogin(loginMode);
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
        className="absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
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
        <div className="text-center mb-6 sm:mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4 sm:mb-6">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl gradient-news flex items-center justify-center shadow-glow">
              <Video className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
            </div>
          </Link>
          <AnimatePresence mode="wait">
            <motion.div
              key={isLogin ? "login" : "signup"}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-2">
                {isLogin ? "Selamat Datang Kembali" : "Buat Akun Baru"}
              </h1>
              <p className="text-muted-foreground text-sm">
                {isLogin 
                  ? "Masuk untuk melanjutkan membuat video" 
                  : "Daftar gratis dan mulai buat video berita"
                }
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Form Card */}
        <div className="glass-card rounded-2xl p-5 sm:p-6 md:p-8 border border-border/50">
          {/* Toggle Tabs */}
          <div className="flex p-1 bg-secondary/50 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => handleToggle(true)}
              disabled={isSubmitting}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                isLogin 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={() => handleToggle(false)}
              disabled={isSubmitting}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                !isLogin 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Daftar
            </button>
          </div>

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

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
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

            <Button 
              type="submit" 
              className="w-full h-11 gradient-news text-primary-foreground shadow-glow" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isLogin ? "Masuk..." : "Mendaftar..."}
                </>
              ) : (
                isLogin ? "Masuk" : "Daftar Sekarang"
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/50"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-card text-muted-foreground">atau</span>
            </div>
          </div>

          {/* Alternative action */}
          <p className="text-center text-sm text-muted-foreground">
            {isLogin ? (
              <>
                Belum punya akun?{" "}
                <button
                  type="button"
                  onClick={() => handleToggle(false)}
                  className="text-primary hover:underline font-medium"
                  disabled={isSubmitting}
                >
                  Daftar gratis
                </button>
              </>
            ) : (
              <>
                Sudah punya akun?{" "}
                <button
                  type="button"
                  onClick={() => handleToggle(true)}
                  className="text-primary hover:underline font-medium"
                  disabled={isSubmitting}
                >
                  Masuk
                </button>
              </>
            )}
          </p>
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