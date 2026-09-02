import { pool } from '../../db/pool';

export interface IncomeRecord {
  id: string;
  user_id: string;
  category_id: string;
  description: string;
  amount: number;
  income_date: string;
  is_recurring: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  category_name: string;
  category_color: string;
}

/**
 * Obtiene todos los ingresos del usuario con información de la categoría.
 * Realiza un JOIN con la tabla categories para obtener el nombre y color.
 */
export async function getIncomesByUserId(userId: string): Promise<IncomeRecord[]> {
  const result = await pool.query<IncomeRecord>(
    `SELECT 
      i.id, 
      i.user_id, 
      i.category_id, 
      i.description, 
      i.amount, 
      i.income_date, 
      i.is_recurring, 
      i.notes, 
      i.created_at, 
      i.updated_at,
      c.name AS category_name,
      c.color AS category_color
     FROM incomes i
     LEFT JOIN categories c ON i.category_id = c.id
     WHERE i.user_id = $1
     ORDER BY i.income_date DESC`,
    [userId]
  );
  return result.rows;
}

/**
 * Obtiene un ingreso específico por ID (verificando que pertenezca al usuario).
 */
export async function getIncomeById(
  incomeId: string,
  userId: string
): Promise<IncomeRecord | null> {
  const result = await pool.query<IncomeRecord>(
    `SELECT 
      i.id, 
      i.user_id, 
      i.category_id, 
      i.description, 
      i.amount, 
      i.income_date, 
      i.is_recurring, 
      i.notes, 
      i.created_at, 
      i.updated_at,
      c.name AS category_name,
      c.color AS category_color
     FROM incomes i
     LEFT JOIN categories c ON i.category_id = c.id
     WHERE i.id = $1 AND i.user_id = $2
     LIMIT 1`,
    [incomeId, userId]
  );
  return result.rows[0] ?? null;
}

/**
 * Crea un nuevo ingreso.
 */
export async function createIncome(
  userId: string,
  categoryId: string,
  description: string,
  amount: number,
  incomeDate: string,
  isRecurring: boolean = false,
  notes?: string
): Promise<IncomeRecord> {
  const result = await pool.query<IncomeRecord>(
    `INSERT INTO incomes (user_id, category_id, description, amount, income_date, is_recurring, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, user_id, category_id, description, amount, income_date, is_recurring, notes, created_at, updated_at`,
    [userId, categoryId, description, amount, incomeDate, isRecurring, notes ?? null]
  );
  // Obtener el ingreso completo con la información de la categoría
  const incomeId = result.rows[0].id;
  return getIncomeById(incomeId, userId) as Promise<IncomeRecord>;
}

/**
 * Actualiza un ingreso existente.
 */
export async function updateIncome(
  incomeId: string,
  userId: string,
  updates: Partial<{
    categoryId: string;
    description: string;
    amount: number;
    incomeDate: string;
    isRecurring: boolean;
    notes: string | null;
  }>
): Promise<IncomeRecord | null> {
  const fields: string[] = [];
  const values: unknown[] = [incomeId, userId];
  let paramCount = 3;

  if (updates.description !== undefined) {
    fields.push(`description = $${paramCount++}`);
    values.push(updates.description);
  }
  if (updates.amount !== undefined) {
    fields.push(`amount = $${paramCount++}`);
    values.push(updates.amount);
  }
  if (updates.categoryId !== undefined) {
    fields.push(`category_id = $${paramCount++}`);
    values.push(updates.categoryId);
  }
  if (updates.incomeDate !== undefined) {
    fields.push(`income_date = $${paramCount++}`);
    values.push(updates.incomeDate);
  }
  if (updates.isRecurring !== undefined) {
    fields.push(`is_recurring = $${paramCount++}`);
    values.push(updates.isRecurring);
  }
  if (updates.notes !== undefined) {
    fields.push(`notes = $${paramCount++}`);
    values.push(updates.notes);
  }

  if (fields.length === 0) {
    return getIncomeById(incomeId, userId);
  }

  fields.push(`updated_at = NOW()`);

  const query = `UPDATE incomes SET ${fields.join(', ')} WHERE id = $1 AND user_id = $2 RETURNING id`;
  await pool.query(query, values);

  return getIncomeById(incomeId, userId);
}

/**
 * Elimina un ingreso.
 */
export async function deleteIncome(incomeId: string, userId: string): Promise<boolean> {
  const result = await pool.query(
    'DELETE FROM incomes WHERE id = $1 AND user_id = $2',
    [incomeId, userId]
  );
  return (result.rowCount ?? 0) > 0;
}
