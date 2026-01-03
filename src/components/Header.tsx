import { motion } from "framer-motion";
import { Video, Zap } from "lucide-react";

const Header = () => {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/50"
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-news flex items-center justify-center shadow-glow">
            <Video className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg text-foreground">
              Short News
            </h1>
            <p className="text-xs text-muted-foreground -mt-0.5">Video Maker</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 text-xs text-muted-foreground">
            <Zap className="w-3 h-3 text-accent" />
            <span>MVP Version</span>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
