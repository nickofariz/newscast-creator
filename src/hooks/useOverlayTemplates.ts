import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { OverlaySettings, DEFAULT_OVERLAY_SETTINGS } from "@/components/OverlaySelector";
import { Json } from "@/integrations/supabase/types";

interface OverlayTemplate {
  id: string;
  name: string;
  settings: OverlaySettings;
  is_default: boolean;
  created_at: string;
}

interface UseOverlayTemplatesReturn {
  templates: OverlayTemplate[];
  isLoading: boolean;
  isSaving: boolean;
  fetchTemplates: () => Promise<void>;
  saveTemplate: (name: string, settings: OverlaySettings) => Promise<void>;
  updateTemplate: (id: string, name: string, settings: OverlaySettings) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  setDefaultTemplate: (id: string) => Promise<void>;
  getDefaultTemplate: () => OverlayTemplate | undefined;
}

export const useOverlayTemplates = (): UseOverlayTemplatesReturn => {
  const [templates, setTemplates] = useState<OverlayTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("overlay_templates")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Parse settings from JSONB
      const parsed = (data || []).map((t) => ({
        ...t,
        settings: t.settings as unknown as OverlaySettings,
      }));

      setTemplates(parsed);
    } catch (error) {
      console.error("Error fetching templates:", error);
      toast.error("Gagal memuat template");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveTemplate = useCallback(async (name: string, settings: OverlaySettings) => {
    setIsSaving(true);
    try {
      const { error } = await supabase.from("overlay_templates").insert({
        name,
        settings: settings as unknown as Json,
      });

      if (error) throw error;

      toast.success(`Template "${name}" berhasil disimpan`);
      await fetchTemplates();
    } catch (error) {
      console.error("Error saving template:", error);
      toast.error("Gagal menyimpan template");
    } finally {
      setIsSaving(false);
    }
  }, [fetchTemplates]);

  const updateTemplate = useCallback(async (id: string, name: string, settings: OverlaySettings) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("overlay_templates")
        .update({
          name,
          settings: settings as unknown as Json,
        })
        .eq("id", id);

      if (error) throw error;

      toast.success(`Template "${name}" berhasil diperbarui`);
      await fetchTemplates();
    } catch (error) {
      console.error("Error updating template:", error);
      toast.error("Gagal memperbarui template");
    } finally {
      setIsSaving(false);
    }
  }, [fetchTemplates]);

  const deleteTemplate = useCallback(async (id: string) => {
    try {
      const template = templates.find((t) => t.id === id);
      const { error } = await supabase.from("overlay_templates").delete().eq("id", id);

      if (error) throw error;

      toast.success(`Template "${template?.name}" berhasil dihapus`);
      await fetchTemplates();
    } catch (error) {
      console.error("Error deleting template:", error);
      toast.error("Gagal menghapus template");
    }
  }, [templates, fetchTemplates]);

  const setDefaultTemplate = useCallback(async (id: string) => {
    try {
      // First, unset all defaults
      await supabase
        .from("overlay_templates")
        .update({ is_default: false })
        .eq("is_default", true);

      // Set the new default
      const { error } = await supabase
        .from("overlay_templates")
        .update({ is_default: true })
        .eq("id", id);

      if (error) throw error;

      toast.success("Template default berhasil diubah");
      await fetchTemplates();
    } catch (error) {
      console.error("Error setting default template:", error);
      toast.error("Gagal mengatur template default");
    }
  }, [fetchTemplates]);

  const getDefaultTemplate = useCallback(() => {
    return templates.find((t) => t.is_default);
  }, [templates]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return {
    templates,
    isLoading,
    isSaving,
    fetchTemplates,
    saveTemplate,
    updateTemplate,
    deleteTemplate,
    setDefaultTemplate,
    getDefaultTemplate,
  };
};
