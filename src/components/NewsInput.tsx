import { motion } from "framer-motion";
import { FileText, AlertCircle } from "lucide-react";

interface NewsInputProps {
  value: string;
  onChange: (value: string) => void;
}

const NewsInput = ({ value, onChange }: NewsInputProps) => {
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const charCount = value.length;
  const maxChars = 1500;
  const isOverLimit = charCount > maxChars;

  const estimatedDuration = Math.round((wordCount / 150) * 60); // ~150 words per minute

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="space-y-3"
    >
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm font-medium text-foreground">
          <FileText className="w-4 h-4 text-primary" />
          Teks Berita
        </label>
        <div className="flex items-center gap-3 text-xs">
          <span className={`${isOverLimit ? 'text-destructive' : 'text-muted-foreground'}`}>
            {charCount}/{maxChars}
          </span>
          {wordCount > 0 && (
            <span className="text-muted-foreground">
              ~{estimatedDuration}s video
            </span>
          )}
        </div>
      </div>

      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Masukkan teks berita Anda di sini...

Contoh:
Breaking news hari ini, pemerintah mengumumkan kebijakan baru terkait ekonomi digital.

Kebijakan ini diharapkan dapat meningkatkan pertumbuhan ekonomi nasional hingga 5% dalam dua tahun ke depan.

Menteri terkait menyatakan bahwa implementasi akan dimulai pada awal tahun depan."
          className={`w-full min-h-[200px] p-4 rounded-xl bg-card border-2 transition-all duration-300 text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:border-primary focus:shadow-glow ${
            isOverLimit ? 'border-destructive' : 'border-border'
          }`}
        />
        
        {isOverLimit && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute -bottom-6 left-0 flex items-center gap-1 text-xs text-destructive"
          >
            <AlertCircle className="w-3 h-3" />
            <span>Teks terlalu panjang, maksimal {maxChars} karakter</span>
          </motion.div>
        )}
      </div>

      {wordCount > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-wrap gap-2 text-xs text-muted-foreground"
        >
          <span className="px-2 py-1 rounded-md bg-secondary">{wordCount} kata</span>
          <span className="px-2 py-1 rounded-md bg-secondary">~{Math.ceil(wordCount / 50)} paragraf</span>
        </motion.div>
      )}
    </motion.div>
  );
};

export default NewsInput;
