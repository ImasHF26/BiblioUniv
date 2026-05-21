from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user, require_admin
import models, schemas

router = APIRouter()


@router.get("/", response_model=List[schemas.PenaltyOut])
def list_penalties(
    skip: int = 0,
    limit: int = 100,
    is_paid: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query = db.query(models.Penalty)

    # Non-admin users can only see their own penalties
    if current_user.role not in [models.UserRole.ADMIN, models.UserRole.LIBRARIAN]:
        query = query.join(models.Borrowing).filter(
            models.Borrowing.user_id == current_user.id
        )

    if is_paid is not None:
        query = query.filter(models.Penalty.is_paid == is_paid)
    return query.order_by(models.Penalty.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/{penalty_id}", response_model=schemas.PenaltyOut)
def get_penalty(penalty_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    p = db.query(models.Penalty).filter(models.Penalty.id == penalty_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Pénalité non trouvée")
    return p


@router.post("/", response_model=schemas.PenaltyOut, status_code=201)
def create_penalty(
    penalty: schemas.PenaltyCreate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    b = db.query(models.Borrowing).filter(models.Borrowing.id == penalty.borrowing_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Emprunt non trouvé")
    if b.penalty:
        raise HTTPException(status_code=400, detail="Pénalité déjà existante pour cet emprunt")
    db_penalty = models.Penalty(**penalty.model_dump())
    db.add(db_penalty)
    db.commit()
    db.refresh(db_penalty)
    return db_penalty


@router.put("/{penalty_id}", response_model=schemas.PenaltyOut)
def update_penalty(
    penalty_id: int,
    penalty_data: schemas.PenaltyUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    p = db.query(models.Penalty).filter(models.Penalty.id == penalty_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Pénalité non trouvée")
    update_data = penalty_data.model_dump(exclude_unset=True)
    if update_data.get("is_paid") and not p.is_paid:
        update_data.setdefault("paid_date", date.today())
    for field, value in update_data.items():
        setattr(p, field, value)
    db.commit()
    db.refresh(p)
    return p


@router.post("/{penalty_id}/pay", response_model=schemas.PenaltyOut)
def pay_penalty(penalty_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    p = db.query(models.Penalty).filter(models.Penalty.id == penalty_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Pénalité non trouvée")
    if p.is_paid:
        raise HTTPException(status_code=400, detail="Pénalité déjà payée")
    p.is_paid = True
    p.paid_date = date.today()
    db.commit()
    db.refresh(p)
    return p
