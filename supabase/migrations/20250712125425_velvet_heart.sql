```diff
--- a/supabase/migrations/20250617221542_curly_trail.sql
+++ b/supabase/migrations/20250617221542_curly_trail.sql
@@ -140,23 +140,44 @@
 
 -- Function to update poll vote counts
 CREATE OR REPLACE FUNCTION update_poll_vote_counts()
-RETURNS trigger AS $$
+RETURNS trigger AS $$ 
+DECLARE
+  v_poll_id UUID;
+  v_vote_option INTEGER;
+  v_current_options JSONB;
+  v_total_votes INTEGER;
 BEGIN
-  -- Update the poll's options array and total_votes
+  IF TG_OP = 'INSERT' THEN
+    v_poll_id := NEW.poll_id;
+    v_vote_option := NEW.vote_option;
+  ELSIF TG_OP = 'DELETE' THEN
+    v_poll_id := OLD.poll_id;
+    v_vote_option := OLD.vote_option;
+  ELSE
+    -- Should not happen with current trigger definition
+    RETURN NULL;
+  END IF;
+
+  -- Fetch current poll state
+  SELECT options, total_votes INTO v_current_options, v_total_votes
+  FROM polls
+  WHERE id = v_poll_id;
+
+  -- Update options array and total_votes based on operation
+  IF TG_OP = 'INSERT' THEN
+    v_current_options := jsonb_set(
+      v_current_options,
+      ARRAY[v_vote_option::text, 'votes'],
+      ((v_current_options -> v_vote_option ->> 'votes')::int + 1)::text::jsonb
+    );
+    v_total_votes := v_total_votes + 1;
+  ELSIF TG_OP = 'DELETE' THEN
+    v_current_options := jsonb_set(
+      v_current_options,
+      ARRAY[v_vote_option::text, 'votes'],
+      ((v_current_options -> v_vote_option ->> 'votes')::int - 1)::text::jsonb
+    );
+    v_total_votes := v_total_votes - 1;
+  END IF;
+
+  -- Update the polls table
   UPDATE polls 
   SET 
-    total_votes = (
-      SELECT COUNT(*) 
-      FROM poll_votes 
-      WHERE poll_id = COALESCE(NEW.poll_id, OLD.poll_id)
-    ),
+    options = v_current_options,
+    total_votes = v_total_votes,
     updated_at = now()
-  WHERE id = COALESCE(NEW.poll_id, OLD.poll_id);
+  WHERE id = v_poll_id;
   
   RETURN COALESCE(NEW, OLD);
 END;
 $$ LANGUAGE plpgsql;
 
 -- Create trigger to update vote counts
```