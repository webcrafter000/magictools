"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, Search, Loader2 } from "lucide-react";
import { useSupabase } from "@/components/supabase-provider";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Navigation } from "@/components/navigation";
import { EmptyState } from "@/components/empty-state";
import { getUserTools } from "@/lib/supabase/database";
import { Skeleton } from "@/components/ui/skeleton";

export default function ToolsPage() {
  const [tools, setTools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { 
    user, isLoading } = useSupabase();
  const { toast } = useToast();

  useEffect(() => {
    const fetchTools = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      
      try {
        const userTools = await getUserTools(user.id);
        setTools(userTools);
      } catch (error: any) {
        toast({
          title: "Failed to load tools",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (!isLoading) {
      fetchTools();
    }
  }, [isLoading, user, toast]);

  const filteredTools = tools.filter(tool => 
    tool.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    tool.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-4">
        <Navigation />
        
        <div className="max-w-7xl mx-auto mt-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold">My Tools</h1>
              <p className="text-muted-foreground">Manage and access your generated tools</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tools..."
                  className="pl-10 w-full sm:w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Link href="/">
                <Button className="w-full sm:w-auto">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create New Tool
                </Button>
              </Link>
            </div>
          </div>
          
          {!user ? (
            <EmptyState
              title="Sign in to access your tools"
              description="Create an account or sign in to start creating and managing your tools"
              action={<Button>Sign In</Button>}
            />
          ) : loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((index) => (
                <Card key={index} className="animate-pulse">
                  <CardHeader className="h-24 bg-muted/40">
                    <Skeleton className="h-6 w-2/3" />
                    <Skeleton className="h-4 w-full mt-2" />
                  </CardHeader>
                  <CardContent className="space-y-2 pt-4">
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </CardContent>
                  <CardFooter className="h-12 bg-muted/20 border-t justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-16" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : filteredTools.length === 0 ? (
            <EmptyState
              title="No tools found"
              description={searchQuery ? "No tools match your search" : "Start by creating your first tool"}
              action={
                <Link href="/">
                  <Button>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create New Tool
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTools.map((tool) => (
                <Link href={`/tools/${tool.id}`} key={tool.id} className="group">
                  <Card className="h-full transition-all border-border/40 hover:border-primary/30 hover:shadow-md">
                    <CardHeader>
                      <CardTitle>{tool.name}</CardTitle>
                      <CardDescription>{tool.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{tool.field_count} fields</span>
                        <span>{tool.record_count} records</span>
                      </div>
                    </CardContent>
                    <CardFooter className="border-t bg-muted/20 flex justify-between">
                      <span className="text-xs text-muted-foreground">
                        Created {new Date(tool.created_at).toLocaleDateString()}
                      </span>
                      <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        Open
                      </Button>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}