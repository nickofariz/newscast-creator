import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Save, 
  FolderOpen, 
  Trash2, 
  Star, 
  Plus, 
  Check, 
  X,
  Loader2,
  BookMarked
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { OverlaySettings } from "./OverlaySelector";
import { useOverlayTemplates } from "@/hooks/useOverlayTemplates";

interface OverlayTemplateManagerProps {
  currentSettings: OverlaySettings;
  onLoadTemplate: (settings: OverlaySettings) => void;
}

const OverlayTemplateManager = ({
  currentSettings,
  onLoadTemplate,
}: OverlayTemplateManagerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaveMode, setIsSaveMode] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const {
    templates,
    isLoading,
    isSaving,
    saveTemplate,
    updateTemplate,
    deleteTemplate,
    setDefaultTemplate,
  } = useOverlayTemplates();

  const handleSave = async () => {
    if (!newTemplateName.trim()) return;
    await saveTemplate(newTemplateName.trim(), currentSettings);
    setNewTemplateName("");
    setIsSaveMode(false);
  };

  const handleLoad = (settings: OverlaySettings) => {
    onLoadTemplate(settings);
    setIsOpen(false);
  };

  const handleUpdate = async (id: string) => {
    if (!editingName.trim()) return;
    await updateTemplate(id, editingName.trim(), currentSettings);
    setEditingId(null);
    setEditingName("");
  };

  const handleDelete = async (id: string) => {
    await deleteTemplate(id);
  };

  const handleSetDefault = async (id: string) => {
    await setDefaultTemplate(id);
  };

  // Count active overlays for preview
  const getActiveCount = (settings: OverlaySettings) => {
    let count = 0;
    if (settings.headline?.enabled) count++;
    if (settings.logo?.enabled) count++;
    if (settings.credit?.enabled) count++;
    if (settings.frame?.enabled) count++;
    if (settings.breakingNews?.enabled) count++;
    if (settings.lowerThird?.enabled) count++;
    return count;
  };

  return (
    <div className="flex gap-2">
      {/* Save Button */}
      <Dialog open={isOpen && isSaveMode} onOpenChange={(open) => { setIsOpen(open); if (open) setIsSaveMode(true); }}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline">Simpan</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Save className="w-5 h-5 text-primary" />
              Simpan Template
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                Nama Template
              </label>
              <Input
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder="Contoh: Template Berita Pagi"
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsOpen(false)}
              >
                Batal
              </Button>
              <Button
                className="flex-1"
                onClick={handleSave}
                disabled={!newTemplateName.trim() || isSaving}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Simpan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Load Button */}
      <Dialog open={isOpen && !isSaveMode} onOpenChange={(open) => { setIsOpen(open); if (open) setIsSaveMode(false); }}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <FolderOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Muat</span>
            {templates.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-primary/10 text-primary rounded-full">
                {templates.length}
              </span>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookMarked className="w-5 h-5 text-primary" />
              Template Tersimpan
            </DialogTitle>
          </DialogHeader>
          <div className="pt-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-secondary mx-auto mb-3 flex items-center justify-center">
                  <FolderOpen className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Belum ada template tersimpan
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Simpan pengaturan overlay favorit Anda
                </p>
              </div>
            ) : (
              <ScrollArea className="max-h-[400px]">
                <div className="space-y-2 pr-4">
                  <AnimatePresence>
                    {templates.map((template) => (
                      <motion.div
                        key={template.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className={cn(
                          "group p-3 rounded-lg border transition-all",
                          template.is_default
                            ? "border-primary/50 bg-primary/5"
                            : "border-border hover:border-primary/30"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          {/* Preview indicator */}
                          <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-primary">
                              {getActiveCount(template.settings)}
                            </span>
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            {editingId === template.id ? (
                              <div className="flex gap-2">
                                <Input
                                  value={editingName}
                                  onChange={(e) => setEditingName(e.target.value)}
                                  className="h-8 text-sm"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handleUpdate(template.id);
                                    if (e.key === "Escape") setEditingId(null);
                                  }}
                                />
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8"
                                  onClick={() => handleUpdate(template.id)}
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8"
                                  onClick={() => setEditingId(null)}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-sm text-foreground truncate">
                                    {template.name}
                                  </p>
                                  {template.is_default && (
                                    <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {getActiveCount(template.settings)} overlay aktif • {" "}
                                  {new Date(template.created_at).toLocaleDateString("id-ID")}
                                </p>
                              </>
                            )}
                          </div>

                          {/* Actions */}
                          {editingId !== template.id && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => handleLoad(template.settings)}
                                title="Muat template"
                              >
                                <FolderOpen className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => handleSetDefault(template.id)}
                                title="Jadikan default"
                              >
                                <Star className={cn(
                                  "w-4 h-4",
                                  template.is_default && "text-yellow-500 fill-yellow-500"
                                )} />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-destructive"
                                onClick={() => handleDelete(template.id)}
                                title="Hapus template"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </ScrollArea>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OverlayTemplateManager;
