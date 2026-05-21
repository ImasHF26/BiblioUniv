import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../constants/api.constants';
import { Book, Category, User, Borrowing, Penalty, DashboardStats } from '../models';

// ─── Book Service ─────────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class BookService {
  private http = inject(HttpClient);

  getAll(search?: string, categoryId?: number, availableOnly?: boolean): Observable<Book[]> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    if (categoryId) params = params.set('category_id', categoryId);
    if (availableOnly) params = params.set('available_only', 'true');
    return this.http.get<Book[]>(API_ENDPOINTS.BOOKS, { params });
  }

  getById(id: number): Observable<Book> {
    return this.http.get<Book>(`${API_ENDPOINTS.BOOKS}/${id}`);
  }

  create(data: Partial<Book>): Observable<Book> {
    return this.http.post<Book>(API_ENDPOINTS.BOOKS, data);
  }

  update(id: number, data: Partial<Book>): Observable<Book> {
    return this.http.put<Book>(`${API_ENDPOINTS.BOOKS}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${API_ENDPOINTS.BOOKS}/${id}`);
  }
}

// ─── Category Service ─────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class CategoryService {
  private http = inject(HttpClient);

  getAll(): Observable<Category[]> {
    return this.http.get<Category[]>(API_ENDPOINTS.CATEGORIES);
  }

  create(data: Partial<Category>): Observable<Category> {
    return this.http.post<Category>(API_ENDPOINTS.CATEGORIES, data);
  }

  update(id: number, data: Partial<Category>): Observable<Category> {
    return this.http.put<Category>(`${API_ENDPOINTS.CATEGORIES}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${API_ENDPOINTS.CATEGORIES}/${id}`);
  }
}

// ─── User Service ─────────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);

  getAll(search?: string, role?: string): Observable<User[]> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    if (role) params = params.set('role', role);
    return this.http.get<User[]>(API_ENDPOINTS.USERS, { params });
  }

  getById(id: number): Observable<User> {
    return this.http.get<User>(`${API_ENDPOINTS.USERS}/${id}`);
  }

  create(data: any): Observable<User> {
    return this.http.post<User>(API_ENDPOINTS.USERS, data);
  }

  update(id: number, data: any): Observable<User> {
    return this.http.put<User>(`${API_ENDPOINTS.USERS}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${API_ENDPOINTS.USERS}/${id}`);
  }
}

// ─── Borrowing Service ────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class BorrowingService {
  private http = inject(HttpClient);

  getAll(status?: string, userId?: number, bookId?: number): Observable<Borrowing[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    if (userId) params = params.set('user_id', userId);
    if (bookId) params = params.set('book_id', bookId);
    return this.http.get<Borrowing[]>(API_ENDPOINTS.BORROWINGS, { params });
  }

  getById(id: number): Observable<Borrowing> {
    return this.http.get<Borrowing>(`${API_ENDPOINTS.BORROWINGS}/${id}`);
  }

  create(data: any): Observable<Borrowing> {
    return this.http.post<Borrowing>(API_ENDPOINTS.BORROWINGS, data);
  }

  update(id: number, data: any): Observable<Borrowing> {
    return this.http.put<Borrowing>(`${API_ENDPOINTS.BORROWINGS}/${id}`, data);
  }

  returnBook(id: number): Observable<Borrowing> {
    return this.http.post<Borrowing>(`${API_ENDPOINTS.BORROWINGS}/${id}/return`, {});
  }
}

// ─── Penalty Service ──────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class PenaltyService {
  private http = inject(HttpClient);

  getAll(isPaid?: boolean): Observable<Penalty[]> {
    let params = new HttpParams();
    if (isPaid !== undefined) params = params.set('is_paid', isPaid ? 'true' : 'false');
    return this.http.get<Penalty[]>(API_ENDPOINTS.PENALTIES, { params });
  }

  create(data: any): Observable<Penalty> {
    return this.http.post<Penalty>(API_ENDPOINTS.PENALTIES, data);
  }

  pay(id: number): Observable<Penalty> {
    return this.http.post<Penalty>(`${API_ENDPOINTS.PENALTIES}/${id}/pay`, {});
  }

  update(id: number, data: any): Observable<Penalty> {
    return this.http.put<Penalty>(`${API_ENDPOINTS.PENALTIES}/${id}`, data);
  }
}

// ─── Dashboard Service ────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);

  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(API_ENDPOINTS.DASHBOARD.STATS);
  }

  getRecentBorrowings(): Observable<any[]> {
    return this.http.get<any[]>(API_ENDPOINTS.DASHBOARD.RECENT_BORROWINGS);
  }

  getTopBooks(): Observable<any[]> {
    return this.http.get<any[]>(API_ENDPOINTS.DASHBOARD.TOP_BOOKS);
  }
}
