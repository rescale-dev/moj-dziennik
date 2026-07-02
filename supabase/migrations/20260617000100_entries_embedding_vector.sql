-- Kolumna embedding (pgvector) na wpisach + indeks HNSW do wyszukiwania
-- kosinusowego. Wymagane przez funkcję match_entries_hybrid.
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

ALTER TABLE public.entries
  ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Indeks HNSW (cosine). Parametry zgodne ze stanem bazy.
CREATE INDEX IF NOT EXISTS entries_embedding_hnsw
  ON public.entries USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
