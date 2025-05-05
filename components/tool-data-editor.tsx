"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tool, ToolField, ToolRecord } from "@/lib/supabase/database";
import { useToast } from "@/hooks/use-toast";
import { useSupabase } from "./supabase-provider";

interface ToolDataEditorProps {
  tool: Tool;
  fields: ToolField[];
  onClose: () => void;
  record?: ToolRecord | null; // Optional record for editing
}

export function ToolDataEditor({ tool, fields, onClose, record }: ToolDataEditorProps) {
  const { supabase } = useSupabase();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Initialize form data with either existing record or empty values
    if (record) {
      setFormData(record.data);
    } else {
      fields.forEach(field => {
        setFormData(prev => ({
          ...prev,
          [field.name]: ''
        }));
      });
    }
  }, [fields, record]);

  const handleChange = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleSubmit = async () => {
    if (loading) return;

    setLoading(true);
    try {
      if (record) {
        // Update existing record
        const { error } = await supabase
          .from('tool_records')
          .update({
            data: formData
          })
          .eq('id', record.id);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Data entry updated successfully"
        });
      } else {
        // Create new record
        const { error } = await supabase
          .from('tool_records')
          .insert([
            {
              tool_id: tool.id,
              data: formData
            }
          ]);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Data entry saved successfully"
        });
      }

      // Reset form and close editor
      setFormData({});
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save data entry",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{record ? "Edit Data Entry" : "Add Data Entry"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
          {fields.map((field) => (
            <div key={field.id} className="space-y-2">
              <label className="text-sm font-medium">{field.name}</label>
              <Input
                value={formData[field.name]}
                onChange={(e) => handleChange(field.name, e.target.value)}
                placeholder={field.description}
                disabled={loading}
              />
              {field.description && (
                <p className="text-sm text-muted-foreground">{field.description}</p>
              )}
            </div>
          ))}
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Saving..." : record ? "Update Entry" : "Save Entry"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}