-- Adds create_expense: inserts the expense, its participant shares and the
-- autocomplete suggestion in one transaction, the same way create_group does.

CREATE OR REPLACE FUNCTION public.create_expense(
  p_group_id UUID,
  p_description TEXT,
  p_amount NUMERIC,
  p_category_id UUID,
  p_participant_ids UUID[],
  p_subcategory_id UUID DEFAULT NULL,
  p_expense_date DATE DEFAULT CURRENT_DATE
)
RETURNS expenses
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  e expenses;
  v_uid UUID := auth.uid();
  v_ids UUID[];
  v_count INT;
  v_base NUMERIC(12, 2);
  v_remainder NUMERIC(12, 2);
  v_odd_cents_to UUID;
  v_pid UUID;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT is_group_member(p_group_id) THEN
    RAISE EXCEPTION 'Not a member of this group';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be greater than zero';
  END IF;

  IF coalesce(btrim(p_description), '') = '' THEN
    RAISE EXCEPTION 'Description is required';
  END IF;

  SELECT array_agg(DISTINCT x) INTO v_ids FROM unnest(p_participant_ids) x;
  v_count := coalesce(array_length(v_ids, 1), 0);

  IF v_count = 0 THEN
    RAISE EXCEPTION 'At least one participant is required';
  END IF;

  IF EXISTS (
    SELECT 1 FROM unnest(v_ids) pid
    WHERE NOT EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = p_group_id AND gm.user_id = pid
    )
  ) THEN
    RAISE EXCEPTION 'Every participant must be a member of the group';
  END IF;

  INSERT INTO expenses (
    group_id, paid_by, category_id, subcategory_id, description, amount, expense_date
  )
  VALUES (
    p_group_id, v_uid, p_category_id, p_subcategory_id, btrim(p_description), p_amount,
    coalesce(p_expense_date, CURRENT_DATE)
  )
  RETURNING * INTO e;

  -- Equal split; the cents that do not divide evenly land on the payer when they
  -- are part of the split, so the shares always add back up to the total.
  v_base := trunc(p_amount / v_count, 2);
  v_remainder := p_amount - (v_base * v_count);
  v_odd_cents_to := CASE WHEN v_uid = ANY(v_ids) THEN v_uid ELSE v_ids[1] END;

  FOREACH v_pid IN ARRAY v_ids LOOP
    INSERT INTO expense_participants (expense_id, user_id, share)
    VALUES (
      e.id,
      v_pid,
      v_base + CASE WHEN v_pid = v_odd_cents_to THEN v_remainder ELSE 0 END
    );
  END LOOP;

  INSERT INTO expense_suggestions (
    user_id, group_id, description, category_id, subcategory_id
  )
  VALUES (v_uid, p_group_id, btrim(p_description), p_category_id, p_subcategory_id)
  ON CONFLICT (user_id, group_id, description, category_id) DO UPDATE SET
    subcategory_id = EXCLUDED.subcategory_id,
    usage_count = expense_suggestions.usage_count + 1,
    last_used = CURRENT_TIMESTAMP;

  RETURN e;
END;
$$;
