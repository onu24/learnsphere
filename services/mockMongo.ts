import { User, UserRole, Transaction, OrderStatus, Course } from "../types";
import { COURSES as INITIAL_COURSES } from "../constants";

// Keys for local storage - Using the requested DB name 'pdf_store_v2'
const USERS_COLLECTION = 'pdf_store_v2_users';
const TRANSACTIONS_COLLECTION = 'pdf_store_v2_transactions';
const COURSES_COLLECTION = 'pdf_store_v2_courses';

// Initial Setup
const initDB = () => {
  if (!localStorage.getItem(USERS_COLLECTION)) {
    // Create default admin
    const admin: User = {
      _id: 'admin_001',
      username: 'admin',
      email: 'admin@learnsphere.com',
      passwordHash: btoa('admin'), // Simple fake hash
      role: UserRole.ADMIN,
      createdAt: new Date().toISOString()
    };
    localStorage.setItem(USERS_COLLECTION, JSON.stringify([admin]));
  }
  if (!localStorage.getItem(TRANSACTIONS_COLLECTION)) {
    localStorage.setItem(TRANSACTIONS_COLLECTION, JSON.stringify([]));
  }
  if (!localStorage.getItem(COURSES_COLLECTION)) {
    localStorage.setItem(COURSES_COLLECTION, JSON.stringify(INITIAL_COURSES));
  }
};

initDB();

// User Services
export const registerUser = (user: Omit<User, '_id' | 'createdAt' | 'role'>): User => {
  const users: User[] = JSON.parse(localStorage.getItem(USERS_COLLECTION) || '[]');
  
  if (users.find(u => u.email === user.email)) {
    throw new Error('Email already exists');
  }

  const newUser: User = {
    ...user,
    _id: `user_${Date.now()}`,
    role: UserRole.USER,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  localStorage.setItem(USERS_COLLECTION, JSON.stringify(users));
  return newUser;
};

export const loginUser = (emailOrUser: string, password: string): User => {
  const users: User[] = JSON.parse(localStorage.getItem(USERS_COLLECTION) || '[]');
  const hash = btoa(password);
  
  const user = users.find(u => 
    (u.email === emailOrUser || u.username === emailOrUser) && u.passwordHash === hash
  );

  if (!user) throw new Error('Invalid credentials');
  return user;
};

// Transaction Services
export const createTransaction = (data: Omit<Transaction, '_id' | 'status' | 'timestamp'>): Transaction => {
  const transactions: Transaction[] = JSON.parse(localStorage.getItem(TRANSACTIONS_COLLECTION) || '[]');
  
  const newTx: Transaction = {
    ...data,
    _id: `tx_${Date.now()}`,
    status: OrderStatus.PENDING,
    timestamp: new Date().toISOString()
  };

  transactions.push(newTx);
  localStorage.setItem(TRANSACTIONS_COLLECTION, JSON.stringify(transactions));
  return newTx;
};

export const getTransactions = (): Transaction[] => {
  const transactions: Transaction[] = JSON.parse(localStorage.getItem(TRANSACTIONS_COLLECTION) || '[]');
  // Sort by date desc
  return transactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const confirmTransaction = (id: string): void => {
  const transactions: Transaction[] = JSON.parse(localStorage.getItem(TRANSACTIONS_COLLECTION) || '[]');
  const idx = transactions.findIndex(t => t._id === id);
  if (idx !== -1) {
    transactions[idx].status = OrderStatus.CONFIRMED;
    localStorage.setItem(TRANSACTIONS_COLLECTION, JSON.stringify(transactions));
  }
};

// Course Services
export const getCourses = (): Course[] => {
  return JSON.parse(localStorage.getItem(COURSES_COLLECTION) || '[]');
};

export const addCourse = (courseData: Omit<Course, 'id'>): Course => {
  const courses: Course[] = JSON.parse(localStorage.getItem(COURSES_COLLECTION) || '[]');
  const newId = courses.length > 0 ? Math.max(...courses.map(c => c.id)) + 1 : 1;
  
  const newCourse: Course = {
    id: newId,
    ...courseData
  };
  
  courses.push(newCourse);
  localStorage.setItem(COURSES_COLLECTION, JSON.stringify(courses));
  return newCourse;
};

export const deleteCourse = (id: number): void => {
  const courses: Course[] = JSON.parse(localStorage.getItem(COURSES_COLLECTION) || '[]');
  const filtered = courses.filter(c => c.id !== id);
  localStorage.setItem(COURSES_COLLECTION, JSON.stringify(filtered));
};

export const updateCoursePrice = (id: number, newPrice: number): void => {
  const courses: Course[] = JSON.parse(localStorage.getItem(COURSES_COLLECTION) || '[]');
  const idx = courses.findIndex(c => c.id === id);
  if (idx !== -1) {
    courses[idx].price = newPrice;
    localStorage.setItem(COURSES_COLLECTION, JSON.stringify(courses));
  }
};