-- Wyszukiwanie hybrydowe wpisów: ramię wektorowe (pgvector, cosine <=>) +
-- ramię tekstowe (ILIKE), scalone metodą Reciprocal Rank Fusion (RRF, k=60).
-- SECURITY INVOKER: działa z RLS (anon + JWT → auth.uid()) oraz z kluczem
-- serwisowym (p_user_id podany jawnie).
CREATE OR REPLACE FUNCTION public.match_entries_hybrid(
  p_user_id     uuid    DEFAULT NULL::uuid,
  p_embedding   vector  DEFAULT NULL::vector,
  p_query       text    DEFAULT ''::text,
  p_mood        integer DEFAULT NULL::integer,
  p_match_count integer DEFAULT 30
)
RETURNS TABLE(id uuid, date text, mood integer, content_text text)
LANGUAGE plpgsql
AS $function$
DECLARE
  v_uid uuid;
BEGIN
  v_uid := COALESCE(p_user_id, auth.uid());
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'match_entries_hybrid: cannot determine user';
  END IF;

  RETURN QUERY
  WITH
  vec AS (
    SELECT e.id, ROW_NUMBER() OVER (ORDER BY e.embedding <=> p_embedding) AS rank
    FROM entries e
    WHERE p_embedding IS NOT NULL
      AND e.user_id = v_uid
      AND e.embedding IS NOT NULL
      AND (p_mood IS NULL OR e.mood = p_mood)
    ORDER BY e.embedding <=> p_embedding
    LIMIT p_match_count
  ),
  txt AS (
    SELECT e.id, ROW_NUMBER() OVER (ORDER BY e.date DESC) AS rank
    FROM entries e
    WHERE p_query <> ''
      AND e.user_id = v_uid
      AND e.content_text ILIKE '%' || p_query || '%'
      AND (p_mood IS NULL OR e.mood = p_mood)
    ORDER BY e.date DESC
    LIMIT p_match_count
  ),
  rrf AS (
    SELECT
      COALESCE(vec.id, txt.id) AS id,
      COALESCE(1.0 / (60 + vec.rank), 0.0) + COALESCE(1.0 / (60 + txt.rank), 0.0) AS rrf_score
    FROM vec FULL OUTER JOIN txt ON txt.id = vec.id
  )
  SELECT e.id, e.date::text, e.mood::int, e.content_text
  FROM rrf JOIN entries e ON e.id = rrf.id
  ORDER BY rrf.rrf_score DESC
  LIMIT p_match_count;
END;
$function$;
