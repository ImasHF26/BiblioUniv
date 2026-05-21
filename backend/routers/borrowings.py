from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user, require_admin
import models, schemas

router = APIRouter()


@router.get("/", response_model=List[schemas.BorrowingOut])
def list_borrowings(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = Query(None),
    user_id: Optional[int] = Query(None),
    book_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query = db.query(models.Borrowing)

    # Non-admin users can only see their own borrowings
    if current_user.role not in [models.UserRole.ADMIN, models.UserRole.LIBRARIAN]:
        query = query.filter(models.Borrowing.user_id == current_user.id)
    elif user_id:
        query = query.filter(models.Borrowing.user_id == user_id)

    if status:
        query = query.filter(models.Borrowing.status == status)
    if book_id:
        query = query.filter(models.Borrowing.book_id == book_id)
    return query.order_by(models.Borrowing.borrow_date.desc()).offset(skip).limit(limit).all()


@router.get("/{borrowing_id}", response_model=schemas.BorrowingOut)
def get_borrowing(borrowing_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    b = db.query(models.Borrowing).filter(models.Borrowing.id == borrowing_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Emprunt non trouvé")
    return b


@router.post("/", response_model=schemas.BorrowingOut, status_code=201)
def create_borrowing(
    borrowing: schemas.BorrowingCreate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    # Check user exists
    user = db.query(models.User).filter(models.User.id == borrowing.user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé ou inactif")

    # Check book availability
    book = db.query(models.Book).filter(models.Book.id == borrowing.book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Livre non trouvé")
    if book.available_copies <= 0:
        raise HTTPException(status_code=400, detail="Aucun exemplaire disponible")

    # Check user doesn't already have this book
    existing = db.query(models.Borrowing).filter(
        models.Borrowing.user_id == borrowing.user_id,
        models.Borrowing.book_id == borrowing.book_id,
        models.Borrowing.status == models.BorrowingStatus.ACTIVE
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Utilisateur a déjà ce livre")

    db_borrowing = models.Borrowing(**borrowing.model_dump())
    book.available_copies -= 1
    db.add(db_borrowing)
    db.commit()
    db.refresh(db_borrowing)
    return db_borrowing


@router.put("/{borrowing_id}", response_model=schemas.BorrowingOut)
def update_borrowing(
    borrowing_id: int,
    borrowing_data: schemas.BorrowingUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    b = db.query(models.Borrowing).filter(models.Borrowing.id == borrowing_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Emprunt non trouvé")

    update_data = borrowing_data.model_dump(exclude_unset=True)

    # Handle return
    if update_data.get("status") == models.BorrowingStatus.RETURNED and b.status != models.BorrowingStatus.RETURNED:
        book = db.query(models.Book).filter(models.Book.id == b.book_id).first()
        if book:
            book.available_copies += 1
        if not update_data.get("return_date"):
            update_data["return_date"] = date.today()

    for field, value in update_data.items():
        setattr(b, field, value)

    db.commit()
    db.refresh(b)
    return b


@router.post("/{borrowing_id}/return", response_model=schemas.BorrowingOut)
def return_book(borrowing_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    b = db.query(models.Borrowing).filter(models.Borrowing.id == borrowing_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Emprunt non trouvé")
    if b.status == models.BorrowingStatus.RETURNED:
        raise HTTPException(status_code=400, detail="Livre déjà retourné")

    b.status = models.BorrowingStatus.RETURNED
    b.return_date = date.today()

    book = db.query(models.Book).filter(models.Book.id == b.book_id).first()
    if book:
        book.available_copies += 1

    # Check if overdue → auto penalty
    if b.return_date > b.due_date:
        days_late = (b.return_date - b.due_date).days
        amount = days_late * 5.0  # 5 MAD/day
        if not b.penalty:
            penalty = models.Penalty(
                borrowing_id=b.id,
                amount=amount,
                reason=f"Retard de {days_late} jour(s) — 5 MAD/jour",
            )
            db.add(penalty)

    db.commit()
    db.refresh(b)
    return b
