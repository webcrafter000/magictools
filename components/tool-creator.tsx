"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Wand2, Loader2 } from "lucide-react";
import { generateToolSchema } from "@/lib/ai/gemini";
import { useToast } from "@/hooks/use-toast";
import { ToolPreview } from "@/components/tool-preview";
import { useSupabase } from "./supabase-provider";
import { useRouter } from "next/navigation";
import type { ToolSchema } from "@/lib/ai/gemini";
import { createTool } from "@/lib/supabase/database";

export default function ToolCreator() {
  const [description, setDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generatedTool, setGeneratedTool] = useState<ToolSchema | null>(null);
  const { toast } = useToast();
  const { user } = useSupabase();
  const router = useRouter();

  const handleGenerateTool = async () => {
    if (!description.trim()) {
      toast({
        title: "Description required",
        description: "Please provide a description of the tool you want to create.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const tool = await generateToolSchema(description);
      setGeneratedTool(tool);
      toast({
        title: "Tool generated!",
        description: "Your custom tool has been created successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate tool. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveTool = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to save your tool.",
        variant: "destructive",
      });
      return;
    }

    if (!generatedTool) return;

    setIsSaving(true);

    try {
      const toolId = await createTool(generatedTool, user.id);
      
      toast({
        title: "Tool saved!",
        description: "Your tool has been saved to your account.",
      });
      
      // Navigate to the tool page
      router.push(`/tools/${toolId}`);
    } catch (error: any) {
      toast({
        title: "Save failed",
        description: error.message || "Failed to save tool. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8 mb-16">
      <Card className="border-2 border-primary/10">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-semibold">Describe your tool</h2>
              <p className="text-muted-foreground">
                Tell us what kind of tool you need, and we'll create it for you.
              </p>
            </div>
            <Textarea
              placeholder="Example: I want a tool to track package deliveries for my drivers. Or: I need a system to record customer complaints and sort them by urgency."
              className="min-h-[120px] resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="flex justify-end">
              <Button
                onClick={handleGenerateTool}
                disabled={isGenerating || !description.trim()}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generate Tool
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {generatedTool && (
        <ToolPreview 
          tool={generatedTool} 
          onSave={handleSaveTool} 
          isSaving={isSaving} 
        />
      )}
    </div>
  );
}