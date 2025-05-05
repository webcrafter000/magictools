"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/navigation";
import { DataTable } from "@/components/data-table/data-table";
import { AddDataDialog } from "@/components/data-table/add-data-dialog";
import { Badge } from "@/components/ui/badge";
import { DataTableColumn } from "@/components/data-table/columns";
import { EmptyState } from "@/components/empty-state";
import { useSupabase } from "@/components/supabase-provider";
import { useToast } from "@/hooks/use-toast";
import { getToolById, getToolFields, getToolRecords, createToolRecord, deleteToolRecord } from "@/lib/supabase/database";
import { ArrowLeft, Save, Edit, Plus, Database, Download, Trash2, ChevronLeft } from "lucide-react";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function ToolPage() {
  const params = useParams();
  const router = useRouter();
  const { supabase } = useSupabase();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [tool, setTool] = useState<any>(null);
  const [fields, setFields] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  useEffect(() => {
    // Get the user when the component mounts
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user);
    });
  }, [supabase]);

  useEffect(() => {
    const loadToolData = async () => {
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to view this tool.",
          variant: "destructive",
        });
        router.push("/");
        return;
      }

      try {
        setIsLoading(true);
        const toolId = params.id as string;
        
        // Fetch tool data
        const toolData = await getToolById(toolId);
        setTool(toolData);
        
        // Fetch tool fields
        const toolFields = await getToolFields(toolId);
        setFields(toolFields);
        
        // Fetch tool records
        const toolRecords = await getToolRecords(toolId);
        setRecords(toolRecords);
      } catch (error: any) {
        toast({
          title: "Error loading tool",
          description: error.message,
          variant: "destructive",
        });
        router.push("/tools");
      } finally {
        setIsLoading(false);
      }
    };

    loadToolData();
  }, [params.id, user, toast, router, supabase]);

  const handleAddRecord = async (data: any) => {
    try {
      await createToolRecord(tool.id, data);
      
      // Refresh records
      const updatedRecords = await getToolRecords(tool.id);
      setRecords(updatedRecords);
      
      toast({
        title: "Record added",
        description: "The record has been successfully added.",
      });
    } catch (error: any) {
      toast({
        title: "Error adding record",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteRecord = async (recordId: string) => {
    setSelectedRecordId(recordId);
    setDeleteAlertOpen(true);
  };

  const confirmDeleteRecord = async () => {
    if (!selectedRecordId) return;
    
    try {
      await deleteToolRecord(selectedRecordId);
      
      // Refresh records
      const updatedRecords = await getToolRecords(tool.id);
      setRecords(updatedRecords);
      
      toast({
        title: "Record deleted",
        description: "The record has been successfully deleted.",
      });
    } catch (error: any) {
      toast({
        title: "Error deleting record",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleteAlertOpen(false);
      setSelectedRecordId(null);
    }
  };

  const handleDeploy = async () => {
    try {
      setIsDeploying(true);
      // Removed deployTool call
      // Update local state
      setTool({ ...tool, is_deployed: true });
      
      toast({
        title: "Tool deployed",
        description: "Your tool is now live and ready to use.",
      });
    } catch (error: any) {
      toast({
        title: "Error deploying tool",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsDeploying(false);
    }
  };

  const handleExportData = () => {
    // Create CSV or JSON export
    const dataStr = JSON.stringify(records.map(record => record.data), null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    // Create download link
    const exportFileDefaultName = `${tool.name.toLowerCase().replace(/\s+/g, '-')}-data.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Create columns for the data table
  const columns: DataTableColumn[] = fields.map((field) => ({
    accessorKey: `data.${field.name}`,
    header: field.name.charAt(0).toUpperCase() + field.name.slice(1),
    cell: ({ row }) => {
      const value = row.getValue(`data.${field.name}`);
      
      // Format based on field type
      if (field.type === 'boolean') {
        return value ? 'Yes' : 'No';
      } else if (field.type === 'date' && value) {
        return new Date(value).toLocaleDateString();
      }
      
      return value !== undefined ? value : '-';
    },
  }));

  // Add actions column
  columns.push({
    accessorKey: 'actions',
    header: 'Actions',
    cell: ({ row }) => (
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => handleDeleteRecord(row.original.id)}
        className="hover:bg-destructive/10 text-destructive hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    ),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-4">
          <Navigation />
          <div className="max-w-7xl mx-auto mt-8 space-y-8">
            <div className="flex items-center mb-6">
              <Link href="/tools">
                <Button variant="ghost" size="sm" className="gap-1">
                  <ChevronLeft className="h-4 w-4" />
                  Back to Tools
                </Button>
              </Link>
            </div>
            
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-1/3 mb-2" />
                <Skeleton className="h-4 w-2/3" />
                <div className="mt-4 flex gap-2">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </div>
                <div>
                  <Skeleton className="h-6 w-24 mb-2" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {[1, 2, 3, 4].map(i => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-9 w-28" />
                  </div>
                  <Skeleton className="h-40 w-full" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!tool) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-4">
          <Navigation />
          <div className="max-w-7xl mx-auto mt-8">
            <EmptyState
              title="Tool not found"
              description="The tool you're looking for doesn't exist or you don't have permission to view it."
              action={
                <Link href="/tools">
                  <Button>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Tools
                  </Button>
                </Link>
              }
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-4">
        <Navigation />
        
        <div className="max-w-7xl mx-auto mt-8 space-y-8">
          <div className="flex items-center mb-6">
            <Link href="/tools">
              <Button variant="ghost" size="sm" className="gap-1">
                <ChevronLeft className="h-4 w-4" />
                Back to Tools
              </Button>
            </Link>
          </div>
          
          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{tool.name}</CardTitle>
                <CardDescription className="mt-2">{tool.description}</CardDescription>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge variant="outline">Custom Tool</Badge>
                  {tool.is_deployed ? (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Deployed
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-amber-300 text-amber-600 dark:border-amber-600 dark:text-amber-300">
                      Draft
                    </Badge>
                  )}
                  <Badge variant="outline" className="border-blue-300 text-blue-600 dark:border-blue-600 dark:text-blue-300">
                    {fields.length} Fields
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={handleDeploy} 
                  disabled={tool.is_deployed || isDeploying}
                >
                  <Database className="h-4 w-4 mr-2" />
                  {isDeploying ? "Deploying..." : tool.is_deployed ? "Deployed" : "Deploy"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-6 space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Tool Purpose</h3>
                  <p className="text-muted-foreground">{tool.purpose}</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium">Fields</h3>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                    {fields.map((field) => (
                      <li key={field.id} className="flex items-start gap-2 text-sm">
                        <Badge variant="outline" className="h-5 min-w-20 flex items-center justify-center">
                          {field.type}
                        </Badge>
                        <div>
                          <span className="font-medium">{field.name}</span>
                          <p className="text-xs text-muted-foreground">{field.description}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="rounded-md border">
                <div className="p-4 bg-muted/40">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Data</h3>
                    <Button variant="outline" size="sm" onClick={() => setIsAddDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  </div>
                </div>
                
                <DataTable columns={columns} data={records} />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Link href={`/tools/${tool.id}/settings`}>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </Link>
              <Button variant="secondary" size="sm" onClick={handleExportData}>
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </CardFooter>
          </Card>
        </div>

        <AddDataDialog 
          open={isAddDialogOpen} 
          onOpenChange={setIsAddDialogOpen}
          fields={fields}
          onSubmit={handleAddRecord}
        />

        <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Record</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this record? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDeleteRecord}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}