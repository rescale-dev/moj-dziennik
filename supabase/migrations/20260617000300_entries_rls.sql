-- RLS na tabeli wpisów: użytkownik ma dostęp wyłącznie do własnych wierszy
-- (auth.uid() = user_id) dla SELECT/INSERT/UPDATE/DELETE.
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS entries_select_own ON public.entries;
CREATE POLICY entries_select_own ON public.entries
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS entries_insert_own ON public.entries;
CREATE POLICY entries_insert_own ON public.entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS entries_update_own ON public.entries;
CREATE POLICY entries_update_own ON public.entries
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS entries_delete_own ON public.entries;
CREATE POLICY entries_delete_own ON public.entries
  FOR DELETE USING (auth.uid() = user_id);
