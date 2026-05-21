// ─── Enums ────────────────────────────────────────────────────────────────────
export type UserRole = 'admin' | 'librarian' | 'student' | 'teacher';
export type BorrowingStatus = 'active' | 'returned' | 'overdue';

// ─── Category ─────────────────────────────────────────────────────────────────
export interface Category {
  id: number;
  name: string;
  description?: string;
}

// ─── Book ─────────────────────────────────────────────────────────────────────
export interface Book {
  id: number;
  isbn: string;
  title: string;
  author: string;
  publisher?: string;
  publication_year?: number;
  category_id?: number;
  category?: Category;
  total_copies: number;
  available_copies: number;
  description?: string;
  cover_url?: string;
  created_at: string;
}

// ─── User ─────────────────────────────────────────────────────────────────────
export interface User {
  id: number;
  matricule: string;
  email: string;
  full_name: string;
  role: UserRole;
  department?: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
}

// ─── Borrowing ────────────────────────────────────────────────────────────────
export interface Borrowing {
  id: number;
  user_id: number;
  book_id: number;
  user?: User;
  book?: Book;
  borrow_date: string;
  due_date: string;
  return_date?: string;
  status: BorrowingStatus;
  notes?: string;
}

// ─── Penalty ──────────────────────────────────────────────────────────────────
export interface Penalty {
  id: number;
  borrowing_id: number;
  borrowing?: Borrowing;
  amount: number;
  reason: string;
  is_paid: boolean;
  paid_date?: string;
  created_at: string;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface AuthToken {
  access_token: string;
  token_type: string;
  user: User;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export interface DashboardStats {
  total_books: number;
  available_books: number;
  total_users: number;
  active_borrowings: number;
  overdue_borrowings: number;
  returned_this_month: number;
  pending_penalties: number;
  total_penalty_amount: number;
}
