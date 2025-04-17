"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { PdfTheme } from "@/context/ThemeContext";
import { PdfTemplate } from "@/components/pdf/SaveTemplateDialog";

/**
 * Fetch all PDF templates for the current user
 * @returns List of PDF templates
 */
export async function fetchPdfTemplates(): Promise<PdfTemplate[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("Authentication required");
    }
    
    const { data, error } = await supabase
      .from("pdf_templates")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });
    
    if (error) {
      throw error;
    }
    
    return data.map(template => ({
      id: template.id,
      name: template.name,
      description: template.description,
      createdAt: template.created_at,
      updatedAt: template.updated_at,
      themeSettings: template.theme_settings
    }));
  } catch (error) {
    console.error("Error fetching PDF templates:", error);
    throw error;
  }
}

/**
 * Save a PDF template for the current user
 * @param name Template name
 * @param description Optional template description
 * @param themeSettings Theme settings to save
 * @returns The saved template
 */
export async function savePdfTemplate(
  name: string,
  description: string = "",
  themeSettings: Partial<PdfTheme>
): Promise<PdfTemplate> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("Authentication required");
    }
    
    // Check if a template with this name already exists for the user
    const { data: existingTemplate } = await supabase
      .from("pdf_templates")
      .select("id")
      .eq("user_id", user.id)
      .eq("name", name)
      .single();
    
    let result;
    
    if (existingTemplate) {
      // Update existing template
      const { data, error } = await supabase
        .from("pdf_templates")
        .update({
          description,
          theme_settings: themeSettings,
          updated_at: new Date().toISOString()
        })
        .eq("id", existingTemplate.id)
        .select("*")
        .single();
      
      if (error) throw error;
      result = data;
    } else {
      // Create new template
      const { data, error } = await supabase
        .from("pdf_templates")
        .insert({
          user_id: user.id,
          name,
          description,
          theme_settings: themeSettings
        })
        .select("*")
        .single();
      
      if (error) throw error;
      result = data;
    }
    
    return {
      id: result.id,
      name: result.name,
      description: result.description,
      createdAt: result.created_at,
      updatedAt: result.updated_at,
      themeSettings: result.theme_settings
    };
  } catch (error) {
    console.error("Error saving PDF template:", error);
    throw error;
  }
}

/**
 * Delete a PDF template
 * @param templateId ID of the template to delete
 */
export async function deletePdfTemplate(templateId: string): Promise<void> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("Authentication required");
    }
    
    const { error } = await supabase
      .from("pdf_templates")
      .delete()
      .eq("id", templateId)
      .eq("user_id", user.id);
    
    if (error) {
      throw error;
    }
  } catch (error) {
    console.error("Error deleting PDF template:", error);
    throw error;
  }
}

/**
 * Get a single PDF template by ID
 * @param templateId ID of the template to fetch
 * @returns The requested template
 */
export async function getPdfTemplate(templateId: string): Promise<PdfTemplate> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("Authentication required");
    }
    
    const { data, error } = await supabase
      .from("pdf_templates")
      .select("*")
      .eq("id", templateId)
      .eq("user_id", user.id)
      .single();
    
    if (error) {
      throw error;
    }
    
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      themeSettings: data.theme_settings
    };
  } catch (error) {
    console.error("Error fetching PDF template:", error);
    throw error;
  }
} 