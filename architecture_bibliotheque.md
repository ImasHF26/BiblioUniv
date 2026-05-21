# 📐 Architecture Complète — BiblioUniv

> Système de Gestion de Bibliothèque Universitaire  
> **Angular 21** (Standalone) + **FastAPI** (Python) + **SQLite**

---

## 1. Vue Globale de l'Application

### 1.1 Stack Technologique

| Couche | Technologie | Version |
|--------|-------------|---------|
| **Frontend** | Angular (Standalone Components) | `^21.0.0` |
| **UI Kit** | Angular Material | `^21.0.0` |
| **TypeScript** | TypeScript | `5.9` |
| **Backend** | FastAPI (Python) | `0.115.6` |
| **ORM** | SQLAlchemy | `2.0.36` |
| **Validation** | Pydantic | `2.10.3` |
| **Base de données** | SQLite | fichier local |
| **Auth** | JWT (python-jose) + bcrypt | — |
| **Serveur ASGI** | Uvicorn | `0.32.1` |

### 1.2 Architecture Haut Niveau

```mermaid
graph TB
    subgraph "CLIENT (Navigateur)"
        A["Angular 21 SPA<br/>localhost:4200"]
    end

    subgraph "SERVEUR (Python)"
        B["FastAPI<br/>localhost:8000"]
        C["SQLAlchemy ORM"]
        D["SQLite<br/>bibliotheque.db"]
    end

    A -- "HTTP REST (JSON)<br/>/api/*" --> B
    B -- "SQL Queries" --> C
    C -- "Read/Write" --> D
    B -- "JWT Token" --> A
```

### 1.3 Domaine Métier

```mermaid
erDiagram
    USER ||--o{ BORROWING : emprunte
    BOOK ||--o{ BORROWING : est-emprunte
    CATEGORY ||--o{ BOOK : contient
    BORROWING ||--o| PENALTY : genere

    USER {
        int id PK
        string matricule UK
        string email UK
        string full_name
        string hashed_password
        string role
        string department
        string phone
        bool is_active
        datetime created_at
    }

    CATEGORY {
        int id PK
        string name UK
        string description
    }

    BOOK {
        int id PK
        string isbn UK
        string title
        string author
        string publisher
        int publication_year
        int category_id FK
        int total_copies
        int available_copies
        string description
        string cover_url
        datetime created_at
    }

    BORROWING {
        int id PK
        int user_id FK
        int book_id FK
        date borrow_date
        date due_date
        date return_date
        string status
        string notes
    }

    PENALTY {
        int id PK
        int borrowing_id FK
        float amount
        string reason
        bool is_paid
        date paid_date
        datetime created_at
    }
```

### 1.4 Rôles Utilisateurs

| Rôle | Permissions |
|------|-------------|
| **admin** | Accès complet : CRUD tous domaines, gestion utilisateurs, paiement pénalités |
| **librarian** | Identique à admin (même guard côté backend) |
| **teacher** | Consultation livres, emprunts personnels, vue dashboard |
| **student** | Consultation livres, emprunts personnels, vue dashboard |

---

## 2. Architecture Backend (FastAPI)

### 2.1 Structure des Fichiers

```
backend/
├── main.py                 # Point d'entrée FastAPI, CORS, inclusion des routers
├── database.py             # Connexion SQLAlchemy, session factory, Base
├── models.py               # Modèles SQLAlchemy (5 tables + 2 enums)
├── schemas.py              # Schémas Pydantic (DTOs : Create, Update, Out)
├── auth.py                 # JWT + bcrypt : création/vérification tokens, guards
├── seed.py                 # Script de peuplement initial (10 catégories, 12 livres, 6 users, 5 emprunts)
├── requirements.txt        # Dépendances Python
└── routers/
    ├── __init__.py          # Exports des routers
    ├── auth_router.py       # POST /api/auth/login
    ├── books.py             # CRUD /api/books
    ├── categories.py        # CRUD /api/categories
    ├── users.py             # CRUD /api/users
    ├── borrowings.py        # CRUD /api/borrowings + POST .../return
    ├── penalties.py         # CRUD /api/penalties + POST .../pay
    └── dashboard.py         # GET /api/dashboard/stats, recent-borrowings, top-books
```

### 2.2 Endpoints API

```mermaid
graph LR
    subgraph "API REST — /api"
        AUTH["/auth<br/>POST /login"]
        BOOKS["/books<br/>GET, POST, GET/:id, PUT/:id, DELETE/:id"]
        CATS["/categories<br/>GET, POST, PUT/:id, DELETE/:id"]
        USERS["/users<br/>GET, POST, GET/:id, PUT/:id, DELETE/:id"]
        BORR["/borrowings<br/>GET, POST, GET/:id, PUT/:id<br/>POST /:id/return"]
        PEN["/penalties<br/>GET, POST, PUT/:id<br/>POST /:id/pay"]
        DASH["/dashboard<br/>GET /stats<br/>GET /recent-borrowings<br/>GET /top-books"]
        HEALTH["/health<br/>GET"]
    end
```

### 2.3 Flux d'Authentification Backend

```mermaid
sequenceDiagram
    participant C as Client Angular
    participant F as FastAPI
    participant DB as SQLite

    C->>F: POST /api/auth/login (email, password)
    F->>DB: Query User by email
    DB-->>F: User record
    F->>F: verify_password(bcrypt)
    alt Password valid
        F->>F: create_access_token(JWT, 8h)
        F-->>C: 200 {access_token, user}
    else Invalid
        F-->>C: 401 Unauthorized
    end

    Note over C,F: Requêtes suivantes
    C->>F: GET /api/books (Authorization: Bearer <token>)
    F->>F: get_current_user() → decode JWT
    F->>DB: Query
    DB-->>F: Data
    F-->>C: 200 JSON
```

### 2.4 Schéma DTOs (Pydantic)

Chaque entité suit le pattern **Base → Create → Update → Out** :

| Entité | Base | Create | Update | Out |
|--------|------|--------|--------|-----|
| Category | `name, description?` | = Base | tous optionnels | + `id` |
| Book | `isbn, title, author, publisher?, year?, category_id?, copies, desc?, cover?` | = Base | tous optionnels | + `id, available_copies, created_at, category?` |
| User | `matricule, email, full_name, role, department?, phone?` | + `password` | tous optionnels + `is_active?, password?` | + `id, is_active, created_at` |
| Borrowing | `user_id, book_id, due_date, notes?` | = Base | `due_date?, return_date?, status?, notes?` | + `id, borrow_date, return_date?, status, user?, book?` |
| Penalty | `borrowing_id, amount, reason` | = Base | `amount?, reason?, is_paid?, paid_date?` | + `id, is_paid, paid_date?, created_at, borrowing?` |

---

## 3. Architecture Frontend (Angular 21)

### 3.1 Structure des Fichiers

```
frontend/src/
├── main.ts                          # bootstrapApplication(AppComponent, appConfig)
├── app/
│   ├── app.ts                       # AppComponent (standalone, template: <router-outlet/>)
│   ├── app.config.ts                # ApplicationConfig : providers globaux
│   ├── app.routes.ts                # Routes principales + lazy loading
│   │
│   ├── core/                        # Singleton services, guards, interceptors
│   │   ├── constants/
│   │   │   └── api.constants.ts     # API_BASE_URL + API_ENDPOINTS
│   │   ├── models/
│   │   │   └── index.ts             # Interfaces TS : Category, Book, User, Borrowing, Penalty, etc.
│   │   ├── services/
│   │   │   ├── auth.service.ts      # AuthService (Signals : user, token, isAuthenticated, isAdmin)
│   │   │   └── index.ts             # BookService, CategoryService, UserService, BorrowingService,
│   │   │                            # PenaltyService, DashboardService
│   │   ├── guards/
│   │   │   └── auth.guard.ts        # authGuard + adminGuard (CanActivateFn)
│   │   └── interceptors/
│   │       └── index.ts             # jwtInterceptor + errorInterceptor (HttpInterceptorFn)
│   │
│   ├── layouts/
│   │   └── main-layout/             # Shell avec sidebar/header + <router-outlet/>
│   │
│   ├── features/                    # Feature modules (lazy loaded)
│   │   ├── auth/
│   │   │   └── login/               # LoginComponent (.ts, .html, .scss)
│   │   ├── dashboard/               # DashboardComponent
│   │   ├── books/
│   │   │   ├── book-list/           # BookListComponent
│   │   │   └── book-form/           # BookFormComponent (create + edit)
│   │   ├── categories/
│   │   │   └── category-list/       # CategoryListComponent (CRUD inline)
│   │   ├── users/
│   │   │   ├── user-list/           # UserListComponent
│   │   │   └── user-form/           # UserFormComponent (create + edit)
│   │   ├── borrowings/
│   │   │   ├── borrowing-list/      # BorrowingListComponent
│   │   │   └── borrowing-form/      # BorrowingFormComponent
│   │   └── penalties/
│   │       └── penalty-list/        # PenaltyListComponent
│   │
│   └── shared/
│       └── components/              # Composants réutilisables (à enrichir)
```

### 3.2 Diagramme de Composants

```mermaid
graph TD
    APP["AppComponent<br/>&lt;router-outlet/&gt;"]

    subgraph "Public Route"
        LOGIN["LoginComponent<br/>/login"]
    end

    subgraph "Protected Routes (authGuard)"
        LAYOUT["MainLayoutComponent<br/>Sidebar + Header + &lt;router-outlet/&gt;"]

        DASH["DashboardComponent<br/>/dashboard"]
        BL["BookListComponent<br/>/books"]
        BF["BookFormComponent<br/>/books/new — /books/:id/edit"]
        CL["CategoryListComponent<br/>/categories"]
        UL["UserListComponent<br/>/users"]
        UF["UserFormComponent<br/>/users/new — /users/:id/edit"]
        BRL["BorrowingListComponent<br/>/borrowings"]
        BRF["BorrowingFormComponent<br/>/borrowings/new"]
        PL["PenaltyListComponent<br/>/penalties"]
    end

    APP --> LOGIN
    APP --> LAYOUT
    LAYOUT --> DASH
    LAYOUT --> BL
    LAYOUT --> BF
    LAYOUT --> CL
    LAYOUT --> UL
    LAYOUT --> UF
    LAYOUT --> BRL
    LAYOUT --> BRF
    LAYOUT --> PL
```

### 3.3 Architecture des Services

```mermaid
graph LR
    subgraph "Core Services (providedIn: root)"
        AS["AuthService<br/>Signals: user, token,<br/>isAuthenticated, isAdmin"]
        BS["BookService"]
        CS["CategoryService"]
        US["UserService"]
        BRS["BorrowingService"]
        PS["PenaltyService"]
        DS["DashboardService"]
    end

    subgraph "Infrastructure"
        HTTP["HttpClient<br/>(withFetch)"]
        JWT["jwtInterceptor<br/>(ajoute Bearer token)"]
        ERR["errorInterceptor<br/>(401 → logout, format erreur)"]
        CONST["API_ENDPOINTS<br/>(constantes d'URL)"]
    end

    BS --> HTTP
    CS --> HTTP
    US --> HTTP
    BRS --> HTTP
    PS --> HTTP
    DS --> HTTP
    AS --> HTTP

    HTTP --> JWT --> ERR

    BS --> CONST
    CS --> CONST
    US --> CONST
    BRS --> CONST
    PS --> CONST
    DS --> CONST
    AS --> CONST
```

### 3.4 Flux de Données (State Management)

> **[!IMPORTANT]**
> L'application utilise le **pattern Signals d'Angular 21** pour la gestion d'état, **sans NgRx ni store externe**. Chaque composant gère son état local via des `signal()` et `computed()`.

```mermaid
flowchart TD
    subgraph "AuthService (État Global)"
        TOKEN["_token = signal(localStorage)"]
        USER["_user = signal(localStorage)"]
        AUTH["isAuthenticated = computed()"]
        ADMIN["isAdmin = computed()"]
    end

    subgraph "Feature Component (État Local)"
        DATA["data = signal&lt;T[]&gt;([])"]
        LOADING["loading = signal(true)"]
        EDITING["editingId = signal(null)"]
        COMPUTED["totalX = computed(() => ...)"]
    end

    subgraph "Flux HTTP"
        SVC["Service.getAll()"]
        HTTP2["HttpClient.get()"]
        JWT2["jwtInterceptor"]
        API["FastAPI /api/*"]
    end

    DATA -- "affichage" --> TEMPLATE["Template HTML<br/>signal() unwrap"]
    TEMPLATE -- "action utilisateur" --> SVC
    SVC --> HTTP2 --> JWT2 --> API
    API -- "JSON response" --> HTTP2
    HTTP2 -- "Observable → subscribe" --> DATA
```

#### Pattern de chargement dans chaque composant :

```typescript
// 1. Déclaration (signal local)
items    = signal<Item[]>([]);
loading  = signal(true);

// 2. Chargement via service
load() {
  this.loading.set(true);
  this.svc.getAll()
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: (data) => { this.items.set(data); this.loading.set(false); },
      error: ()    => this.loading.set(false),
    });
}

// 3. Template (unwrap signal)
@if (loading()) { <mat-spinner/> }
@for (item of items(); track item.id) { ... }
```

### 3.5 Routing & Lazy Loading

```mermaid
flowchart TD
    ROOT["/ (racine)"]
    ROOT -- "redirect" --> DASH2["/dashboard"]
    ROOT -- "authGuard" --> PROTECTED["MainLayoutComponent"]

    LOGIN2["/login"] -- "public" --> LC["LoginComponent"]

    PROTECTED --> DASH2
    PROTECTED --> BOOKS["/books"]
    PROTECTED --> BOOKS_NEW["/books/new"]
    PROTECTED --> BOOKS_EDIT["/books/:id/edit"]
    PROTECTED --> CATS2["/categories"]
    PROTECTED --> USERS2["/users"]
    PROTECTED --> USERS_NEW["/users/new"]
    PROTECTED --> USERS_EDIT["/users/:id/edit"]
    PROTECTED --> BORR2["/borrowings"]
    PROTECTED --> BORR_NEW["/borrowings/new"]
    PROTECTED --> PEN2["/penalties"]
    PROTECTED --> WILDCARD["/** → redirect /"]

    style PROTECTED fill:#1565C0,color:#fff
    style LOGIN2 fill:#4A148C,color:#fff
```

> **[!TIP]**
> Toutes les routes utilisent `loadComponent: () => import(...)` pour le **lazy loading** automatique. Chaque feature est un chunk JS séparé.

### 3.6 Sécurité & Authentification (Frontend)

```mermaid
sequenceDiagram
    participant U as Utilisateur
    participant LC as LoginComponent
    participant AS as AuthService
    participant JWT as jwtInterceptor
    participant ERR as errorInterceptor
    participant API as FastAPI

    U->>LC: Saisir email + mot de passe
    LC->>AS: login(email, password)
    AS->>API: POST /api/auth/login
    API-->>AS: {access_token, user}
    AS->>AS: localStorage.setItem(token, user)
    AS->>AS: _token.set(), _user.set()
    AS-->>LC: Observable complété
    LC->>LC: router.navigate(['/dashboard'])

    Note over U,API: Navigation protégée
    U->>JWT: GET /api/books
    JWT->>JWT: Lire token depuis AuthService
    JWT->>API: Authorization: Bearer <token>
    API-->>ERR: Response
    alt 401 Unauthorized
        ERR->>AS: logout()
        AS->>U: Redirect → /login
    else 200 OK
        ERR-->>U: Données affichées
    end
```

| Mécanisme | Implémentation |
|-----------|---------------|
| **Token Storage** | `localStorage` (access_token + user JSON) |
| **Token Injection** | `jwtInterceptor` (HttpInterceptorFn) |
| **Expiration** | 8h côté backend (JWT `exp` claim) |
| **Auto-logout** | `errorInterceptor` sur HTTP 401 |
| **Route Protection** | `authGuard` (CanActivateFn) |
| **Admin Protection** | `adminGuard` (CanActivateFn) |
| **Refresh Token** | ❌ Non implémenté (single token, 8h) |

### 3.7 Communication entre Composants

| Pattern | Utilisation dans l'app |
|---------|----------------------|
| **Signal + inject()** | État local dans chaque composant (`signal()`, `computed()`) |
| **Service partagé** | `AuthService` injecté dans tous les composants (user, rôle, token) |
| **toSignal()** | `DashboardComponent` convertit les Observable→Signal pour un binding réactif |
| **Template @if/@for** | Control flow blocks d'Angular 17+ (pas de `*ngIf`, `*ngFor`) |
| **Router params** | `ActivatedRoute.snapshot.paramMap.get('id')` pour les formulaires d'édition |
| **MatSnackBar** | Notifications globales pour les confirmations/erreurs |
| **Input/Output** | Non utilisé actuellement (composants autonomes, pas de hiérarchie parent-enfant complexe) |

### 3.8 Gestion des Environnements

| Aspect | Actuel |
|--------|--------|
| **API Base URL** | Codée en dur : `http://localhost:8000/api` dans `api.constants.ts` |
| **CORS Origins** | `localhost:4200` et `127.0.0.1:4200` dans `main.py` |
| **Dev Server** | `ng serve` (port 4200) + `uvicorn --reload` (port 8000) |
| **Build Prod** | `ng build` → `dist/bibliotheque/` |
| **Environment files** | ❌ Non utilisés (Angular `environment.ts` absent) |

> [!WARNING]
> Pour la production, il faudrait :
> - Créer `environment.ts` / `environment.prod.ts` pour l'URL de l'API
> - Changer le `SECRET_KEY` JWT dans `auth.py`
> - Migrer de SQLite vers PostgreSQL/MySQL
> - Ajouter un mécanisme de refresh token

---

## 4. Résumé des Caractéristiques Architecturales

| Critère | Choix Actuel |
|---------|-------------|
| **Taille du projet** | Application de taille **moyenne** (7 features, 5 entités) |
| **Architecture Angular** | **Standalone Components** (pas de NgModule) |
| **State Management** | **Signals natifs** (pas de NgRx/Akita) |
| **Lazy Loading** | ✅ Chaque feature est lazy-loaded via `loadComponent` |
| **Design Pattern** | Feature-based folder structure (Core / Features / Shared / Layouts) |
| **Réactivité** | `signal()`, `computed()`, `toSignal()`, `takeUntilDestroyed()` |
| **UI Framework** | Angular Material 21 (Material 3 / M3) |
| **Backend Pattern** | Router-based (chaque entité = 1 router FastAPI) |
| **ORM Pattern** | Active Record via SQLAlchemy relationships |
| **Auth Pattern** | JWT stateless (token unique, 8h, pas de refresh) |
| **Monorepo** | ❌ Non (pas de Nx), structure simple `backend/` + `frontend/` |

---

## 5. Flux Complet — Exemple : Emprunter un Livre

```mermaid
sequenceDiagram
    participant U as Utilisateur
    participant BRF as BorrowingFormComponent
    participant BRS as BorrowingService
    participant JWT as jwtInterceptor
    participant API as FastAPI /api/borrowings
    participant DB as SQLite

    U->>BRF: Remplit le formulaire (user, book, due_date)
    BRF->>BRF: form.value → data
    BRF->>BRS: create(data)
    BRS->>JWT: POST /api/borrowings {user_id, book_id, due_date}
    JWT->>API: + Authorization Bearer
    API->>DB: INSERT borrowing + UPDATE book.available_copies
    DB-->>API: Success
    API-->>BRS: 201 BorrowingOut JSON
    BRS-->>BRF: Observable<Borrowing>
    BRF->>BRF: snack.open("Emprunt créé !") + router.navigate(['/borrowings'])
```

---

## 6. Points d'Amélioration Potentiels

| Domaine | Suggestion |
|---------|-----------|
| **Refresh Token** | Implémenter un endpoint `/auth/refresh` avec rotation de token |
| **Environment Config** | Ajouter `environment.ts` / `environment.prod.ts` pour les URL dynamiques |
| **Pagination** | Ajouter `skip/limit` côté API et infinite scroll côté front |
| **Error Handling** | Centraliser via un `ErrorHandler` Angular global |
| **Tests** | Ajouter Jasmine/Karma pour les services et composants |
| **CI/CD** | GitHub Actions pour build + lint + tests |
| **Base de données** | Migrer de SQLite vers PostgreSQL pour la production |
| **Role Guard** | `adminGuard` n'est pas appliqué à toutes les routes qui le nécessitent |
