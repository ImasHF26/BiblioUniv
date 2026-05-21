from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user, require_admin, get_password_hash
import models, schemas

router = APIRouter()


@router.get("/", response_model=List[schemas.UserOut])
def list_users(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    query = db.query(models.User)
    if search:
        query = query.filter(
            models.User.full_name.ilike(f"%{search}%") |
            models.User.email.ilike(f"%{search}%") |
            models.User.matricule.ilike(f"%{search}%")
        )
    if role:
        query = query.filter(models.User.role == role)
    return query.offset(skip).limit(limit).all()


@router.get("/{user_id}", response_model=schemas.UserOut)
def get_user(user_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    return user


@router.post("/", response_model=schemas.UserOut, status_code=201)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    if db.query(models.User).filter(models.User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email déjà utilisé")
    if db.query(models.User).filter(models.User.matricule == user.matricule).first():
        raise HTTPException(status_code=400, detail="Matricule déjà utilisé")
    user_data = user.model_dump(exclude={"password"})
    db_user = models.User(**user_data, hashed_password=get_password_hash(user.password))
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@router.put("/{user_id}", response_model=schemas.UserOut)
def update_user(
    user_id: int,
    user_data: schemas.UserUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    update_data = user_data.model_dump(exclude_unset=True)
    if "password" in update_data:
        update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
    for field, value in update_data.items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=204)
def delete_user(user_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    active = db.query(models.Borrowing).filter(
        models.Borrowing.user_id == user_id,
        models.Borrowing.status == models.BorrowingStatus.ACTIVE
    ).first()
    if active:
        raise HTTPException(status_code=400, detail="Utilisateur a des emprunts actifs")
    user.is_active = False
    db.commit()
