/*
  # Create Tools Database Schema

  1. New Tables
    - `tools`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `purpose` (text)
      - `user_id` (uuid, references auth.users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `is_deployed` (boolean)
    - `tool_fields`
      - `id` (uuid, primary key)
      - `tool_id` (uuid, references tools)
      - `name` (text)
      - `type` (text)
      - `description` (text)
      - `required` (boolean)
      - `options` (text array, for select fields)
      - `created_at` (timestamp)
    - `tool_records`
      - `id` (uuid, primary key)
      - `tool_id` (uuid, references tools)
      - `data` (jsonb, to store record data)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. Security
    - Enable RLS on all tables
    - Add policies for users to manage their own data
*/

-- Create tools table
CREATE TABLE IF NOT EXISTS tools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  purpose text,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_deployed boolean DEFAULT false
);

-- Create tool_fields table
CREATE TABLE IF NOT EXISTS tool_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id uuid REFERENCES tools(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  type text NOT NULL,
  description text,
  required boolean DEFAULT false,
  options text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create tool_records table
CREATE TABLE IF NOT EXISTS tool_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id uuid REFERENCES tools(id) ON DELETE CASCADE NOT NULL,
  data jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_records ENABLE ROW LEVEL SECURITY;

-- Create policies for tools table
CREATE POLICY "Users can create their own tools"
  ON tools FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own tools"
  ON tools FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own tools"
  ON tools FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tools"
  ON tools FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for tool_fields table
CREATE POLICY "Users can create fields for their tools"
  ON tool_fields FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM tools 
    WHERE tools.id = tool_id 
    AND tools.user_id = auth.uid()
  ));

CREATE POLICY "Users can view fields for their tools"
  ON tool_fields FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM tools 
    WHERE tools.id = tool_id 
    AND tools.user_id = auth.uid()
  ));

CREATE POLICY "Users can update fields for their tools"
  ON tool_fields FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM tools 
    WHERE tools.id = tool_id 
    AND tools.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete fields for their tools"
  ON tool_fields FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM tools 
    WHERE tools.id = tool_id 
    AND tools.user_id = auth.uid()
  ));

-- Create policies for tool_records table
CREATE POLICY "Users can create records for their tools"
  ON tool_records FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM tools 
    WHERE tools.id = tool_id 
    AND tools.user_id = auth.uid()
  ));

CREATE POLICY "Users can view records for their tools"
  ON tool_records FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM tools 
    WHERE tools.id = tool_id 
    AND tools.user_id = auth.uid()
  ));

CREATE POLICY "Users can update records for their tools"
  ON tool_records FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM tools 
    WHERE tools.id = tool_id 
    AND tools.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete records for their tools"
  ON tool_records FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM tools 
    WHERE tools.id = tool_id 
    AND tools.user_id = auth.uid()
  ));

-- Create functions to manage updated_at
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update timestamps
CREATE TRIGGER set_tools_updated_at
BEFORE UPDATE ON tools
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER set_tool_records_updated_at
BEFORE UPDATE ON tool_records
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();