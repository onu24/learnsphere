import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, addDoc, getDocs, updateDoc, doc, query, orderBy, deleteDoc, setDoc, getDoc, writeBatch, initializeFirestore, where } from "firebase/firestore";
import { User, UserRole, Transaction, OrderStatus, Course, Review } from "../types";
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

// Initialize Firestore with specific settings to fix connection issues
// experimentalForceLongPolling: true resolves "Could not reach Cloud Firestore backend" errors
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

// Collection Names
const TRANSACTIONS_COLLECTION = 'transactions';
const COURSES_COLLECTION = 'courses';
const USERS_COLLECTION = 'users';
const REVIEWS_COLLECTION = 'reviews';

// --- USER SERVICES ---

export const subscribeToAuth = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      // Fetch User Data from Firestore (Fail-safe for offline/network error)
      let userProfile: any = {};
      try {
          const userDocRef = doc(db, USERS_COLLECTION, firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
               userProfile = userDoc.data();
          }
      } catch (dbError) {
          console.warn("Offline: Could not fetch user profile from DB, using Auth defaults.", dbError);
      }

      // Determine role/username from DB profile OR Auth defaults
      const role = userProfile.role || (firebaseUser.email === 'admin@learnsphere.com' ? UserRole.ADMIN : UserRole.USER);
      const username = userProfile.username || firebaseUser.displayName || 'User';
      const wishlist = userProfile.wishlist || [];

      const user: User = {
          _id: firebaseUser.uid,
          username: username,
          email: firebaseUser.email || '',
          passwordHash: '***',
          role: role,
          createdAt: userProfile.createdAt || firebaseUser.metadata.creationTime || new Date().toISOString(),
          wishlist: wishlist
      };
      callback(user);
    } else {
      callback(null);
    }
  });
};

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
      createdAt: createdAt,
      wishlist: []
    };

    // 3. Save User Data to Firestore Database (Fail-safe)
    try {
      await setDoc(doc(db, USERS_COLLECTION, firebaseUser.uid), {
        username: userData.username,
        email: userData.email,
        role: role,
        createdAt: createdAt,
        wishlist: []
      });
    } catch (dbErr) {
      console.warn("Offline: Could not save detailed profile to DB, but Auth was successful.", dbErr);
    }

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
    
    // 2. Fetch User Data from Firestore (Fail-safe for offline/network error)
    let userProfile: any = {};
    try {
        const userDocRef = doc(db, USERS_COLLECTION, firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
             userProfile = userDoc.data();
        }
    } catch (dbError) {
        console.warn("Offline: Could not fetch user profile from DB, using Auth defaults.", dbError);
    }

    // Determine role/username from DB profile OR Auth defaults
    const role = userProfile.role || (firebaseUser.email === 'admin@learnsphere.com' ? UserRole.ADMIN : UserRole.USER);
    const username = userProfile.username || firebaseUser.displayName || 'User';
    const wishlist = userProfile.wishlist || [];

    return {
        _id: firebaseUser.uid,
        username: username,
        email: firebaseUser.email || '',
        passwordHash: '***',
        role: role,
        createdAt: userProfile.createdAt || firebaseUser.metadata.creationTime || new Date().toISOString(),
        wishlist: wishlist
    };

  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const logoutUser = async () => {
  await signOut(auth);
};

export const updateUserWishlist = async (userId: string, wishlist: number[]) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, {
      wishlist: wishlist
    });
  } catch (e) {
    console.warn("Failed to sync wishlist (offline?)", e);
  }
};

// --- TRANSACTION SERVICES ---

export const createTransaction = async (data: Omit<Transaction, '_id' | 'timestamp' | 'status'>): Promise<Transaction> => {
  // 1. Check for unique Transaction ID (Simulate Verification)
  const q = query(collection(db, TRANSACTIONS_COLLECTION), where("transactionId", "==", data.transactionId));
  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    throw new Error("Transaction ID already exists. Please verify your payment details.");
  }

  // 2. Create Transaction with CONFIRMED status automatically
  const newTx = {
    ...data,
    status: OrderStatus.CONFIRMED, // Automatic Confirmation
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

export const hasUserPurchasedCourse = async (userId: string, courseName: string): Promise<boolean> => {
    try {
        const transactions = await getTransactions();
        return transactions.some(tx => 
            tx.userId === userId && 
            tx.status === OrderStatus.CONFIRMED &&
            tx.courses.includes(courseName)
        );
    } catch (e) {
        return false;
    }
}

export const getUserPurchasedCourses = async (userId: string): Promise<Course[]> => {
  try {
    const transactions = await getTransactions();
    // Filter for confirmed transactions belonging to the user
    const confirmedTx = transactions.filter(tx => 
        tx.userId === userId && tx.status === OrderStatus.CONFIRMED
    );
    
    // Collect all course names from these transactions
    const courseNames = new Set<string>();
    confirmedTx.forEach(tx => {
        tx.courses.forEach(name => courseNames.add(name));
    });
    
    // Get full course details
    const allCourses = await getCourses();
    return allCourses.filter(c => courseNames.has(c.name));
  } catch (error) {
    console.error("Error getting purchased courses:", error);
    return [];
  }
};

// --- COURSE SERVICES ---

export const getCourses = async (): Promise<Course[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, COURSES_COLLECTION));
    const courses = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
        id: typeof data.id === 'string' ? parseInt(data.id) : data.id, 
        ...data
        };
    }) as Course[];
    
    return courses.sort((a, b) => a.id - b.id);
  } catch (e: any) {
    console.warn("Failed to fetch courses from DB (Offline?). Using backup.", e);
    // Return static courses if DB is unreachable so the UI doesn't break
    return INITIAL_COURSES;
  }
};

export const addCourse = async (courseData: Omit<Course, 'id'>): Promise<Course> => {
  const courses = await getCourses();
  const newId = courses.length > 0 ? Math.max(...courses.map(c => c.id)) + 1 : 1;
  
  const newCourse = {
    id: newId,
    ...courseData
  };

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

// --- REVIEWS SERVICES ---

export const getReviews = async (courseId: number): Promise<Review[]> => {
    try {
        const q = query(collection(db, REVIEWS_COLLECTION), orderBy('date', 'desc'));
        const querySnapshot = await getDocs(q);
        // Client-side filtering because we can't easily compound query without index creation
        const reviews = querySnapshot.docs
            .map(doc => doc.data() as Review)
            .filter(r => r.courseId === courseId);
        return reviews;
    } catch (e) {
        return [];
    }
};

export const addReview = async (review: Review): Promise<void> => {
    await addDoc(collection(db, REVIEWS_COLLECTION), review);
};