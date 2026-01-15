import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { User } from '../models/user';

@Injectable({ providedIn: 'root' })
export class UserService {

  private usersSubject = new BehaviorSubject<User[]>([]);
  users$ = this.usersSubject.asObservable();

  private idCounter = 1;

  addUser(user: Omit<User, 'id'>): void {
    const newUser: User = {
      id: this.idCounter++,
      ...user
    };
    this.usersSubject.next([...this.usersSubject.value, newUser]);
  }

  updateUser(id: number, updatedUser: Omit<User, 'id'>): void {
    const users = this.usersSubject.value.map(u =>
      u.id === id ? { ...u, ...updatedUser } : u
    );
    this.usersSubject.next(users);
  }
}
