import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Expense {
  id: string;
  user_id: string;
  category_id: string;
  description: string;
  amount: number;
  expense_date: string;
  is_recurring: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  category_name: string;
  category_color: string;
}

export interface Income {
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

export interface CreateIncomeDTO {
  category_id: string;
  description: string;
  amount: number;
  income_date: string;
  is_recurring: boolean;
  notes?: string | null;
}

export type UpdateIncomeDTO = Partial<CreateIncomeDTO>;

export interface IncomeCategory {
  id: string;
  user_id: string | null;
  name: string;
  type: 'expense' | 'income' | 'both';
  color: string | null;
  icon: string | null;
}

export interface ExpensesResponse {
  data: Expense[];
}

export interface IncomesResponse {
  data: Income[];
}

@Injectable({
  providedIn: 'root'
})
export class FinanceService {
  private readonly EXPENSES_URL = `${environment.apiUrl}/expenses`;
  private readonly INCOMES_URL = `${environment.apiUrl}/incomes`;
  private readonly CATEGORIES_URL = `${environment.apiUrl}/categories`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene todos los gastos del usuario autenticado.
   */
  getExpenses(): Observable<ExpensesResponse> {
    return this.http.get<ExpensesResponse>(this.EXPENSES_URL);
  }

  /**
   * Obtiene todos los ingresos del usuario autenticado.
   */
  getIncomes(): Observable<IncomesResponse> {
    return this.http.get<IncomesResponse>(this.INCOMES_URL);
  }

  /**
   * Crea un nuevo ingreso.
   */
  createIncome(dto: CreateIncomeDTO): Observable<Income> {
    return this.http
      .post<{ data: Income }>(this.INCOMES_URL, dto)
      .pipe(map((res) => res.data));
  }

  /**
   * Actualiza un ingreso existente por su ID.
   */
  updateIncome(id: string, dto: UpdateIncomeDTO): Observable<Income> {
    return this.http
      .put<{ data: Income }>(`${this.INCOMES_URL}/${id}`, dto)
      .pipe(map((res) => res.data));
  }

  /**
   * Elimina un ingreso por su ID.
   */
  deleteIncome(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.INCOMES_URL}/${id}`);
  }

  /**
   * Obtiene las categorías disponibles para el tipo indicado
   * (por defecto las de ingreso, para poblar el formulario).
   */
  getIncomeCategories(
    type: 'expense' | 'income' | 'both' = 'income'
  ): Observable<IncomeCategory[]> {
    return this.http
      .get<{ data: IncomeCategory[] }>(this.CATEGORIES_URL, {
        params: { type },
      })
      .pipe(map((res) => res.data));
  }
}