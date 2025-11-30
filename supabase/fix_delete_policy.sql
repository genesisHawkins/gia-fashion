-- Fix: Add DELETE policy for outfit_logs table
-- This allows users to delete their own outfit history

-- Add DELETE policy for outfit_logs
CREATE POLICY "Users can delete own outfit logs" ON public.outfit_logs
  FOR DELETE USING (auth.uid() = user_id);

-- Verify the policy was created
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'outfit_logs'
ORDER BY policyname;
