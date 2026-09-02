import { pool } from '../../db/pool';

export interface DashboardMetric {
  currentMonth: number;
  previousMonth: number;
  percentage: number;
}

export interface DashboardMetrics {
  balance: DashboardMetric;
  incomes: DashboardMetric;
  expenses: DashboardMetric;
  savings: DashboardMetric;
}

export async function getDashboardMetrics(userId: string): Promise<DashboardMetrics> {
  const result = await pool.query<{
    current_income: string;
    previous_income: string;
    current_expense: string;
    previous_expense: string;
  }>(
    `SELECT
       COALESCE((SELECT SUM(amount) FROM incomes
         WHERE user_id = $1
           AND income_date >= date_trunc('month', CURRENT_DATE)
           AND income_date < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'), 0) AS current_income,
       COALESCE((SELECT SUM(amount) FROM incomes
         WHERE user_id = $1
           AND income_date >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month')
           AND income_date < date_trunc('month', CURRENT_DATE)), 0) AS previous_income,
       COALESCE((SELECT SUM(amount) FROM expenses
         WHERE user_id = $1
           AND expense_date >= date_trunc('month', CURRENT_DATE)
           AND expense_date < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'), 0) AS current_expense,
       COALESCE((SELECT SUM(amount) FROM expenses
         WHERE user_id = $1
           AND expense_date >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month')
           AND expense_date < date_trunc('month', CURRENT_DATE)), 0) AS previous_expense`,
    [userId]
  );

  const row = result.rows[0];
  const currentIncome = Number(row.current_income);
  const previousIncome = Number(row.previous_income);
  const currentExpense = Number(row.current_expense);
  const previousExpense = Number(row.previous_expense);
  const metric = (currentMonth: number, previousMonth: number): DashboardMetric => ({
    currentMonth,
    previousMonth,
    percentage: previousMonth > 0
      ? ((currentMonth - previousMonth) / previousMonth) * 100
      : (currentMonth > 0 ? 100 : 0),
  });

  return {
    balance: metric(currentIncome - currentExpense, previousIncome - previousExpense),
    incomes: metric(currentIncome, previousIncome),
    expenses: metric(currentExpense, previousExpense),
    savings: metric(currentIncome - currentExpense, previousIncome - previousExpense),
  };
}