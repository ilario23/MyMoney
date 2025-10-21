-- ============================================================
-- DATABASE VIEWS - v1.8
-- Ottimizzazione query con viste pre-calcolate
-- ============================================================

-- 1. Vista: Riepilogo spese utente
CREATE OR REPLACE VIEW user_expense_summary AS
SELECT 
  user_id,
  COUNT(*) FILTER (WHERE deleted_at IS NULL) as total_expenses,
  SUM(amount) FILTER (WHERE deleted_at IS NULL) as total_amount,
  AVG(amount) FILTER (WHERE deleted_at IS NULL) as avg_expense,
  MIN(date) FILTER (WHERE deleted_at IS NULL) as first_expense_date,
  MAX(date) FILTER (WHERE deleted_at IS NULL) as last_expense_date,
  COUNT(DISTINCT category) FILTER (WHERE deleted_at IS NULL) as unique_categories
FROM expenses
GROUP BY user_id;

-- 2. Vista: Statistiche categoria per utente
CREATE OR REPLACE VIEW user_category_stats AS
SELECT 
  e.user_id,
  e.category,
  COUNT(*) as expense_count,
  SUM(e.amount) as total_amount,
  AVG(e.amount) as avg_amount,
  MIN(e.date) as first_expense,
  MAX(e.date) as last_expense
FROM expenses e
WHERE e.deleted_at IS NULL
GROUP BY e.user_id, e.category;

-- 3. Vista: Spese mensili aggregate
CREATE OR REPLACE VIEW monthly_expense_summary AS
SELECT 
  user_id,
  DATE_TRUNC('month', date) as month,
  COUNT(*) as expense_count,
  SUM(amount) as total_amount,
  AVG(amount) as avg_amount,
  COUNT(DISTINCT category) as unique_categories
FROM expenses
WHERE deleted_at IS NULL
GROUP BY user_id, DATE_TRUNC('month', date);

-- 4. Vista: Totali gruppo
CREATE OR REPLACE VIEW group_expense_summary AS
SELECT 
  g.id as group_id,
  g.name as group_name,
  g.owner_id,
  COUNT(DISTINCT e.id) FILTER (WHERE e.deleted_at IS NULL) as total_expenses,
  SUM(e.amount) FILTER (WHERE e.deleted_at IS NULL) as total_amount,
  COUNT(DISTINCT gm.user_id) as member_count,
  MIN(e.date) FILTER (WHERE e.deleted_at IS NULL) as first_expense_date,
  MAX(e.date) FILTER (WHERE e.deleted_at IS NULL) as last_expense_date
FROM groups g
LEFT JOIN expenses e ON e.group_id = g.id
LEFT JOIN group_members gm ON gm.group_id = g.id
GROUP BY g.id, g.name, g.owner_id;

-- 5. Vista: Spese condivise con dettagli
CREATE OR REPLACE VIEW shared_expense_details AS
SELECT 
  se.id,
  se.group_id,
  se.expense_id,
  se.creator_id,
  e.amount,
  e.category,
  e.description,
  e.date,
  g.name as group_name,
  JSONB_ARRAY_LENGTH(se.participants) as participant_count,
  se.is_recurring,
  se.created_at,
  se.updated_at
FROM shared_expenses se
JOIN expenses e ON e.id = se.expense_id
JOIN groups g ON g.id = se.group_id
WHERE e.deleted_at IS NULL;

-- 6. Vista: Categorie attive con conteggio utilizzo
CREATE OR REPLACE VIEW category_usage_stats AS
SELECT 
  c.id,
  c.user_id,
  c.group_id,
  c.name,
  c.icon,
  c.color,
  c.parent_id,
  c.is_active,
  COUNT(e.id) as usage_count,
  COALESCE(SUM(e.amount), 0) as total_amount,
  MAX(e.date) as last_used
FROM categories c
LEFT JOIN expenses e ON e.category = c.name 
  AND e.user_id = c.user_id 
  AND e.deleted_at IS NULL
GROUP BY c.id, c.user_id, c.group_id, c.name, c.icon, c.color, c.parent_id, c.is_active;

-- Grant SELECT permissions to authenticated users
GRANT SELECT ON user_expense_summary TO authenticated;
GRANT SELECT ON user_category_stats TO authenticated;
GRANT SELECT ON monthly_expense_summary TO authenticated;
GRANT SELECT ON group_expense_summary TO authenticated;
GRANT SELECT ON shared_expense_details TO authenticated;
GRANT SELECT ON category_usage_stats TO authenticated;

-- Verify views created
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'VIEW'
ORDER BY table_name;
