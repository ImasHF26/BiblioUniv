from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, EmailStr
from models import UserRole, BorrowingStatus


# ── Auth ──────────────────────────────────────────────────────────────────────

class Token(BaseModel):
    access_token: str
    token_type: str
    user: "UserOut"


class TokenData(BaseModel):
    email: Optional[str] = None


# ── Category ──────────────────────────────────────────────────────────────────

class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class CategoryOut(CategoryBase):
    id: int
    model_config = {"from_attributes": True}


# ── Book ──────────────────────────────────────────────────────────────────────

class BookBase(BaseModel):
    isbn: str
    title: str
    author: str
    publisher: Optional[str] = None
    publication_year: Optional[int] = None
    category_id: Optional[int] = None
    total_copies: int = 1
    description: Optional[str] = None
    cover_url: Optional[str] = None


class BookCreate(BookBase):
    pass


class BookUpdate(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    publisher: Optional[str] = None
    publication_year: Optional[int] = None
    category_id: Optional[int] = None
    total_copies: Optional[int] = None
    available_copies: Optional[int] = None
    description: Optional[str] = None
    cover_url: Optional[str] = None


class BookOut(BookBase):
    id: int
    available_copies: int
    created_at: datetime
    category: Optional[CategoryOut] = None
    model_config = {"from_attributes": True}


# ── User ──────────────────────────────────────────────────────────────────────

class UserBase(BaseModel):
    matricule: str
    email: str
    full_name: str
    role: UserRole = UserRole.STUDENT
    department: Optional[str] = None
    phone: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    email: Optional[str] = None
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    department: Optional[str] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None


class UserOut(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    model_config = {"from_attributes": True}


# ── Borrowing ─────────────────────────────────────────────────────────────────

class BorrowingBase(BaseModel):
    user_id: int
    book_id: int
    due_date: date
    notes: Optional[str] = None


class BorrowingCreate(BorrowingBase):
    pass


class BorrowingUpdate(BaseModel):
    due_date: Optional[date] = None
    return_date: Optional[date] = None
    status: Optional[BorrowingStatus] = None
    notes: Optional[str] = None


class BorrowingOut(BorrowingBase):
    id: int
    borrow_date: date
    return_date: Optional[date] = None
    status: BorrowingStatus
    user: Optional[UserOut] = None
    book: Optional[BookOut] = None
    model_config = {"from_attributes": True}


# ── Penalty ───────────────────────────────────────────────────────────────────

class PenaltyBase(BaseModel):
    borrowing_id: int
    amount: float
    reason: str


class PenaltyCreate(PenaltyBase):
    pass


class PenaltyUpdate(BaseModel):
    amount: Optional[float] = None
    reason: Optional[str] = None
    is_paid: Optional[bool] = None
    paid_date: Optional[date] = None


class PenaltyOut(PenaltyBase):
    id: int
    is_paid: bool
    paid_date: Optional[date] = None
    created_at: datetime
    borrowing: Optional[BorrowingOut] = None
    model_config = {"from_attributes": True}


# ── Dashboard ─────────────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_books: int
    total_users: int
    active_borrowings: int
    overdue_borrowings: int
    returned_this_month: int
    pending_penalties: int
    total_penalty_amount: float
    available_books: int


Token.model_rebuild()
