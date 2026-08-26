# Sistema Web de Gestión y Control Financiero — Incremento 1: Login

Proyecto académico (5.º Perito en Informática) desarrollado siguiendo el SDLC.
Este repositorio contiene **únicamente el primer incremento funcional**: un
**login completo y funcional**, con el frontend y el backend comunicándose
correctamente y verificando las credenciales contra PostgreSQL.

No se implementaron todavía el dashboard ni los módulos financieros
(ingresos, gastos, activos, pasivos, patrimonio, ahorro, presupuestos,
espacios financieros, reportes, etc.). Esos se agregarán en incrementos
posteriores, sobre esta misma base.

## ¿Qué incluye este incremento?

- Backend en **Node.js + TypeScript + Express**, conectado a **PostgreSQL**.
- Autenticación real: el backend consulta el usuario en la base de datos,
  compara la contraseña con `bcryptjs` y firma un **JWT (JWS, HS256)**.
- Frontend en **Angular** (standalone components) con una pantalla de login
  responsiva, validaciones, estado de carga y mensajes de error específicos.
- Ninguna credencial está "quemada" en el código: el usuario de prueba se
  crea con un script que guarda la contraseña ya hasheada en PostgreSQL.
- Variables de entorno para todo lo sensible (`.env`, nunca subido a Git).

## Tecnologías

| Capa                | Tecnología                          |
|---------------------|--------------------------------------|
| Frontend             | Angular (standalone components)     |
| Backend              | Node.js + TypeScript + Express      |
| Base de datos        | PostgreSQL                          |
| Administración BD    | pgAdmin 4                           |
| Autenticación        | JWT firmado con JWS (HS256)         |
| Hash de contraseñas  | bcryptjs                            |
| Control de versiones | Git + GitHub                        |
| Gestión del proyecto | Trello                              |

## Requisitos previos

- Node.js 18 o superior y npm.
- PostgreSQL 14 o superior (y pgAdmin 4, opcional pero recomendado).
- Git.

## 1. Clonar y ubicar las carpetas

El proyecto está dividido en dos carpetas independientes:

```
login-financiero/
├── backend/     → API en Node.js + TypeScript
└── frontend/    → Aplicación Angular
```

## 2. Configurar PostgreSQL

1. Crea la base de datos (puedes usar pgAdmin 4 o la terminal):

   ```sql
   CREATE DATABASE sistema_financiero;
   ```

2. Ejecuta el script que crea la tabla de usuarios:

   ```bash
   psql -U <tu_usuario> -d sistema_financiero -f backend/src/db/schema.sql
   ```

   (En pgAdmin 4 también puedes abrir ese archivo y ejecutarlo desde el
   "Query Tool" apuntando a la base `sistema_financiero`).

## 3. Configurar el backend

```bash
cd backend
pnpm install
cp .env.example .env
```

Abre `.env` y completa tus datos reales de PostgreSQL y un secreto propio
para firmar los JWT (una cadena larga y aleatoria):

```
PORT=3000
CORS_ORIGIN=http://localhost:4200

DB_HOST=localhost
DB_PORT=5432
DB_NAME=sistema_financiero
DB_USER=postgres
DB_PASSWORD=tu_contraseña_real

JWT_SECRET=una_cadena_larga_y_aleatoria
JWT_EXPIRES_IN=1h
```

### Crear un usuario de prueba

Con el `.env` ya configurado y la tabla `users` creada:

```bash
                              --------gmail----------  ----Rol----------- --contraseña-- 
pnpm run db:create-test-user jjax-2025012@gmail.com "Usuario de Prueba" 0123
```

Esto guarda en PostgreSQL un usuario con la contraseña **ya hasheada**
(nunca en texto plano). Puedes usar otro correo/usuario/contraseña si
prefieres; si no pasas argumentos, usa esos valores por defecto.

### Iniciar el backend

```bash
pnpm run dev
```

Deberías ver:

```
Conexión a PostgreSQL verificada correctamente.
Servidor backend escuchando en http://localhost:3000
```

Puedes probar que el servidor responde visitando
`http://localhost:3000/api/health` (debe devolver `{"status":"ok"}`).

## 4. Configurar y ejecutar el frontend

En otra terminal:

```bash
cd frontend
pnpm install
pnpm start
```

Esto levanta Angular en `http://localhost:4200`. Al abrirlo verás
directamente la pantalla de login.

La URL del backend que usa el frontend está en
`frontend/src/environments/environment.development.ts`
(`apiUrl: "http://localhost:3000/api"`). Si cambias el puerto del backend,
actualiza este archivo.

## 5. Probar el login

1. Con PostgreSQL, el backend (`npm run dev`) y el frontend (`npm start`)
   corriendo, abre `http://localhost:4200`.
2. Ingresa el correo y la contraseña del usuario de prueba que creaste.
3. Si son correctos, verás un panel de "Inicio de sesión exitoso" con tu
   nombre de usuario y correo.
4. Prueba también los casos de error:
   - Contraseña incorrecta → mensaje de credenciales incorrectas.
   - Correo que no existe → mismo mensaje (por seguridad, no se distingue
     cuál de los dos campos falló).
   - Campos vacíos → validación en el propio formulario, sin llamar al backend.
   - Backend apagado → mensaje de que no se pudo conectar con el servidor.
   - PostgreSQL apagado (con el backend encendido) → mensaje de que no se
     pudo conectar con la base de datos.

## Estructura del proyecto

```
login-financiero/
├── backend/
│   ├── src/
│   │   ├── config/env.ts            # Carga y valida variables de entorno
│   │   ├── db/
│   │   │   ├── pool.ts              # Conexión a PostgreSQL
│   │   │   └── schema.sql           # Tabla "users" (solo lo necesario para login)
│   │   ├── modules/
│   │   │   ├── auth/                # Rutas, controlador y servicio de login
│   │   │   └── users/                # Modelo y repositorio de usuarios
│   │   ├── middleware/errorHandler.ts
│   │   ├── utils/                   # JWT, hash de contraseñas, errores propios
│   │   ├── app.ts                   # Configuración de Express
│   │   └── server.ts                # Punto de entrada
│   ├── scripts/create-test-user.ts  # Script de desarrollo (no se usa en producción)
│   ├── .env.example
│   └── package.json
└── frontend/
    └── src/
        ├── app/
        │   ├── core/
        │   │   ├── models/auth.models.ts
        │   │   └── services/auth.service.ts
        │   ├── features/login/      # Pantalla de login (única pantalla de este incremento)
        │   ├── app.component.ts
        │   └── app.routes.ts
        ├── environments/
        └── styles.css                # Variables de color (paleta pendiente, ver abajo)
```

Esta separación por módulos (`modules/auth`, `modules/users` en el backend;
`core/`, `features/` en el frontend) permite agregar más adelante
`modules/incomes`, `modules/expenses`, `modules/assets`, etc., y
`features/dashboard`, `features/budgets`, etc., sin reorganizar lo ya
construido.



## Qué NO se desarrolló todavía

Este incremento se detiene exactamente en el login funcional. Quedan
pendientes para incrementos posteriores: ingresos, gastos,
gastos variables/recurrentes, activos, pasivos, patrimonio, ahorro, fondo
de emergencia, presupuestos, categorías, historial financiero, reportes,
espacios financieros, registro de usuarios, recuperación de
contraseña y despliegue en producción.

---

## Incremento 2: Dashboard financiero (frontend)

Se agregó la pantalla `frontend/src/app/features/dashboard/` con el
panel principal, replicando el diseño de referencia (sidebar, tarjetas de
resumen, gráfica de líneas Ingresos vs Gastos, gráfica de dona por
categoría, tabla de gastos recientes, presupuesto y notificaciones).

**Importante:** por ahora todos los datos del dashboard (montos, gastos
recientes, presupuestos, notificaciones) son **datos de ejemplo (mock)**
definidos directamente en `dashboard.component.ts`, ya que el backend de
este repositorio solo implementa autenticación. Cuando se agreguen los
módulos de `ingresos`, `gastos`, `presupuestos`, etc. al backend, basta con
reemplazar esos arreglos mock por llamadas HTTP (`HttpClient`) a los nuevos
endpoints — la estructura de las interfaces (`SummaryCard`, `ChartPoint`,
`CategorySlice`, `RecentExpense`, `BudgetItem`, `NotificationItem`) ya está
pensada para mapear 1 a 1 con la futura respuesta de la API.

### Características del dashboard

- **100% Angular + TypeScript + CSS puro** (sin librerías externas de
  gráficas): las gráficas de líneas, la dona y los sparklines de las
  tarjetas están hechas con SVG generado dinámicamente en el componente,
  por lo que no requieren instalar Chart.js/ECharts/Recharts ni depender
  de conexión a internet para renderizarse.
- **Sidebar** con menú de navegación (Dashboard, Gastos, Ingresos,
  Presupuestos, Categoría, Reportes, Ahorro, Configuración), resaltado del
  ítem activo y botón "Cerrar Menú" que colapsa la barra a solo íconos.
- **Header** con saludo, buscador (filtra en vivo la tabla de "Gastos
  Recientes" por descripción o categoría), selector de fecha, campana de
  notificaciones y menú de usuario con opción de "Cerrar sesión" (usa el
  `AuthService` ya existente).
- **Tarjetas de resumen** (Balance total, Ingresos, Gastos, Ahorro) con
  variación porcentual y mini gráfica de tendencia.
- **Gráfica "Gastos vs Ingresos"** con pestañas funcionales Semana / Mes /
  Año, cada una con su propio set de datos.
- **Gráfica de dona "Categoría de Gastos"** con leyenda, montos y
  porcentajes calculados a partir de los datos (siempre suman 100%).
- **Totalmente responsivo**: de escritorio (4 columnas) a tablet (2
  columnas) y móvil (1 columna), con el sidebar colapsándose
  automáticamente en pantallas angostas.

### Cómo verlo

Con el backend y PostgreSQL corriendo (o simplemente comentando
temporalmente el `authGuard` en `app.routes.ts` si solo quieres ver el
diseño sin loguearte), inicia sesión y serás redirigido a `/dashboard`.
