import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumn } from "@/components/data-table/columns";
import { Loader2 } from "lucide-react";
import { useSupabase } from "./supabase-provider";
import { Badge } from "@/components/ui/badge";
import { createTool } from "@/lib/supabase/database";
import { chatSession } from "@/lib/ai/gemini";
import { useToast } from "@/hooks/use-toast";
import { ToolSchema } from "@/lib/ai/gemini";
import { Pencil, Trash2, ChartBar, Plus, Download } from "lucide-react";
import { AddDataDialog } from "@/components/data-table/add-data-dialog";

interface ToolPreviewProps {
  tool: ToolSchema;
  onSave: () => Promise<void>;
  isSaving: boolean;
}

interface DashboardConfig {
  type: string;
  title: string;
  description: string;
  configuration: {
    fields: string[];
    layout: {
      title: string;
      [key: string]: any;
    };
  };
}

interface DataTableRow {
  id: number;
  original: Record<string, any>;
}

interface Field {
  name: string;
  type: string;
  description?: string;
  required?: boolean;
  options?: string[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export function ToolPreview({ tool, onSave, isSaving }: ToolPreviewProps) {
  const [tableData, setTableData] = useState<Record<string, any>[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingData, setEditingData] = useState<Record<string, any> | undefined>(undefined);
  const [editableTool, setEditableTool] = useState<ToolSchema>(tool);
  const [dashboardConfig, setDashboardConfig] = useState<DashboardConfig | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { supabase } = useSupabase();
  const { toast } = useToast();

  const visualizationOptions = [
    { value: 'auto', label: 'Auto (Let AI decide)' },
    { value: 'table', label: 'Table' }
  ];

  const generateDashboard = async () => {
    if (tableData.length === 0) {
      toast({
        title: "No data available",
        description: "Please add some sample data before generating a dashboard.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const prompt = `Analyze the following data and suggest the best visualization type based on the user's request:

      Tool Purpose: ${editableTool.purpose}
      Data Fields: ${JSON.stringify(editableTool.fields, null, 2)}
      Sample Data: ${JSON.stringify(tableData, null, 2)}
      
      Please categorize the data based on field types:
      1. Numerical fields: ${editableTool.fields.filter(f => f.type === 'number').map(f => f.name).join(', ') || 'None'}
      2. Categorical fields: ${editableTool.fields.filter(f => f.type === 'text' || f.type === 'select').map(f => f.name).join(', ') || 'None'}
      3. Date fields: ${editableTool.fields.filter(f => f.type === 'date').map(f => f.name).join(', ') || 'None'}
      4. Boolean fields: ${editableTool.fields.filter(f => f.type === 'boolean').map(f => f.name).join(', ') || 'None'}

      Based on this analysis, suggest an appropriate visualization configuration.

      Format the response as JSON with the following structure:
      {
        "type": "visualization_type",
        "title": "chart_title",
        "description": "description",
        "configuration": {
          "fields": [
            // List of fields to use in visualization
          ],
          "layout": {
            // Layout configuration
          }
        }
      }`;

      const result = await chatSession.sendMessage(prompt);
      
      // First log the raw response for debugging
      console.log('Raw AI response:', result.response.text());
      
      // Extract JSON from response
      const responseText = result.response.text();
      const jsonStart = responseText.indexOf('{');
      const jsonEnd = responseText.lastIndexOf('}') + 1;
      
      if (jsonStart === -1 || jsonEnd === 0) {
        throw new Error('AI response did not contain valid JSON');
      }
      
      const jsonString = responseText.substring(jsonStart, jsonEnd);
      const response = JSON.parse(jsonString);
      
      setDashboardConfig(response);
      toast({
        title: "Dashboard generated successfully",
        description: "AI has generated a visualization configuration for your data.",
      });
    } catch (error: any) {
      console.error('Error in dashboard generation:', error);
      toast({
        title: "Generation failed",
        description: error.message || "Failed to parse the AI response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const columns: DataTableColumn[] = [
    ...editableTool.fields.map((field: Field) => ({
      accessorKey: field.name,
      header: field.name.charAt(0).toUpperCase() + field.name.slice(1),
      cell: ({ row }: { row: DataTableRow }) => {
        const value = row.original[field.name];
        if (field.type === "boolean") {
          return value ? "Yes" : "No";
        } else if (field.type === "date" && value) {
          return new Date(value).toLocaleDateString();
        }
        return value;
      },
    })),
    {
      accessorKey: "actions",
      header: "Actions",
      cell: ({ row }: { row: DataTableRow }) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditingData(row.original);
              setIsEditDialogOpen(true);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (confirm("Are you sure you want to delete this record?")) {
                setTableData(tableData.filter((item) => item.id !== row.original.id));
              }
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const handleAddData = (data: Record<string, any>) => {
    setTableData([...tableData, { id: Date.now(), ...data }]);
  };

  const handleEditData = (data: Record<string, any>) => {
    setTableData(tableData.map((item) =>
      item.id === editingData?.id ? { ...item, ...data } : item
    ));
    setEditingData(undefined);
    setIsEditDialogOpen(false);
  };

  const handleExport = () => {
    if (tableData.length === 0) {
      toast({
        title: "No data to export",
        description: "Add some sample data before exporting.",
        variant: "destructive",
      });
      return;
    }

    const dataStr = JSON.stringify(tableData, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    const exportName = `${editableTool.name.toLowerCase().replace(/\s+/g, "-")}-sample-data.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportName);
    linkElement.click();
  };

  return (
    <div className="space-y-6 animate-in fade-in-50">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="text-2xl">{editableTool.name}</CardTitle>
            <CardDescription className="mt-2">{editableTool.description}</CardDescription>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="outline">Custom Tool</Badge>
              <Badge variant="outline">Preview</Badge>
              <Badge variant="outline">{editableTool.fields.length} Fields</Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={generateDashboard}
              disabled={isGenerating || tableData.length === 0}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <ChartBar className="h-4 w-4 mr-2" />
                  Generate Dashboard
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {dashboardConfig && (
            <div className="mb-6 space-y-4 bg-muted/40 p-4 rounded-md">
              <h3 className="text-lg font-medium">AI-Generated Dashboard Configuration</h3>
              <div className="space-y-2">
                <p className="font-medium">Type: {dashboardConfig.type}</p>
                <p className="font-medium">Title: {dashboardConfig.title}</p>
                <p className="text-sm text-muted-foreground">{dashboardConfig.description}</p>
                <div className="mt-4 p-4 bg-muted/20 rounded-md">
                  <pre className="text-sm whitespace-pre-wrap">{JSON.stringify(dashboardConfig.configuration, null, 2)}</pre>
                </div>
              </div>
            </div>
          )}
          <div className="mb-6 space-y-4">
            <div>
              <h3 className="text-lg font-medium">Tool Purpose</h3>
              <p className="text-muted-foreground">{editableTool.purpose}</p>
            </div>
            <div>
              <h3 className="text-lg font-medium">Fields</h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                {editableTool.fields.map((field: Field) => (
                  <li key={field.name} className="flex items-start gap-2 text-sm">
                    <Badge variant="outline" className="h-5 min-w-20 flex items-center justify-center">
                      {field.type}
                    </Badge>
                    <div>
                      <p className="font-medium">{field.name}</p>
                      {field.description && (
                        <p className="text-sm text-muted-foreground">{field.description}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-md border">
            <div className="p-4 bg-muted/40">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Sample Data</h3>
              </div>
            </div>
            <DataTable columns={columns} data={tableData} />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" size="sm" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Sample Item
          </Button>
          <Button variant="secondary" size="sm" onClick={handleExport} disabled={tableData.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export Sample Data
          </Button>
        </CardFooter>
      </Card>

      <AddDataDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        fields={editableTool.fields}
        onSubmit={handleAddData}
      />

      <AddDataDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        fields={editableTool.fields}
        initialData={editingData}
        onSubmit={handleEditData}
      />
    </div>
  );
}
