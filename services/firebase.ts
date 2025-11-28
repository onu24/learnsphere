import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, signOut } from "firebase/auth";
import { getFirestore, collection, addDoc, getDocs, updateDoc, doc, query, orderBy, deleteDoc, setDoc, getDoc, writeBatch } from "firebase/firestore";
import { User, UserRole, Transaction, OrderStatus, Course } from "../types";
import { COURSES as INITIAL_COURSES } from "../constants";

// --- CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyCpM_bCHsjvD1AxXovI1E-WzYCjYcAhOxU",
  authDomain: "learn-sphere-b942e.firebaseapp.com",
  projectId: "learn-sphere-b942e",
  storageBucket: "learn-sphere-b942e.firebasestorage.app",
  messagingSenderId: "563194092676",
  appId: "1:563194092676:web:1c406053c59c560bfdb6d1",
  measurementId: "G-CMZKFSGNQM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Collection Names
const TRANSACTIONS_COLLECTION = 'transactions';
const COURSES_COLLECTION = 'courses';
const USERS_COLLECTION = 'users';

// --- USER SERVICES ---

export const registerUser = async (userData: Omit<User, '_id' | 'createdAt' | 'role'>): Promise<User> => {
  try {
    // 1. Create Auth User
    const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.passwordHash); // passwordHash here is actually the raw password
    const firebaseUser = userCredential.user;

    await updateProfile(firebaseUser, {
      displayName: userData.username
    });
    
    // 2. Determine Role
    const role = userData.email === 'admin@learnsphere.com' ? UserRole.ADMIN : UserRole.USER;
    const createdAt = new Date().toISOString();

    const newUser: User = {
      _id: firebaseUser.uid,
      username: userData.username,
      email: userData.email,
      passwordHash: '***', // Don't store actual hash in local state
      role: role,
      createdAt: createdAt
    };

    // 3. Save User Data to Firestore Database
    await setDoc(doc(db, USERS_COLLECTION, firebaseUser.uid), {
      username: userData.username,
      email: userData.email,
      role: role,
      createdAt: createdAt
    });

    return newUser;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const loginUser = async (email: string, password: string): Promise<User> => {
  try {
    // 1. Auth Login
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    // 2. Fetch User Data from Firestore
    const userDocRef = doc(db, USERS_COLLECTION, firebaseUser.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const data = userDoc.data();
      return {
        _id: firebaseUser.uid,
        username: data.username,
        email: data.email,
        passwordHash: '***',
        role: data.role as UserRole,
        createdAt: data.createdAt
      };
    } else {
      // Fallback if DB document doesn't exist (e.g. legacy user or direct firebase console creation)
      const role = firebaseUser.email === 'admin@learnsphere.com' ? UserRole.ADMIN : UserRole.USER;
      // Optionally save it now to sync
      return {
        _id: firebaseUser.uid,
        username: firebaseUser.displayName || 'User',
        email: firebaseUser.email || '',
        passwordHash: '***',
        role: role,
        createdAt: firebaseUser.metadata.creationTime || new Date().toISOString()
      };
    }
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const logoutUser = async () => {
  await signOut(auth);
};

// --- TRANSACTION SERVICES ---

export const createTransaction = async (data: Omit<Transaction, '_id' | 'timestamp'>): Promise<Transaction> => {
  const newTx = {
    ...data,
    status: data.status || OrderStatus.PENDING, // Allow passing status, default to Pending
    timestamp: new Date().toISOString()
  };
  
  const docRef = await addDoc(collection(db, TRANSACTIONS_COLLECTION), newTx);
  
  return {
    ...newTx,
    _id: docRef.id
  } as Transaction;
};

export const getTransactions = async (): Promise<Transaction[]> => {
  const q = query(collection(db, TRANSACTIONS_COLLECTION), orderBy('timestamp', 'desc'));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    _id: doc.id,
    ...doc.data()
  })) as Transaction[];
};

export const confirmTransaction = async (id: string): Promise<void> => {
  const txRef = doc(db, TRANSACTIONS_COLLECTION, id);
  await updateDoc(txRef, {
    status: OrderStatus.CONFIRMED
  });
};

// --- COURSE SERVICES ---

export const getCourses = async (): Promise<Course[]> => {
  const querySnapshot = await getDocs(collection(db, COURSES_COLLECTION));
  const courses = querySnapshot.docs.map(doc => {
    const data = doc.data();
    // Ensure ID is number if needed by frontend
    return {
      id: typeof data.id === 'string' ? parseInt(data.id) : data.id, 
      ...data
    };
  }) as Course[];
  
  return courses.sort((a, b) => a.id - b.id);
};

export const addCourse = async (courseData: Omit<Course, 'id'>): Promise<Course> => {
  const courses = await getCourses();
  // Generate simple numeric ID
  const newId = courses.length > 0 ? Math.max(...courses.map(c => c.id)) + 1 : 1;
  
  const newCourse = {
    id: newId,
    ...courseData
  };

  // Use the ID as the document ID for easier retrieval/updates
  await setDoc(doc(db, COURSES_COLLECTION, newId.toString()), newCourse);

  return newCourse;
};

export const bulkAddCourses = async (newCoursesData: Omit<Course, 'id'>[]): Promise<void> => {
  const courses = await getCourses();
  let currentMaxId = courses.length > 0 ? Math.max(...courses.map(c => c.id)) : 0;
  
  const batch = writeBatch(db);

  newCoursesData.forEach((courseData, index) => {
    const newId = currentMaxId + 1 + index;
    const docRef = doc(db, COURSES_COLLECTION, newId.toString());
    batch.set(docRef, {
      id: newId,
      ...courseData
    });
  });

  await batch.commit();
};

export const deleteCourse = async (id: number): Promise<void> => {
  await deleteDoc(doc(db, COURSES_COLLECTION, id.toString()));
};

export const updateCoursePrice = async (id: number, newPrice: number): Promise<void> => {
  const courseRef = doc(db, COURSES_COLLECTION, id.toString());
  await updateDoc(courseRef, {
    price: newPrice
  });
};

export const resetCourses = async (): Promise<void> => {
  await seedCourses();
};

export const seedCourses = async (): Promise<void> => {
  const batch = writeBatch(db);
  INITIAL_COURSES.forEach(course => {
    const docRef = doc(db, COURSES_COLLECTION, course.id.toString());
    batch.set(docRef, course);
  });
  await batch.commit();
};