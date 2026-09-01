import { pool } from '../../db/pool';

export type CategoryType = 'expense' | 'income' | 'both';

export interface CategoryRecord {
  id: string;
  user_id: string | null;
  name: string;
  type: CategoryType;
  color: string | null;
  icon: string | null;
}

/**
 * Obtiene las categorías de un tipo determinado para el usuario autenticado.
 * Incluye las categorías globales (user_id IS NULL) y las propias del usuario.
 */
export async function getCategoriesByType(
  type: CategoryType,
  userId: string
): Promise<CategoryRecord[]> {
  const result = await pool.query<CategoryRecord>(
    `SELECT id, user_id, name, type, color, icon
     FROM categories
     WHERE type = $1 AND (user_id IS NULL OR user_id = $2)
     ORDER BY name ASC`,
    [type, userId]
  );
  return result.rows;
}