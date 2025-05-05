"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ToolSchema, Field } from "@/lib/ai/gemini";
import { useToast } from "@/hooks/use-toast";
import { Pencil, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface EditConfigurationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tool: ToolSchema;
  onSave: (updatedTool: ToolSchema) => void;
}

export function EditConfigurationDialog({
  open,
  onOpenChange,
  tool,
  onSave,
}: EditConfigurationDialogProps) {
  const [updatedTool, setUpdatedTool] = useState<ToolSchema>(tool);
  const { toast } = useToast();

  useEffect(() => {
    setUpdatedTool(tool);
  }, [tool]);

  const handleFieldChange = (
    fieldIndex: number,
    key: keyof Field,
    value: any
  ) => {
    const newFields = [...updatedTool.fields];
    newFields[fieldIndex] = { ...newFields[fieldIndex], [key]: value };
    setUpdatedTool({ ...updatedTool, fields: newFields });
  };

  const handleSave = async () => {
    try {
      await onSave(updatedTool);
      toast({
        title: "Configuration updated",
        description: "Tool configuration has been successfully updated.",
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Update failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to update configuration.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden">
        <div className="max-h-[75vh] overflow-y-auto pr-2">
          <DialogHeader>
            <DialogTitle>Edit Tool Configuration</DialogTitle>
            <DialogDescription>
              Modify the tool configuration. Changes will be applied to the tool schema.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tool Name</Label>
              <Input
                id="name"
                value={updatedTool.name}
                onChange={(e) =>
                  setUpdatedTool({ ...updatedTool, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={updatedTool.description}
                onChange={(e) =>
                  setUpdatedTool({
                    ...updatedTool,
                    description: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose</Label>
              <Input
                id="purpose"
                value={updatedTool.purpose}
                onChange={(e) =>
                  setUpdatedTool({ ...updatedTool, purpose: e.target.value })
                }
              />
            </div>
            <div>
              <h3 className="font-medium mb-2">Fields</h3>
              {updatedTool.fields.map((field, index) => (
                <div key={field.name} className="border rounded-md p-4 mb-2 bg-muted/10">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{field.name}</h4>
                    <Pencil className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="grid gap-2">
                    <div>
                      <Label htmlFor={`type-${index}`}>Type</Label>
                      <select
                        id={`type-${index}`}
                        value={field.type}
                        onChange={(e) =>
                          handleFieldChange(
                            index,
                            "type",
                            e.target.value as Field["type"]
                          )
                        }
                        className="w-full rounded-md border px-3 py-2 text-sm"
                      >
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                        <option value="date">Date</option>
                        <option value="boolean">Boolean</option>
                        <option value="select">Select</option>
                        <option value="textarea">Textarea</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor={`description-${index}`}>Description</Label>
                      <Input
                        id={`description-${index}`}
                        value={field.description}
                        onChange={(e) =>
                          handleFieldChange(index, "description", e.target.value)
                        }
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`required-${index}`}
                        checked={field.required}
                        onCheckedChange={(checked) =>
                          handleFieldChange(index, "required", !!checked)
                        }
                      />
                      <Label htmlFor={`required-${index}`}>Required</Label>
                    </div>
                    {field.type === "select" && (
                      <div>
                        <Label>Options</Label>
                        <div className="space-y-2">
                          {field.options?.map((option, optIndex) => (
                            <div key={optIndex} className="flex items-center gap-2">
                              <Input
                                value={option}
                                onChange={(e) => {
                                  const newOptions = [...field.options!];
                                  newOptions[optIndex] = e.target.value;
                                  handleFieldChange(index, "options", newOptions);
                                }}
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const newOptions = [...field.options!];
                                  newOptions.splice(optIndex, 1);
                                  handleFieldChange(index, "options", newOptions);
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newOptions = [...(field.options || []), ""];
                              handleFieldChange(index, "options", newOptions);
                            }}
                          >
                            Add Option
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
