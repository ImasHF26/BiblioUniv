from datetime import date
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from auth import get_current_user
import models, schemas

router = APIRouter()


@router.get("/stats", response_model=schemas.DashboardStats)
def get_stats(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    today = date.today()
    first_of_month = today.replace(day=1)

    if current_user.role in [models.UserRole.ADMIN, models.UserRole.LIBRARIAN]:
        total_books = db.query(func.sum(models.Book.total_copies)).scalar() or 0
        available_books = db.query(func.sum(models.Book.available_copies)).scalar() or 0
        total_users = db.query(func.count(models.User.id)).filter(models.User.is_active == True).scalar() or 0

        active_borrowings = db.query(func.count(models.Borrowing.id)).filter(
            models.Borrowing.status == models.BorrowingStatus.ACTIVE
        ).scalar() or 0

        overdue_borrowings = db.query(func.count(models.Borrowing.id)).filter(
            models.Borrowing.status == models.BorrowingStatus.OVERDUE
        ).scalar() or 0

        overdue_active = db.query(func.count(models.Borrowing.id)).filter(
            models.Borrowing.status == models.BorrowingStatus.ACTIVE,
            models.Borrowing.due_date < today
        ).scalar() or 0

        returned_this_month = db.query(func.count(models.Borrowing.id)).filter(
            models.Borrowing.status == models.BorrowingStatus.RETURNED,
            models.Borrowing.return_date >= first_of_month
        ).scalar() or 0

        pending_penalties = db.query(func.count(models.Penalty.id)).filter(
            models.Penalty.is_paid == False
        ).scalar() or 0

        total_penalty_amount = db.query(func.sum(models.Penalty.amount)).filter(
            models.Penalty.is_paid == False
        ).scalar() or 0.0
    else:
        # Personal stats for Student/Teacher
        total_books = db.query(func.sum(models.Book.total_copies)).scalar() or 0
        available_books = db.query(func.sum(models.Book.available_copies)).scalar() or 0
        total_users = 1

        active_borrowings = db.query(func.count(models.Borrowing.id)).filter(
            models.Borrowing.user_id == current_user.id,
            models.Borrowing.status == models.BorrowingStatus.ACTIVE
        ).scalar() or 0

        overdue_borrowings = db.query(func.count(models.Borrowing.id)).filter(
            models.Borrowing.user_id == current_user.id,
            models.Borrowing.status == models.BorrowingStatus.OVERDUE
        ).scalar() or 0

        overdue_active = db.query(func.count(models.Borrowing.id)).filter(
            models.Borrowing.user_id == current_user.id,
            models.Borrowing.status == models.BorrowingStatus.ACTIVE,
            models.Borrowing.due_date < today
        ).scalar() or 0

        returned_this_month = db.query(func.count(models.Borrowing.id)).filter(
            models.Borrowing.user_id == current_user.id,
            models.Borrowing.status == models.BorrowingStatus.RETURNED,
            models.Borrowing.return_date >= first_of_month
        ).scalar() or 0

        pending_penalties = db.query(func.count(models.Penalty.id)).join(models.Borrowing).filter(
            models.Borrowing.user_id == current_user.id,
            models.Penalty.is_paid == False
        ).scalar() or 0

        total_penalty_amount = db.query(func.sum(models.Penalty.amount)).join(models.Borrowing).filter(
            models.Borrowing.user_id == current_user.id,
            models.Penalty.is_paid == False
        ).scalar() or 0.0

    return schemas.DashboardStats(
        total_books=int(total_books),
        available_books=int(available_books),
        total_users=int(total_users),
        active_borrowings=int(active_borrowings),
        overdue_borrowings=int(overdue_borrowings) + int(overdue_active),
        returned_this_month=int(returned_this_month),
        pending_penalties=int(pending_penalties),
        total_penalty_amount=float(total_penalty_amount),
    )


@router.get("/recent-borrowings")
def get_recent_borrowings(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query = db.query(models.Borrowing)
    if current_user.role not in [models.UserRole.ADMIN, models.UserRole.LIBRARIAN]:
        query = query.filter(models.Borrowing.user_id == current_user.id)

    borrowings = (
        query
        .order_by(models.Borrowing.borrow_date.desc())
        .limit(10)
        .all()
    )
    return [
        {
            "id": b.id,
            "user_name": b.user.full_name if b.user else "—",
            "book_title": b.book.title if b.book else "—",
            "borrow_date": str(b.borrow_date),
            "due_date": str(b.due_date),
            "status": b.status,
        }
        for b in borrowings
    ]


@router.get("/top-books")
def get_top_books(db: Session = Depends(get_db), _=Depends(get_current_user)):
    result = (
        db.query(models.Book.title, func.count(models.Borrowing.id).label("borrow_count"))
        .join(models.Borrowing, models.Book.id == models.Borrowing.book_id)
        .group_by(models.Book.id)
        .order_by(func.count(models.Borrowing.id).desc())
        .limit(5)
        .all()
    )
    return [{"title": r[0], "count": r[1]} for r in result]
