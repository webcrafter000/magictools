"use client";

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { createClient, createSchemaClient, executeSQL } from '@/lib/supabase/client'; // Use your own client wrapper

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY!;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
};

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

export const chatSession = model.startChat({
  generationConfig,
  safetySettings,
});

export type Field = {
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'textarea';
  description: string;
  required?: boolean;
  options?: string[]; // For select fields only
};

export type ToolSchema = {
  name: string;
  description: string;
  purpose: string;
  fields: Field[];
  sqlSchema: string;
};

export const generateToolSchema = async (prompt: string): Promise<ToolSchema> => {
  try {
    const result = await chatSession.sendMessage(`
      Generate a tool schema and SQL schema for Supabase based on this description: "${prompt}"
      
      Respond ONLY with a JSON object that includes:
      1. name: A concise, professional name for the tool
      2. description: A brief description of what the tool does
      3. purpose: The main purpose of the tool
      4. fields: An array of field objects, each with:
         - name: The field name (snake_case)
         - type: Field type (text, number, date, boolean, select, textarea)
         - description: What this field represents
         - required: Whether required (boolean)
         - options: For select fields only, an array of strings
      5. sqlSchema: A valid Supabase SQL schema with proper types and constraints.
      
      Do NOT include any Markdown or explanation. Only raw JSON output.
    `);

    const rawText = result.response.text();

    // Clean up possible Markdown wrappers like ```json
    const cleanedText = rawText.replace(/```json|```/g, '').trim();

    const toolSchema: ToolSchema = JSON.parse(cleanedText);

    if (!toolSchema.name || !toolSchema.description || !toolSchema.purpose || !toolSchema.fields || !toolSchema.sqlSchema) {
      throw new Error('Incomplete schema returned from Gemini.');
    }

    // Execute SQL schema in Supabase
    await executeSQL(toolSchema.sqlSchema);

    // Use regular client for other operations
    const supabase = createClient();
    
    return toolSchema;

  } catch (error: any) {
    console.error("Error generating tool schema:", error);
    throw new Error(`Error generating tool schema: ${error.message}`);
  }
};
