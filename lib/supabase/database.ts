import { createClient } from '@/lib/supabase/client';
import { type ToolSchema, type Field } from '@/lib/ai/gemini';

// Define types for database entities
export interface Tool {
  id: string;
  name: string;
  description: string;
  purpose: string;
  created_at: string;
  updated_at: string;
  is_deployed: boolean;
  field_count: number;
  record_count: number;
  source_directory: string;
  destination_directory: string;
  date_format: string;
  location_tagging_enabled: boolean;
  date_tagging_enabled: boolean;
  custom_tags: string;
  tool_fields?: ToolField[];
  tool_records?: ToolRecord[];
}

export interface ToolField {
  id: string;
  tool_id: string;
  name: string;
  type: string;
  description: string;
  required: boolean;
  options: string[];
  created_at: string;
}

export interface ToolRecord {
  id: string;
  tool_id: string;
  data: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Tool operations
export async function createTool(toolSchema: ToolSchema, userId: string): Promise<string> {
  const supabase = createClient();
  
  // Create the tool
  const { data: tool, error: toolError } = await supabase
    .from('tools')
    .insert({
      name: toolSchema.name,
      description: toolSchema.description,
      purpose: toolSchema.purpose,
      is_deployed: false,
      user_id: userId
    })
    .select('id')
    .single();

  if (toolError) throw new Error(`Failed to create tool: ${toolError.message}`);
  
  // Create the fields
  const fields = toolSchema.fields.map(field => ({
    tool_id: tool.id,
    name: field.name,
    type: field.type,
    description: field.description,
    required: field.required || false,
    options: field.options || []
  }));

  const { error: fieldsError } = await supabase
    .from('tool_fields')
    .insert(fields);

  if (fieldsError) throw new Error(`Failed to create tool fields: ${fieldsError.message}`);
  
  return tool.id as string; // Type assertion to string
}

export async function getUserTools(userId: string): Promise<Tool[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('tools')
    .select(`
      *,
      tool_fields,
      tool_records
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch tools: ${error.message}`);
  if (!data) return [];

  // Ensure to map all fields required by the Tool interface
  return data.map((tool: any) => ({
    id: tool.id as string, // Type assertion to string
    name: tool.name as string, // Type assertion to string
    description: tool.description as string, // Type assertion to string
    purpose: tool.purpose as string, // Type assertion to string
    created_at: tool.created_at as string, // Type assertion to string
    updated_at: tool.updated_at as string, // Type assertion to string
    is_deployed: tool.is_deployed,
    // Add null checks for length
    field_count: Array.isArray(tool.tool_fields) ? tool.tool_fields.length : 0,
    record_count: Array.isArray(tool.tool_records) ? tool.tool_records.length : 0,
    source_directory: tool.source_directory as string, // Type assertion to string
    destination_directory: tool.destination_directory as string, // Type assertion to string
    date_format: tool.date_format as string, // Type assertion to string
    location_tagging_enabled: tool.location_tagging_enabled,
    date_tagging_enabled: tool.date_tagging_enabled,
    custom_tags: tool.custom_tags as string, // Type assertion to string
    tool_fields: tool.tool_fields,
    tool_records: tool.tool_records
  })) as Tool[];
}

export async function getToolById(toolId: string): Promise<Tool> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('tools')
    .select(`
      *,
      tool_fields,
      tool_records
    `)
    .eq('id', toolId)
    .single();

  if (error) throw new Error(`Failed to fetch tool: ${error.message}`);
  if (!data) throw new Error('Tool not found');

  return {
    id: data.id as string, // Type assertion to string
    name: data.name as string, // Type assertion to string
    description: data.description as string, // Type assertion to string
    purpose: data.purpose as string, // Type assertion to string
    created_at: data.created_at as string, // Type assertion to string
    updated_at: data.updated_at as string, // Type assertion to string
    is_deployed: data.is_deployed,
    // Add null checks for length
    field_count: Array.isArray(data.tool_fields) ? data.tool_fields.length : 0,
    record_count: Array.isArray(data.tool_records) ? data.tool_records.length : 0,
    source_directory: data.source_directory as string, // Type assertion to string
    destination_directory: data.destination_directory as string, // Type assertion to string
    date_format: data.date_format as string, // Type assertion to string
    location_tagging_enabled: data.location_tagging_enabled,
    date_tagging_enabled: data.date_tagging_enabled,
    custom_tags: data.custom_tags as string, // Type assertion to string
    tool_fields: data.tool_fields,
    tool_records: data.tool_records
  } as Tool;
}

export async function getToolFields(toolId: string): Promise<Field[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('tool_fields')
    .select('*')
    .eq('tool_id', toolId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(`Failed to fetch tool fields: ${error.message}`);
  if (!data) return [];

  return data.map((field: any) => ({
    id: field.id as string, // Type assertion to string
    tool_id: field.tool_id as string, // Type assertion to string
    name: field.name as string, // Type assertion to string
    type: field.type as string, // Type assertion to string
    description: field.description as string, // Type assertion to string
    required: field.required,
    options: field.options,
    created_at: field.created_at as string // Type assertion to string
  })) as Field[];
}

export async function getToolRecords(toolId: string): Promise<ToolRecord[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('tool_records')
    .select('*')
    .eq('tool_id', toolId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch tool records: ${error.message}`);
  if (!data) return [];

  return data.map((record: any) => ({
    id: record.id as string, // Type assertion to string
    tool_id: record.tool_id as string, // Type assertion to string
    data: record.data,
    created_at: record.created_at as string, // Type assertion to string
    updated_at: record.updated_at as string // Type assertion to string
  })) as ToolRecord[];
}

export async function createToolRecord(toolId: string, recordData: Record<string, any>): Promise<string> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('tool_records')
    .insert({
      tool_id: toolId,
      data: recordData
    })
    .select('id')
    .single();

  if (error) throw new Error(`Failed to create record: ${error.message}`);
  if (!data) throw new Error('Record creation failed');

  return data.id as string; // Type assertion to string
}

export async function updateToolRecord(recordId: string, recordData: Record<string, any>): Promise<void> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('tool_records')
    .update({
      data: recordData
    })
    .eq('id', recordId);

  if (error) throw new Error(`Failed to update record: ${error.message}`);
}

export async function deleteToolRecord(recordId: string): Promise<void> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('tool_records')
    .delete()
    .eq('id', recordId);

  if (error) throw new Error(`Failed to delete tool record: ${error.message}`);
}

// SQL execution function (assuming you have a schema management function)
export async function executeSQL(sql: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.rpc('execute_sql', { sql });

  if (error) throw new Error(`Failed to execute SQL: ${error.message}`);
}
