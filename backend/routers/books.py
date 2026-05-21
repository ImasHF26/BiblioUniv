from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user, require_admin
import models, schemas

router = APIRouter()


@router.get("/", response_model=List[schemas.BookOut])
def list_books(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = Query(None),
    category_id: Optional[int] = Query(None),
    available_only: bool = False,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    query = db.query(models.Book)
    if search:
        query = query.filter(
            models.Book.title.ilike(f"%{search}%") |
            models.Book.author.ilike(f"%{search}%") |
            models.Book.isbn.ilike(f"%{search}%")
        )
    if category_id:
        query = query.filter(models.Book.category_id == category_id)
    if available_only:
        query = query.filter(models.Book.available_copies > 0)
    return query.offset(skip).limit(limit).all()


@router.get("/{book_id}", response_model=schemas.BookOut)
def get_book(book_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    book = db.query(models.Book).filter(models.Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Livre non trouvé")
    return book


@router.post("/", response_model=schemas.BookOut, status_code=201)
def create_book(
    book: schemas.BookCreate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    existing = db.query(models.Book).filter(models.Book.isbn == book.isbn).first()
    if existing:
        raise HTTPException(status_code=400, detail="ISBN déjà existant")
    db_book = models.Book(**book.model_dump(), available_copies=book.total_copies)
    db.add(db_book)
    db.commit()
    db.refresh(db_book)
    return db_book


@router.put("/{book_id}", response_model=schemas.BookOut)
def update_book(
    book_id: int,
    book_data: schemas.BookUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    book = db.query(models.Book).filter(models.Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Livre non trouvé")
    for field, value in book_data.model_dump(exclude_unset=True).items():
        setattr(book, field, value)
    db.commit()
    db.refresh(book)
    return book


@router.delete("/{book_id}", status_code=204)
def delete_book(
    book_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    book = db.query(models.Book).filter(models.Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Livre non trouvé")
    active = db.query(models.Borrowing).filter(
        models.Borrowing.book_id == book_id,
        models.Borrowing.status == models.BorrowingStatus.ACTIVE
    ).first()
    if active:
        raise HTTPException(status_code=400, detail="Livre actuellement emprunté")
    db.delete(book)
    db.commit()
