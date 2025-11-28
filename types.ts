export enum UserRole {
  USER = 'user',
  ADMIN = 'admin'
}

export enum OrderStatus {
  PENDING = 'Pending',
  CONFIRMED = 'Confirmed'
}

export interface User {
  _id: string;
  username: string;
  email: string;
  passwordHash: string; // Simulated hash
  role: UserRole;
  createdAt: string;
}

export interface Course {
  id: number;
  name: string;
  price: number;
  image: string;
  description: string;
  trailerUrl?: string;
}

export interface CartItem extends Course {
  cartId: string; // Unique ID for cart management
}

export interface Transaction {
  _id: string;
  userId: string | null; // Nullable for guest
  customerName: string; // Explicitly store name of user
  payerEmail: string;
  transactionId: string; // The ID entered by user
  courses: string[]; // List of course names
  totalAmount: number;
  status: OrderStatus;
  timestamp: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}