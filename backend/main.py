from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine
import models
from routers import auth_router, books, categories, users, borrowings, penalties, dashboard

# Create all tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Bibliothèque Universitaire API",
    description="API de gestion de bibliothèque universitaire",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200", "http://127.0.0.1:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router, prefix="/api/auth", tags=["Authentification"])
app.include_router(books.router, prefix="/api/books", tags=["Livres"])
app.include_router(categories.router, prefix="/api/categories", tags=["Catégories"])
app.include_router(users.router, prefix="/api/users", tags=["Utilisateurs"])
app.include_router(borrowings.router, prefix="/api/borrowings", tags=["Emprunts"])
app.include_router(penalties.router, prefix="/api/penalties", tags=["Pénalités"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Tableau de bord"])


@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "Bibliothèque Universitaire API"}
