import { Component, HostListener, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import {
  FinanceService,
  Income,
  IncomeCategory,
  CreateIncomeDTO,
} from '../../core/services/finance.service';

interface SummaryMetric {
  title: string;
  amount: number;
  icon: string;
  colorClass: string;
  sparklinePoints: string;
}

interface DonutSlice {
  name: string;
  color: string;
  amount: number;
  percent: number;
  dashArray: string;
  dashOffset: number;
}

interface MonthBar {
  label: string;
  amount: number;
  heightPct: number;
}

interface IncomeForm {
  category_id: string;
  description: string;
  amount: number | null;
  income_date: string;
  is_recurring: boolean;
  notes: string;
}

const ICON_PATHS: Record<string, string> = {
  bell: 'M6 9a6 6 0 0 1 12 0v5l2 3H4l2-3z M10 20a2 2 0 0 0 4 0',
  'log-out': 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9',
  calendar: 'M3 5h18v16H3z M16 2v6 M8 2v6 M3 10h18',
  wallet: 'M3 7a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M16.5 12h2.5 M3 9h18',
  'trending-up': 'M3 17l6-6 4 4 8-8 M15 6h6v6',
  dollar: 'M12 1v22 M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
  repeat: 'M17 2l4 4-4 4 M21 6H9a4 4 0 0 0-4 4 M7 22l-4-4 4-4 M3 18h12a4 4 0 0 0 4-4',
  plus: 'M12 5v14 M5 12h14',
  close: 'M6 18 18 6 M6 6l12 12',
  edit: 'M12 20h9 M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z',
  trash:
    'M3 6h18 M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2 M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6 M10 11v6 M14 11v6',
};

const CATEGORY_ICONS: Record<string, string> = {
  Salario: 'wallet',
  Freelance: 'trending-up',
  'Otros ingresos': 'plus',
};

const FALLBACK_COLOR = '#22c55e';

@Component({
  selector: 'app-incomes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './incomes.component.html',
  styleUrl: './incomes.component.css',
})
export class IncomesComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly financeService = inject(FinanceService);
  private readonly router = inject(Router);

  get currentUser() {
    return this.authService.currentUser();
  }

  /* ---------------- Layout ---------------- */
  sidebarCollapsed = false;
  isMobile = window.innerWidth < 900;
  userMenuOpen = false;
  searchTerm = '';
  activeRoute = 'ingresos';

  menuItems = [
    { label: 'Dashboard', icon: 'home', route: 'dashboard' },
    { label: 'Gastos', icon: 'receipt', route: 'gastos' },
    { label: 'Ingresos', icon: 'trending-up', route: 'ingresos' },
    { label: 'Presupuestos', icon: 'piggy-bank', route: 'presupuestos' },
    { label: 'Categoría', icon: 'grid', route: 'categoria' },
    { label: 'Reportes', icon: 'file-text', route: 'reportes' },
    { label: 'Ahorro', icon: 'leaf', route: 'ahorro' },
    { label: 'Configuración', icon: 'settings', route: 'configuracion' },
  ];

  get currentDateLabel(): string {
    const currentDate = new Date();
    const month = currentDate.toLocaleDateString('es-ES', { month: 'long' });
    const capitalizedMonth = month.charAt(0).toUpperCase() + month.slice(1);
    return `${currentDate.getDate()} de ${capitalizedMonth} de ${currentDate.getFullYear()}`;
  }

  /* ---------------- Datos ---------------- */
  incomes: Income[] = [];
  visibleIncomes: Income[] = [];
  categories: IncomeCategory[] = [];
  loading = false;
  loadingError: string | null = null;
  filterCategoryId = '';

  summaryMetrics: SummaryMetric[] = [];
  donutSlices: DonutSlice[] = [];
  donutTotal = 0;
  monthBars: MonthBar[] = [];

  /* ---------------- Modal crear/editar ---------------- */
  showModal = false;
  isEditing = false;
  editingId: string | null = null;
  saving = false;
  formError = '';
  form: IncomeForm = {
    category_id: '',
    description: '',
    amount: null,
    income_date: this.todayISO(),
    is_recurring: false,
    notes: '',
  };

  /* ---------------- Modal eliminar ---------------- */
  showDeleteModal = false;
  deletingIncome: Income | null = null;
  deleting = false;

  /* ---------------- Toast ---------------- */
  toastMessage: string | null = null;
  toastType: 'success' | 'error' = 'success';
  private toastTimer?: number;

  ngOnInit(): void {
    this.loadCategories();
    this.loadIncomes();
  }

  /* ================= Carga de datos ================= */

  private loadCategories(): void {
    this.financeService.getIncomeCategories('income').subscribe({
      next: (cats) => {
        this.categories = cats;
        if (!this.form.category_id && cats.length > 0) {
          this.form.category_id = cats[0].id;
        }
      },
      error: () => {
        this.categories = [];
      },
    });
  }

  loadIncomes(): void {
    this.loading = true;
    this.loadingError = null;

    this.financeService.getIncomes().subscribe({
      next: (res) => {
        this.incomes = res.data.map((inc) => ({
          ...inc,
          amount: Number(inc.amount) || 0,
          category_color: inc.category_color || FALLBACK_COLOR,
          category_name: inc.category_name || 'Sin categoría',
        }));
        this.applyFilters();
        this.computeStats();
        this.loading = false;
      },
      error: () => {
        this.incomes = [];
        this.applyFilters();
        this.loading = false;
        this.loadingError = 'No se pudieron cargar los ingresos.';
      },
    });
  }

  /* ================= Filtros ================= */

  applyFilters(): void {
    const term = this.searchTerm.trim().toLowerCase();

    this.visibleIncomes = this.incomes.filter((inc) => {
      const matchesCategory =
        !this.filterCategoryId || inc.category_id === this.filterCategoryId;
      const matchesTerm =
        !term ||
        inc.description.toLowerCase().includes(term) ||
        (inc.notes ?? '').toLowerCase().includes(term) ||
        inc.category_name.toLowerCase().includes(term);
      return matchesCategory && matchesTerm;
    });
  }

  /* ================= Estadísticas ================= */

  private computeStats(): void {
    const monthSums = this.getMonthSums();
    const sparklinePoints = this.buildSparkline(monthSums.map((m) => m.amount));

    const total = this.incomes.reduce((sum, inc) => sum + inc.amount, 0);

    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthTotal = this.incomes
      .filter((inc) => (inc.income_date ?? '').slice(0, 7) === currentMonthKey)
      .reduce((sum, inc) => sum + inc.amount, 0);

    const uniqueMonths = new Set(this.incomes.map((inc) => (inc.income_date ?? '').slice(0, 7)));
    const avgMonthly = uniqueMonths.size > 0 ? total / uniqueMonths.size : 0;

    const recurringTotal = this.incomes
      .filter((inc) => inc.is_recurring)
      .reduce((sum, inc) => sum + inc.amount, 0);

    this.summaryMetrics = [
      { title: 'Total de ingresos', amount: total, icon: 'wallet', colorClass: 'blue', sparklinePoints },
      { title: 'Ingresos del mes', amount: monthTotal, icon: 'calendar', colorClass: 'green', sparklinePoints },
      { title: 'Promedio mensual', amount: avgMonthly, icon: 'trending-up', colorClass: 'blue-light', sparklinePoints },
      { title: 'Recurrentes', amount: recurringTotal, icon: 'repeat', colorClass: 'green-light', sparklinePoints },
    ];

    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const maxMonth = Math.max(...monthSums.map((m) => m.amount), 1);
    this.monthBars = monthSums.map((m) => {
      const monthNumber = Number(m.key.slice(5, 7));
      return {
        label: months[monthNumber - 1],
        amount: m.amount,
        heightPct: m.amount > 0 ? Math.max(m.amount / maxMonth, 0.03) : 0,
      };
    });

    this.buildDonut();
  }

  private getMonthSums(): { key: string; amount: number }[] {
    const result: { key: string; amount: number }[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const amount = this.incomes
        .filter((inc) => (inc.income_date ?? '').slice(0, 7) === key)
        .reduce((sum, inc) => sum + inc.amount, 0);
      result.push({ key, amount });
    }

    return result;
  }

  private buildSparkline(values: number[]): string {
    const w = 100;
    const h = 30;
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;
    const step = w / (values.length - 1);

    return values
      .map((v, i) => {
        const x = i * step;
        const y = h - ((v - min) / range) * (h - 4) - 2;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }

  private buildDonut(): void {
    const totals = new Map<string, { color: string; amount: number }>();

    for (const inc of this.incomes) {
      const key = inc.category_name;
      const current = totals.get(key) ?? { color: inc.category_color, amount: 0 };
      totals.set(key, { color: current.color, amount: current.amount + inc.amount });
    }

    const entries = [...totals.entries()].filter(([, v]) => v.amount > 0);
    this.donutTotal = entries.reduce((sum, [, v]) => sum + v.amount, 0);

    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    let cumulative = 0;

    this.donutSlices = entries.map(([name, v]) => {
      const percent = this.donutTotal > 0 ? Math.round((v.amount / this.donutTotal) * 100) : 0;
      const dash = this.donutTotal > 0 ? (v.amount / this.donutTotal) * circumference : 0;
      const slice: DonutSlice = {
        name,
        color: v.color,
        amount: v.amount,
        percent,
        dashArray: `${dash} ${circumference - dash}`,
        dashOffset: -cumulative,
      };
      cumulative += dash;
      return slice;
    });
  }

  /* ================= Acciones CRUD ================= */

  openNewModal(): void {
    this.isEditing = false;
    this.editingId = null;
    this.formError = '';
    this.form = {
      category_id: this.categories[0]?.id ?? '',
      description: '',
      amount: null,
      income_date: this.todayISO(),
      is_recurring: false,
      notes: '',
    };
    this.showModal = true;
  }

  openEditModal(income: Income): void {
    this.isEditing = true;
    this.editingId = income.id;
    this.formError = '';
    this.form = {
      category_id: income.category_id,
      description: income.description,
      amount: income.amount,
      income_date: (income.income_date ?? '').slice(0, 10),
      is_recurring: income.is_recurring,
      notes: income.notes ?? '',
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.formError = '';
  }

  submit(): void {
    if (!this.form.category_id) {
      this.formError = 'Selecciona una categoría.';
      return;
    }
    if (!this.form.description.trim()) {
      this.formError = 'La descripción es obligatoria.';
      return;
    }
    if (this.form.amount === null || !Number.isFinite(this.form.amount) || this.form.amount <= 0) {
      this.formError = 'El monto debe ser un número mayor que 0.';
      return;
    }
    if (!this.form.income_date) {
      this.formError = 'La fecha es obligatoria.';
      return;
    }

    const dto: CreateIncomeDTO = {
      category_id: this.form.category_id,
      description: this.form.description.trim(),
      amount: Math.round(this.form.amount * 100) / 100,
      income_date: this.form.income_date,
      is_recurring: this.form.is_recurring,
      notes: this.form.notes ? this.form.notes.trim() : null,
    };

    this.saving = true;
    this.formError = '';

    const request$ = this.isEditing
      ? this.financeService.updateIncome(this.editingId as string, dto)
      : this.financeService.createIncome(dto);

    request$.subscribe({
      next: () => {
        this.showToast(this.isEditing ? 'Ingreso actualizado correctamente.' : 'Ingreso agregado correctamente.');
        this.closeModal();
        this.loadIncomes();
        this.saving = false;
      },
      error: (err) => {
        this.formError = err.error?.message || 'No se pudo guardar el ingreso. Intenta de nuevo.';
        this.saving = false;
      },
    });
  }

  openDeleteModal(income: Income): void {
    this.deletingIncome = income;
    this.showDeleteModal = true;
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.deletingIncome = null;
  }

  confirmDelete(): void {
    if (!this.deletingIncome) return;

    this.deleting = true;
    this.financeService.deleteIncome(this.deletingIncome.id).subscribe({
      next: () => {
        this.showToast('Ingreso eliminado correctamente.');
        this.cancelDelete();
        this.loadIncomes();
        this.deleting = false;
      },
      error: (err) => {
        this.showToast(err.error?.message || 'No se pudo eliminar el ingreso.', 'error');
        this.deleting = false;
      },
    });
  }

  /* ================= Utilidades ================= */

  formatCurrency(value: number): string {
    return 'Q' + value.toLocaleString('es-GT', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  formatDate(value: string): string {
    if (!value) return '—';
    const [y, m, d] = value.slice(0, 10).split('-');
    if (!y || !m || !d) return value;
    return `${d}/${m}/${y}`;
  }

  private todayISO(): string {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${now.getFullYear()}-${month}-${day}`;
  }

  getIconPath(name: string): string {
    return ICON_PATHS[name] ?? '';
  }

  getCategoryIcon(name: string): string {
    return ICON_PATHS[CATEGORY_ICONS[name] ?? 'wallet'] ?? '';
  }

  showToast(message: string, type: 'success' | 'error' = 'success'): void {
    if (this.toastTimer) {
      window.clearTimeout(this.toastTimer);
    }
    this.toastMessage = message;
    this.toastType = type;
    this.toastTimer = window.setTimeout(() => {
      this.toastMessage = null;
    }, 4500);
  }

  /* ================= Navegación / Layout ================= */

  navigateTo(item: { label: string; route: string }): void {
    this.activeRoute = item.route;
    if (item.route === 'dashboard') {
      this.router.navigate(['/dashboard']);
      return;
    }
    if (item.route !== 'ingresos') {
      return;
    }
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  toggleUserMenu(): void {
    this.userMenuOpen = !this.userMenuOpen;
  }

  logout(): void {
    this.authService.logout();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.isMobile = window.innerWidth < 900;
    if (this.isMobile) {
      this.sidebarCollapsed = true;
    }
  }
}