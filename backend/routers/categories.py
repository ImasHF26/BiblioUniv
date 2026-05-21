from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user, require_admin
import models, schemas

router = APIRouter()


@router.get("/", response_model=List[schemas.CategoryOut])
def list_categories(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(models.Category).all()


@router.get("/{category_id}", response_model=schemas.CategoryOut)
def get_category(category_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    cat = db.query(models.Category).filter(models.Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Catégorie non trouvée")
    return cat


@router.post("/", response_model=schemas.CategoryOut, status_code=201)
def create_category(cat: schemas.CategoryCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    existing = db.query(models.Category).filter(models.Category.name == cat.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Catégorie déjà existante")
    db_cat = models.Category(**cat.model_dump())
    db.add(db_cat)
    db.commit()
    db.refresh(db_cat)
    return db_cat


@router.put("/{category_id}", response_model=schemas.CategoryOut)
def update_category(
    category_id: int,
    cat_data: schemas.CategoryUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    cat = db.query(models.Category).filter(models.Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Catégorie non trouvée")
    for field, value in cat_data.model_dump(exclude_unset=True).items():
        setattr(cat, field, value)
    db.commit()
    db.refresh(cat)
    return cat


@router.delete("/{category_id}", status_code=204)
def delete_category(category_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    cat = db.query(models.Category).filter(models.Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Catégorie non trouvée")
    if db.query(models.Book).filter(models.Book.category_id == category_id).first():
        raise HTTPException(status_code=400, detail="Catégorie contient des livres")
    db.delete(cat)
    db.commit()
