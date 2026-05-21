from datetime import datetime, date
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime,
    Date, Float, ForeignKey, Enum as SQLEnum
)
from sqlalchemy.orm import relationship
from database import Base
import enum


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    LIBRARIAN = "librarian"
    STUDENT = "student"
    TEACHER = "teacher"


class BorrowingStatus(str, enum.Enum):
    ACTIVE = "active"
    RETURNED = "returned"
    OVERDUE = "overdue"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    matricule = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(SQLEnum(UserRole), default=UserRole.STUDENT)
    department = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    borrowings = relationship("Borrowing", back_populates="user")


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(String, nullable=True)

    books = relationship("Book", back_populates="category")


class Book(Base):
    __tablename__ = "books"

    id = Column(Integer, primary_key=True, index=True)
    isbn = Column(String, unique=True, index=True, nullable=False)
    title = Column(String, index=True, nullable=False)
    author = Column(String, nullable=False)
    publisher = Column(String, nullable=True)
    publication_year = Column(Integer, nullable=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    total_copies = Column(Integer, default=1)
    available_copies = Column(Integer, default=1)
    description = Column(String, nullable=True)
    cover_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    category = relationship("Category", back_populates="books")
    borrowings = relationship("Borrowing", back_populates="book")


class Borrowing(Base):
    __tablename__ = "borrowings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    book_id = Column(Integer, ForeignKey("books.id"), nullable=False)
    borrow_date = Column(Date, default=date.today)
    due_date = Column(Date, nullable=False)
    return_date = Column(Date, nullable=True)
    status = Column(SQLEnum(BorrowingStatus), default=BorrowingStatus.ACTIVE)
    notes = Column(String, nullable=True)

    user = relationship("User", back_populates="borrowings")
    book = relationship("Book", back_populates="borrowings")
    penalty = relationship("Penalty", back_populates="borrowing", uselist=False)


class Penalty(Base):
    __tablename__ = "penalties"

    id = Column(Integer, primary_key=True, index=True)
    borrowing_id = Column(Integer, ForeignKey("borrowings.id"), unique=True, nullable=False)
    amount = Column(Float, default=0.0)
    reason = Column(String, nullable=False)
    is_paid = Column(Boolean, default=False)
    paid_date = Column(Date, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    borrowing = relationship("Borrowing", back_populates="penalty")
