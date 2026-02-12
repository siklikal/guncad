-- Create atomic increment/decrement functions for likes
-- These functions use upsert to avoid race conditions and are much faster

CREATE OR REPLACE FUNCTION increment_likes(p_project_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO project_stats (project_id, base_views, base_likes, our_views, our_likes, our_downloads)
  VALUES (p_project_id, 0, 0, 0, 1, 0)
  ON CONFLICT (project_id)
  DO UPDATE SET
    our_likes = project_stats.our_likes + 1,
    updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION decrement_likes(p_project_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE project_stats
  SET
    our_likes = GREATEST(0, our_likes - 1),
    updated_at = now()
  WHERE project_id = p_project_id;
END;
$$;
