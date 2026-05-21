# 📚 BiblioUniv — Gestion de Bibliothèque Universitaire

Application web complète de gestion de bibliothèque universitaire.
**Stack** : Angular 19 (standalone + signals) · FastAPI · SQLite · Angular Material

---

## 🚀 Démarrage rapide

### Prérequis
- **Python 3.11+**
- **Node.js 20+** et **npm 10+**
- **Angular CLI 19+** → `npm install -g @angular/cli`

---

### 1. Backend (FastAPI)

```bash
cd backend

# Créer l'environnement virtuel
python -m venv venv
source venv/bin/activate        # Linux/macOS
# venv\Scripts\activate         # Windows

# Installer les dépendances
pip install -r requirements.txt

# Initialiser la base de données avec des données de démonstration
python seed.py

# Démarrer le serveur
uvicorn main:app --reload --port 8000
```

L'API est disponible sur : **http://localhost:8000**
Documentation Swagger : **http://localhost:8000/api/docs**

---

### 2. Frontend (Angular)

```bash
cd frontend

# Installer les dépendances
npm install

# Démarrer le serveur de développement
ng serve
# ou
npm start
```

L'application est disponible sur : **http://localhost:4200**

---

## 🔐 Comptes de démonstration

| Rôle            | Email                          | Mot de passe |
|-----------------|--------------------------------|--------------|
| Administrateur  | admin@biblio.edu               | admin123     |
| Bibliothécaire  | bibliothecaire@biblio.edu      | lib123       |
| Enseignant      | prof.alami@biblio.edu          | ens123       |
| Étudiant        | sara.mansouri@etudiant.edu     | etu123       |

---

## 📁 Structure du projet

```
bibliotheque-app/
├── backend/
│   ├── main.py              # Application FastAPI principale
│   ├── database.py          # Configuration SQLAlchemy
│   ├── models.py            # Modèles de données
│   ├── schemas.py           # Schémas Pydantic
│   ├── auth.py              # Authentification JWT
│   ├── seed.py              # Données initiales
│   └── routers/
│       ├── auth_router.py   # Routes d'authentification
│       ├── books.py         # CRUD livres
│       ├── categories.py    # CRUD catégories
│       ├── users.py         # CRUD utilisateurs
│       ├── borrowings.py    # CRUD emprunts
│       ├── penalties.py     # CRUD pénalités
│       └── dashboard.py     # Statistiques
│
└── frontend/
    └── src/app/
        ├── core/
        │   ├── models/        # Interfaces TypeScript
        │   ├── services/      # Services HTTP
        │   ├── guards/        # Guards de navigation
        │   ├── interceptors/  # JWT + erreurs
        │   └── constants/     # URLs API
        ├── features/
        │   ├── auth/          # Connexion
        │   ├── dashboard/     # Tableau de bord
        │   ├── books/         # Gestion des livres
        │   ├── categories/    # Gestion des catégories
        │   ├── users/         # Gestion des utilisateurs
        │   ├── borrowings/    # Gestion des emprunts
        │   └── penalties/     # Gestion des pénalités
        └── layouts/
            └── main-layout/   # Layout principal avec sidebar
```

---

## ✨ Fonctionnalités

### Livres
- Catalogue complet avec recherche plein texte (titre, auteur, ISBN)
- Filtrage par catégorie et disponibilité
- Gestion des exemplaires (total / disponible)
- Ajout, modification, suppression

### Utilisateurs
- Gestion des étudiants, enseignants, bibliothécaires, admins
- Recherche par nom, email, matricule
- Filtrage par rôle
- Activation / désactivation des comptes

### Emprunts
- Création d'emprunts avec sélection de la date d'échéance
- Retour de livre en un clic (+ pénalité automatique si retard)
- Filtrage par statut (actif, en retard, retourné)
- Indicateur visuel des livres en retard

### Pénalités
- Calcul automatique à 5 MAD/jour de retard
- Marquage des pénalités comme payées
- Affichage du total des pénalités impayées

### Tableau de bord
- 6 statistiques en temps réel
- Liste des 10 derniers emprunts
- Top 5 des livres les plus empruntés

---

## 🛠️ API Endpoints

| Méthode | Endpoint                     | Description              |
|---------|------------------------------|--------------------------|
| POST    | /api/auth/login              | Connexion                |
| GET     | /api/auth/me                 | Utilisateur courant      |
| GET     | /api/books                   | Liste des livres         |
| POST    | /api/books                   | Créer un livre           |
| PUT     | /api/books/{id}              | Modifier un livre        |
| DELETE  | /api/books/{id}              | Supprimer un livre       |
| GET     | /api/categories              | Liste des catégories     |
| GET     | /api/users                   | Liste des utilisateurs   |
| GET     | /api/borrowings              | Liste des emprunts       |
| POST    | /api/borrowings/{id}/return  | Retourner un livre       |
| GET     | /api/penalties               | Liste des pénalités      |
| POST    | /api/penalties/{id}/pay      | Payer une pénalité       |
| GET     | /api/dashboard/stats         | Statistiques globales    |

---

## 🎨 Design System

- **Couleurs** : Navy `#0D1B2A` · Or `#C9963C` · Crème `#F7F3EE`
- **Typographie** : Playfair Display (titres) · DM Sans (corps)
- **Composants** : Angular Material (MDC)

---

## 🔧 Configuration

- **URL API** : `frontend/src/app/core/constants/api.constants.ts`
- **Secret JWT** : `backend/auth.py` → `SECRET_KEY`
- **Taux pénalité** : `backend/routers/borrowings.py` → `5.0 MAD/jour`
