
import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, Link, useNavigate } from 'react-router-dom';
import { User, CartItem, UserRole, AuthState, Course, Transaction, OrderStatus } from './types';
import { HERO_SLIDES } from './constants';
// Switch to Firebase Service
import * as DB from './services/firebase';
import * as EmailService from './services/email';
import { ShoppingCart, User as UserIcon, LogOut, Menu, X, Shield, BookOpen, Trash2, ArrowLeft, CheckCircle, Clock, Plus, Edit2, Save, XCircle, AlertTriangle, Play, Mail, Check, RefreshCw, Search, Upload, FileText, Download } from 'lucide-react';

// --- Contexts ---

interface CourseContextType {
  courses: Course[];
  refreshCourses: () => void;
  loading: boolean;
  error: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const CourseContext = createContext<CourseContextType | undefined>(undefined);

interface CartContextType {
  items: CartItem[];
  addToCart: (course: Course) => void;
  removeFromCart: (cartId: string) => void;
  clearCart: () => void;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

interface AuthContextType extends AuthState {
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- Hooks ---
const useCourses = () => {
  const context = useContext(CourseContext);
  if (!context) throw new Error("useCourses must be used within a CourseProvider");
  return context;
};

const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within a AuthProvider");
  return context;
};

// --- Helper Components ---

const HighlightedText = ({ text, highlight }: { text: string, highlight: string }) => {
  if (!highlight.trim()) {
    return <>{text}</>;
  }
  const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
  return (
    <>
      {parts.map((part, i) => 
        part.toLowerCase() === highlight.toLowerCase() ? 
          <span key={i} className="bg-yellow-200 text-slate-900 rounded-[1px] px-[1px]">{part}</span> : 
          part
      )}
    </>
  );
};

// --- Components ---

const Navbar: React.FC = () => {
  const { items } = useCart();
  const { user, logout } = useAuth();
  const { searchQuery, setSearchQuery } = useCourses();
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    // If user starts searching and is not on home page, go to home
    if (e.target.value && location.pathname !== '/') {
      navigate('/');
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const isActive = (path: string) => location.pathname === path ? "text-brand-600 font-semibold" : "text-slate-600 hover:text-brand-600";

  return (
    <nav className="fixed w-full z-50 glass-nav">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-6 flex-1">
            <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
              <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">L</div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-700 to-brand-500 hidden sm:block">LearnSphere</span>
            </Link>

            {/* Desktop Search Bar */}
            <div className="hidden md:block relative w-full max-w-xs lg:max-w-md group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={18} className="text-slate-400 group-focus-within:text-brand-500 transition-colors" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearch}
                  placeholder="Search for courses..."
                  className="block w-full pl-10 pr-10 py-2 border border-slate-200 rounded-full leading-5 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand-100 focus:border-brand-300 sm:text-sm transition-all shadow-sm"
                />
                {searchQuery && (
                  <button 
                    onClick={clearSearch}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 animate-fade-in"
                  >
                    <XCircle size={16} fill="currentColor" className="text-slate-300 hover:text-slate-500" />
                  </button>
                )}
            </div>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className={isActive('/')}>Courses</Link>
            
            <Link to="/cart" className="relative group">
               <div className="flex items-center space-x-1 text-slate-600 hover:text-brand-600 transition-colors">
                  <ShoppingCart size={20} />
                  <span>Cart</span>
               </div>
               {items.length > 0 && (
                 <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-bounce">
                   {items.length}
                 </span>
               )}
            </Link>

            {user ? (
              <div className="flex items-center space-x-4">
                 <span className="text-sm text-slate-500">Hi, {user.username}</span>
                 {user.role === UserRole.ADMIN && (
                   <Link to="/admin" className="text-brand-600 hover:text-brand-800 font-medium flex items-center gap-1">
                     <Shield size={16} /> Admin
                   </Link>
                 )}
                 <button onClick={logout} className="text-slate-500 hover:text-red-500 transition-colors">
                   <LogOut size={20} />
                 </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login" className="text-slate-600 hover:text-brand-600 font-medium">Login</Link>
                <Link to="/register" className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2 rounded-full font-medium transition-all shadow-md hover:shadow-lg text-sm">
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-slate-600">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-b border-slate-100 px-4 py-4 space-y-4 shadow-lg animate-fade-in">
          {/* Mobile Search */}
          <div className="relative mb-4">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-slate-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearch}
                placeholder="Search courses..."
                className="block w-full pl-10 pr-10 py-2 border border-slate-200 rounded-lg leading-5 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
              {searchQuery && (
                  <button 
                    onClick={clearSearch}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    <XCircle size={16} fill="currentColor" className="text-slate-300 hover:text-slate-500" />
                  </button>
              )}
          </div>

          <Link to="/" onClick={() => setIsOpen(false)} className="block text-slate-600 py-2">Courses</Link>
          <Link to="/cart" onClick={() => setIsOpen(false)} className="flex justify-between text-slate-600 py-2">
            <span>Cart</span>
            <span className="bg-brand-100 text-brand-700 px-2 rounded-full text-sm">{items.length}</span>
          </Link>
          {user ? (
            <>
              {user.role === UserRole.ADMIN && (
                <Link to="/admin" onClick={() => setIsOpen(false)} className="block text-brand-600 py-2 font-medium">Admin Panel</Link>
              )}
              <button onClick={() => { logout(); setIsOpen(false); }} className="block text-red-500 py-2 w-full text-left">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setIsOpen(false)} className="block text-slate-600 py-2">Login</Link>
              <Link to="/register" onClick={() => setIsOpen(false)} className="block bg-brand-600 text-white text-center py-2 rounded-lg">Register</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

const Footer = () => (
  <footer className="bg-slate-900 text-slate-300 py-12 mt-auto">
    <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
      <div>
        <h3 className="text-white text-lg font-bold mb-4 flex items-center gap-2">
           <div className="w-6 h-6 bg-brand-500 rounded flex items-center justify-center text-white text-xs">L</div>
           LearnSphere
        </h3>
        <p className="opacity-70">Empowering learners worldwide with accessible, high-quality professional resources.</p>
      </div>
      <div>
        <h4 className="text-white font-semibold mb-4">Quick Links</h4>
        <ul className="space-y-2 opacity-70">
          <li><Link to="/" className="hover:text-white">Courses</Link></li>
          <li><Link to="/cart" className="hover:text-white">Cart</Link></li>
          <li><Link to="/login" className="hover:text-white">Login</Link></li>
        </ul>
      </div>
      <div>
        <h4 className="text-white font-semibold mb-4">Contact</h4>
        <p className="opacity-70 mb-2">support@learnsphere.com</p>
        <p className="opacity-70">Mumbai, India</p>
      </div>
    </div>
    <div className="max-w-7xl mx-auto px-4 mt-8 pt-8 border-t border-slate-800 text-center opacity-50 text-xs">
      &copy; {new Date().getFullYear()} LearnSphere. All rights reserved.
    </div>
  </footer>
);

// --- Pages ---

const Hero: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative h-[500px] w-full overflow-hidden bg-slate-900">
      {HERO_SLIDES.map((slide, index) => (
        <div 
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/50 z-10" />
          <img 
             src={slide.image} 
             alt={slide.title} 
             className="w-full h-full object-cover" 
             onError={(e) => {
               (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1920&q=80';
             }}
          />
          
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center text-white px-4">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 animate-slide-up">{slide.title}</h1>
            <p className="text-xl md:text-2xl text-slate-200 mb-8 max-w-2xl animate-fade-in">{slide.subtitle}</p>
            <button 
              onClick={() => document.getElementById('courses')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-brand-600 hover:bg-brand-700 text-white px-8 py-3 rounded-full font-semibold transition-all transform hover:scale-105 shadow-lg"
            >
              {slide.cta}
            </button>
          </div>
        </div>
      ))}
      
      {/* Dots */}
      <div className="absolute bottom-6 left-0 right-0 z-30 flex justify-center space-x-3">
        {HERO_SLIDES.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full transition-all ${index === currentSlide ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/80'}`}
          />
        ))}
      </div>
    </div>
  );
};

// Video Modal Component
const VideoModal: React.FC<{ url: string; isOpen: boolean; onClose: () => void }> = ({ url, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 animate-fade-in">
       <div className="relative w-full max-w-4xl bg-black rounded-xl overflow-hidden shadow-2xl">
          <button onClick={onClose} className="absolute top-4 right-4 text-white hover:text-red-500 z-10 bg-black/50 p-2 rounded-full transition-colors">
            <X size={24} />
          </button>
          <div className="relative pt-[56.25%]">
             <iframe 
               src={url} 
               className="absolute inset-0 w-full h-full"
               title="Course Trailer"
               frameBorder="0"
               allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
               allowFullScreen
             ></iframe>
          </div>
       </div>
    </div>
  );
};

const CourseCard: React.FC<{ course: Course }> = ({ course }) => {
  const { addToCart } = useCart();
  const { searchQuery } = useCourses();
  const [added, setAdded] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);

  const handleAdd = () => {
    addToCart(course);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <>
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-slate-100 flex flex-col h-full group">
      <div className="relative overflow-hidden h-48">
        <img 
           src={course.image} 
           alt={course.name} 
           className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
           onError={(e) => {
             (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80';
           }}
        />
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full font-bold text-slate-800 shadow-sm">
          ₹{course.price}
        </div>
        {course.trailerUrl && (
          <button 
             onClick={() => setShowTrailer(true)}
             className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity"
          >
             <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-brand-600 hover:scale-110 transition-transform">
               <Play size={20} fill="currentColor" className="ml-1" />
             </div>
          </button>
        )}
      </div>
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-lg font-bold text-slate-800 mb-2 leading-tight">
          <HighlightedText text={course.name} highlight={searchQuery} />
        </h3>
        <p className="text-slate-500 text-sm mb-6 flex-grow">
          <HighlightedText text={course.description} highlight={searchQuery} />
        </p>
        <div className="flex gap-2">
          {course.trailerUrl && (
            <button 
              onClick={() => setShowTrailer(true)}
              className="p-3 rounded-xl border border-slate-200 text-slate-600 hover:text-brand-600 hover:border-brand-600 transition-colors"
              title="Watch Trailer"
            >
              <Play size={18} />
            </button>
          )}
          <button 
            onClick={handleAdd}
            disabled={added}
            className={`flex-grow py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
              added 
                ? 'bg-green-100 text-green-700' 
                : 'bg-slate-900 text-white hover:bg-brand-600 shadow-lg shadow-slate-200'
            }`}
          >
            {added ? (
              <><CheckCircle size={18} /> Added</>
            ) : (
              <><ShoppingCart size={18} /> Add to Cart</>
            )}
          </button>
        </div>
      </div>
    </div>
    <VideoModal 
      isOpen={showTrailer} 
      onClose={() => setShowTrailer(false)} 
      url={course.trailerUrl || ''} 
    />
    </>
  );
};

const Home: React.FC = () => {
  const { courses, loading, error, searchQuery, setSearchQuery } = useCourses();

  // Filter Logic
  const filteredCourses = courses.filter(course => 
    course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen">
      <Hero />
      <div id="courses" className="max-w-7xl mx-auto px-4 py-20">
        <div className="flex flex-col items-center mb-16 text-center">
           <span className="text-brand-600 font-semibold tracking-wider text-sm uppercase mb-2">Our Catalog</span>
           <h2 className="text-3xl md:text-4xl font-bold text-slate-900 relative pb-4">
             {searchQuery ? `Search Results for "${searchQuery}"` : "Explore Professional Courses"}
             <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-brand-500 rounded-full"></span>
           </h2>
        </div>
        
        {loading && (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-600"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl max-w-2xl mx-auto mb-8 flex flex-col gap-2">
             <div className="flex items-center gap-2 font-bold">
               <AlertTriangle size={20} />
               <span>Setup Required</span>
             </div>
             <p>{error}</p>
             <div className="text-xs bg-white p-3 rounded border border-red-100 font-mono mt-2 select-all">
                {`match /databases/{database}/documents {
  match /{document=**} {
    allow read, write: if true;
  }
}`}
             </div>
             <p className="text-sm mt-1">Paste the above rules in Firebase Console &gt; Firestore Database &gt; Rules</p>
          </div>
        )}
        
        {!loading && !error && (
          <>
            {courses.length === 0 ? (
              <div className="text-center text-slate-500 py-10">
                No courses available yet. {<br/>} If you are admin, please add some courses via the Admin Panel.
              </div>
            ) : filteredCourses.length === 0 ? (
               <div className="text-center py-20 animate-fade-in">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                    <Search size={36} />
                  </div>
                  <p className="text-xl text-slate-600 font-medium mb-2">No courses found matching "{searchQuery}"</p>
                  <p className="text-slate-400">Try searching for a different keyword or browse our full catalog.</p>
                  <button onClick={() => setSearchQuery('')} className="mt-6 text-brand-600 font-bold hover:underline">Clear Search Filter</button>
               </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {filteredCourses.map((course, index) => (
                   <div key={course.id} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                      <CourseCard course={course} />
                   </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const Cart: React.FC = () => {
  const { items, removeFromCart, total, clearCart } = useCart();
  const navigate = useNavigate();

  const handleCheckout = () => {
    navigate('/payment');
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center pt-20 px-4">
        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6 text-slate-400">
           <ShoppingCart size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Your cart is empty</h2>
        <p className="text-slate-500 mb-8">Looks like you haven't added any courses yet.</p>
        <Link to="/" className="bg-brand-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-brand-700 transition-colors">
          Browse Courses
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-24 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
        <ShoppingCart className="text-brand-600" />
        Shopping Cart
      </h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.cartId} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4 animate-fade-in">
              <img src={item.image} alt={item.name} className="w-20 h-20 rounded-lg object-cover" onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80'; }} />
              <div className="flex-grow">
                <h3 className="font-semibold text-slate-800">{item.name}</h3>
                <p className="text-brand-600 font-bold">₹{item.price}</p>
              </div>
              <button 
                onClick={() => removeFromCart(item.cartId)}
                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                aria-label="Remove"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))}
          <Link to="/" className="inline-flex items-center text-brand-600 font-medium hover:underline mt-4">
             <ArrowLeft size={16} className="mr-2" /> Continue Shopping
          </Link>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 h-fit sticky top-24">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Order Summary</h3>
          <div className="flex justify-between mb-2 text-slate-600">
            <span>Subtotal</span>
            <span>₹{total}</span>
          </div>
          <div className="flex justify-between mb-6 text-slate-600">
            <span>Taxes</span>
            <span>₹0</span>
          </div>
          <div className="border-t border-slate-100 pt-4 flex justify-between mb-8">
            <span className="text-xl font-bold text-slate-900">Total</span>
            <span className="text-xl font-bold text-brand-600">₹{total}</span>
          </div>
          <button 
            onClick={handleCheckout}
            className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-brand-600 transition-colors shadow-lg shadow-brand-500/20"
          >
            Proceed to Payment
          </button>
        </div>
      </div>
    </div>
  );
};

const Payment: React.FC = () => {
  const { total, items, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState(user?.email || '');
  const [name, setName] = useState(user?.username || ''); 
  const [txId, setTxId] = useState('');
  
  // Steps: 'input' -> 'verifying_payment' -> 'sending_email' -> 'success'
  const [status, setStatus] = useState<'input' | 'verifying_payment' | 'sending_email' | 'success'>('input');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (items.length === 0 && status === 'input') navigate('/cart');
  }, [items, navigate, status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txId || !email || !name) return;

    setStatus('verifying_payment');
    
    try {
      // 0. CHECK IF TRANSACTION ID HAS ALREADY BEEN USED
      const existingTxs = await DB.getTransactions();
      const isDuplicate = existingTxs.some(tx => tx.transactionId === txId);
      
      if (isDuplicate) {
        throw new Error("This Transaction ID has already been verified and processed.");
      }

      // 1. SIMULATE VERIFYING TRANSACTION ID WITH BANK
      // In a real app, this would be an API call to verify the payment gateway webhook or status.
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      // If we passed the checks above, we consider it verified
      const isVerified = true; 
      
      // 2. CREATE TRANSACTION IN DATABASE
      // If verified, we set status to CONFIRMED automatically
      const transactionData = {
        userId: user ? user._id : null,
        customerName: name, 
        payerEmail: email,
        transactionId: txId,
        courses: items.map(i => i.name),
        totalAmount: total,
        status: isVerified ? OrderStatus.CONFIRMED : OrderStatus.PENDING
      };

      const newTx = await DB.createTransaction(transactionData);
      
      // 3. SEND THANK YOU EMAIL
      setStatus('sending_email');
      
      const fullTx: Transaction = {
        ...transactionData,
        _id: newTx._id,
        status: newTx.status,
        timestamp: newTx.timestamp
      };

      await EmailService.sendOrderConfirmationEmail(fullTx);

      // 4. SUCCESS
      setStatus('success');
      clearCart();
      
    } catch (error: any) {
      setStatus('input');
      setErrorMessage(error.message);
      alert("Verification Failed: " + error.message);
    }
  };

  if (status === 'success') {
     return (
       <div className="max-w-md mx-auto px-4 py-24 min-h-screen flex flex-col items-center text-center">
         <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-6 animate-bounce">
            <CheckCircle size={40} />
         </div>
         <h2 className="text-3xl font-bold text-slate-900 mb-2">Payment Confirmed!</h2>
         <p className="text-slate-600 mb-6">Thank you for your order, {name}. Your access is ready.</p>
         
         <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 mb-8 w-full">
            <div className="flex items-center gap-3 text-brand-700 font-semibold mb-2">
              <Mail size={20} />
              <span>Receipt Sent</span>
            </div>
            <p className="text-sm text-brand-600 text-left">
              A personalized receipt with your course links has been sent to <b>{email}</b>.
            </p>
         </div>

         <Link to="/" className="bg-slate-900 text-white px-8 py-3 rounded-full font-bold hover:bg-brand-600 transition-colors">
           Start Learning
         </Link>
       </div>
     );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-24 min-h-screen">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
        <h2 className="text-2xl font-bold text-center mb-6">Complete Payment</h2>
        
        {/* Payment Processing & Email Sending States */}
        {(status === 'verifying_payment' || status === 'sending_email') && (
           <div className="absolute inset-0 bg-white/95 z-10 flex flex-col items-center justify-center rounded-2xl p-4 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-600 mb-4"></div>
              {status === 'verifying_payment' && (
                <>
                  <p className="font-bold text-slate-800 text-lg mb-1">Verifying Transaction ID...</p>
                  <p className="text-slate-500 text-sm">Matching with bank records...</p>
                </>
              )}
              {status === 'sending_email' && (
                <>
                  <p className="font-bold text-slate-800 text-lg mb-1 text-green-600">Payment Verified!</p>
                  <p className="text-slate-500 text-sm">Sending course materials to {email}...</p>
                </>
              )}
           </div>
        )}

        <div className="mb-8 flex flex-col items-center">
          <div className="bg-white p-2 rounded-lg border-2 border-slate-100 mb-4">
             {/* Simulated QR Code */}
             <img 
               src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=store@upi&pn=LearnSphere&am=${total}&cu=INR`} 
               alt="Payment QR" 
               className="w-40 h-40"
             />
          </div>
          <p className="text-center text-slate-600 text-sm">Scan with any UPI app to pay <span className="font-bold text-slate-900">₹{total}</span></p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email for Delivery</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all"
              placeholder="you@example.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Transaction ID (UTR)</label>
            <input 
              type="text" 
              required
              minLength={6}
              value={txId}
              onChange={(e) => setTxId(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all"
              placeholder="e.g. 1234567890"
            />
            <p className="text-xs text-slate-400 mt-1">Enter the 12-digit UTR from your payment app</p>
          </div>

          <button 
            type="submit" 
            disabled={status !== 'input'}
            className="w-full bg-brand-600 text-white py-3 rounded-lg font-bold hover:bg-brand-700 transition-colors disabled:opacity-70 flex justify-center shadow-lg shadow-brand-500/20"
          >
            Verify & Download
          </button>
        </form>

        <Link to="/cart" className="block text-center mt-6 text-sm text-slate-500 hover:text-slate-800">
          Cancel and return to cart
        </Link>
      </div>
    </div>
  );
};

const Admin: React.FC = () => {
  const { user } = useAuth();
  const { courses, refreshCourses } = useCourses();
  const [activeTab, setActiveTab] = useState<'transactions' | 'courses'>('transactions');
  
  // Transaction State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refreshTx, setRefreshTx] = useState(0);

  // Course Form State
  const [newCourse, setNewCourse] = useState({ name: '', price: '', image: '', description: '', trailerUrl: '' });
  const [editPriceId, setEditPriceId] = useState<number | null>(null);
  const [editPriceValue, setEditPriceValue] = useState<string>('');

  // Bulk Import State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    // Make DB call async
    DB.getTransactions().then(setTransactions);
  }, [refreshTx]);

  if (!user || user.role !== UserRole.ADMIN) {
    return <Navigate to="/" replace />;
  }

  const handleConfirm = async (id: string) => {
    await DB.confirmTransaction(id);
    setRefreshTx(prev => prev + 1);
  };

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    await DB.addCourse({
      name: newCourse.name,
      price: parseInt(newCourse.price),
      image: newCourse.image || "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80",
      description: newCourse.description,
      trailerUrl: newCourse.trailerUrl
    });
    refreshCourses();
    setNewCourse({ name: '', price: '', image: '', description: '', trailerUrl: '' });
    alert("Course added successfully!");
  };

  const handleDeleteCourse = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this course?")) {
      await DB.deleteCourse(id);
      refreshCourses();
    }
  };
  
  const handleResetDB = async () => {
    if(window.confirm("WARNING: This will overwrite all courses with the default data. Continue?")) {
      await DB.resetCourses();
      refreshCourses();
      alert("Database reset to defaults.");
    }
  };

  const startEditPrice = (course: Course) => {
    setEditPriceId(course.id);
    setEditPriceValue(course.price.toString());
  };

  const savePrice = async (id: number) => {
    await DB.updateCoursePrice(id, parseInt(editPriceValue));
    setEditPriceId(null);
    refreshCourses();
  };

  const handleDownloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,name,price,description,image,trailerUrl\nDemo Course,99,This is a demo description,https://example.com/image.jpg,https://youtube.com/embed/xyz";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "course_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();
    
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string;
        if (!text) throw new Error("File is empty");

        // Simple CSV Parser handling newlines
        const rows = text.split('\n').filter(row => row.trim() !== '');
        const headers = rows[0].split(',').map(h => h.trim().toLowerCase());
        
        const newCourses: Omit<Course, 'id'>[] = [];

        for (let i = 1; i < rows.length; i++) {
          // Simple split logic - Note: this doesn't handle commas inside quotes perfectly without a robust parser lib
          // but works for standard CSVs.
          const values = rows[i].split(',');
          if (values.length < 2) continue; // Skip malformed rows

          const courseObj: any = {};
          
          headers.forEach((header, index) => {
            let val = values[index]?.trim();
            // Remove quotes if present
            if (val && val.startsWith('"') && val.endsWith('"')) {
              val = val.slice(1, -1);
            }
            if (header === 'price') {
              courseObj[header] = parseInt(val) || 0;
            } else {
              courseObj[header] = val || '';
            }
          });

          if (courseObj.name && courseObj.price) {
             // Fallback default image if missing
             if (!courseObj.image) courseObj.image = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80";
             newCourses.push(courseObj as Omit<Course, 'id'>);
          }
        }

        if (newCourses.length > 0) {
          await DB.bulkAddCourses(newCourses);
          refreshCourses();
          alert(`Successfully imported ${newCourses.length} courses!`);
        } else {
          alert("No valid courses found in CSV.");
        }
      } catch (err: any) {
        console.error(err);
        alert("Failed to process CSV: " + err.message);
      } finally {
        setImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    
    reader.readAsText(file);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-24 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
          <Shield className="text-brand-600" /> Admin Dashboard
        </h1>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button 
            onClick={() => setActiveTab('transactions')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'transactions' ? 'bg-white shadow-sm text-brand-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Transactions
          </button>
          <button 
            onClick={() => setActiveTab('courses')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'courses' ? 'bg-white shadow-sm text-brand-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Manage Courses
          </button>
        </div>
      </div>

      {activeTab === 'transactions' ? (
        <div className="bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-end">
             <button onClick={() => setRefreshTx(prev => prev + 1)} className="text-sm text-brand-600 hover:underline flex items-center gap-1">
               <RefreshCw size={14} /> Refresh List
             </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-xs border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Tx ID</th>
                  <th className="px-6 py-4">Courses</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => (
                  <tr key={tx._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(tx.timestamp).toLocaleDateString()}
                      <div className="text-xs text-slate-400">{new Date(tx.timestamp).toLocaleTimeString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{tx.customerName}</div>
                      <div className="text-xs text-slate-400">{tx.payerEmail}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">{tx.transactionId}</td>
                    <td className="px-6 py-4 max-w-xs truncate" title={tx.courses.join(', ')}>
                      {tx.courses.join(', ')}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800">₹{tx.totalAmount}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        tx.status === OrderStatus.CONFIRMED ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {tx.status === OrderStatus.PENDING && (
                        <button 
                          onClick={() => handleConfirm(tx._id)}
                          className="bg-brand-600 text-white px-3 py-1 rounded hover:bg-brand-700 text-xs font-medium"
                        >
                          Confirm
                        </button>
                      )}
                      {tx.status === OrderStatus.CONFIRMED && (
                         <div className="flex items-center text-green-600 gap-1">
                           <Check size={16} /> <span className="text-xs font-bold">Done</span>
                         </div>
                      )}
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                      No transactions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add Course Form */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Plus size={20} /> Add New Course
              </h3>
              <form onSubmit={handleAddCourse} className="space-y-4">
                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Course Name</label>
                   <input 
                     required 
                     value={newCourse.name}
                     onChange={e => setNewCourse({...newCourse, name: e.target.value})}
                     className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm"
                   />
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Price (₹)</label>
                   <input 
                     required 
                     type="number"
                     value={newCourse.price}
                     onChange={e => setNewCourse({...newCourse, price: e.target.value})}
                     className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm"
                   />
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                   <textarea 
                     required 
                     rows={3}
                     value={newCourse.description}
                     onChange={e => setNewCourse({...newCourse, description: e.target.value})}
                     className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm"
                   />
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Image URL</label>
                   <input 
                     placeholder="https://images.unsplash.com/..."
                     value={newCourse.image}
                     onChange={e => setNewCourse({...newCourse, image: e.target.value})}
                     className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm"
                   />
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Youtube Trailer URL</label>
                   <input 
                     placeholder="https://www.youtube.com/embed/..."
                     value={newCourse.trailerUrl}
                     onChange={e => setNewCourse({...newCourse, trailerUrl: e.target.value})}
                     className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm"
                   />
                </div>
                <button type="submit" className="w-full bg-brand-600 text-white py-2 rounded-lg font-semibold hover:bg-brand-700">
                  Add Course
                </button>
              </form>
            </div>
            
            {/* Bulk Upload Section */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <FileText size={20} /> Bulk Import via CSV
              </h3>
              
              <div 
                 className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-brand-500 hover:bg-brand-50 transition-colors cursor-pointer"
                 onClick={() => fileInputRef.current?.click()}
              >
                 <Upload size={32} className="mx-auto text-slate-400 mb-2" />
                 {importing ? (
                    <p className="text-sm font-medium text-brand-600 animate-pulse">Processing CSV...</p>
                 ) : (
                    <>
                       <p className="text-sm font-medium text-slate-700">Click to upload CSV</p>
                       <p className="text-xs text-slate-500 mt-1">Headers: name, price, description, image</p>
                    </>
                 )}
                 <input 
                   type="file" 
                   accept=".csv" 
                   ref={fileInputRef} 
                   onChange={handleFileUpload} 
                   className="hidden" 
                 />
              </div>
              <button 
                onClick={handleDownloadTemplate} 
                className="w-full mt-4 flex items-center justify-center gap-2 text-brand-600 text-sm font-medium hover:underline"
              >
                <Download size={16} /> Download CSV Template
              </button>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-100">
                <h3 className="text-sm font-bold text-slate-500 uppercase mb-2">Danger Zone</h3>
                <button 
                  onClick={handleResetDB} 
                  className="w-full bg-red-50 text-red-600 hover:bg-red-100 py-2 rounded-lg text-sm font-bold transition-colors"
                >
                  Reset Course Database to Defaults
                </button>
                <p className="text-xs text-center text-slate-400 mt-2">Use this if images or data are broken</p>
            </div>
          </div>

          {/* Course List */}
          <div className="lg:col-span-2 space-y-4">
             {courses.map(course => (
               <div key={course.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                 <img src={course.image} alt={course.name} className="w-16 h-16 rounded object-cover" />
                 <div className="flex-grow">
                   <h4 className="font-bold text-slate-800">{course.name}</h4>
                   <p className="text-xs text-slate-500 truncate max-w-md">{course.description}</p>
                   
                   <div className="mt-2 flex items-center gap-2">
                     {editPriceId === course.id ? (
                        <div className="flex items-center gap-2">
                          <input 
                            type="number" 
                            value={editPriceValue}
                            onChange={e => setEditPriceValue(e.target.value)}
                            className="w-20 px-2 py-1 border rounded text-sm"
                          />
                          <button onClick={() => savePrice(course.id)} className="text-green-600 hover:bg-green-50 p-1 rounded">
                            <Save size={16} />
                          </button>
                          <button onClick={() => setEditPriceId(null)} className="text-red-600 hover:bg-red-50 p-1 rounded">
                            <XCircle size={16} />
                          </button>
                        </div>
                     ) : (
                        <div className="flex items-center gap-2 text-sm">
                           <span className="font-bold text-brand-600">₹{course.price}</span>
                           <button onClick={() => startEditPrice(course)} className="text-slate-400 hover:text-brand-600" title="Edit Price">
                             <Edit2 size={14} />
                           </button>
                        </div>
                     )}
                   </div>
                 </div>
                 <button 
                   onClick={() => handleDeleteCourse(course.id)}
                   className="text-slate-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors"
                   title="Remove Course"
                 >
                   <Trash2 size={20} />
                 </button>
               </div>
             ))}
          </div>
        </div>
      )}
    </div>
  );
};

const AuthForms: React.FC<{ type: 'login' | 'register' }> = ({ type }) => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Sanitize inputs to prevent whitespace errors
    const emailClean = formData.email.trim();
    const usernameClean = formData.username.trim();
    const passwordClean = formData.password;

    try {
      if (type === 'register') {
        if (passwordClean !== formData.confirmPassword) throw new Error("Passwords do not match");
        const newUser = await DB.registerUser({ 
          username: usernameClean, 
          email: emailClean, 
          passwordHash: passwordClean 
        });
        login(newUser);
      } else {
        const user = await DB.loginUser(emailClean, passwordClean);
        login(user);
      }
      navigate('/');
    } catch (err: any) {
      console.error("Auth Error:", err);
      const msg = err.message || '';

      // Map Firebase error codes to user-friendly messages
      if (msg.includes('auth/configuration-not-found') || msg.includes('auth/operation-not-allowed')) {
        setError('Setup Required: Enable Email/Password in Firebase Console > Authentication.');
      } else if (msg.includes('auth/invalid-credential')) {
        setError('Login failed. Incorrect email/password or account does not exist.');
      } else if (msg.includes('auth/invalid-email')) {
        setError('Invalid email address format.');
      } else if (msg.includes('auth/email-already-in-use')) {
        setError('Email is already registered. Please login.');
      } else if (msg.includes('auth/weak-password')) {
        setError('Password must be at least 6 characters.');
      } else if (msg.includes('auth/network-request-failed')) {
        setError('Network error. Check your internet connection.');
      } else {
        setError(msg.replace('Firebase: ', '').replace('Error ', '').replace(/\(auth\/.*\)\.?/, ''));
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-24 px-4 bg-slate-50">
      <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-xl border border-slate-100">
        <h2 className="text-3xl font-bold text-center mb-2 text-slate-800">{type === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
        <p className="text-center text-slate-500 mb-8">{type === 'login' ? 'Access your courses' : 'Join LearnSphere today'}</p>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm flex items-start gap-2">
            <AlertTriangle className="flex-shrink-0 mt-0.5" size={16} /> 
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {type === 'register' && (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Username</label>
              <input name="username" type="text" required onChange={handleChange} className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none" />
            </div>
          )}
          
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{type === 'login' ? 'Email or Username' : 'Email'}</label>
            <input name="email" type="email" required onChange={handleChange} className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none" />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
            <input name="password" type="password" required onChange={handleChange} className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none" />
          </div>

          {type === 'register' && (
             <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Confirm Password</label>
               <input name="confirmPassword" type="password" required onChange={handleChange} className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none" />
             </div>
          )}

          <button type="submit" className="w-full bg-brand-600 text-white py-3 rounded-lg font-bold hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/20 mt-4">
            {type === 'login' ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center mt-6 text-slate-500 text-sm">
          {type === 'login' ? "Don't have an account?" : "Already have an account?"} 
          <Link to={type === 'login' ? "/register" : "/login"} className="text-brand-600 font-bold hover:underline ml-1">
            {type === 'login' ? 'Register' : 'Login'}
          </Link>
        </p>
      </div>
    </div>
  );
};

// --- Providers ---

const CourseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const refreshCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await DB.getCourses();
      setCourses(data);
      // Auto-seed if empty and no error
      if (data.length === 0) {
        await DB.seedCourses();
        const seededData = await DB.getCourses();
        setCourses(seededData);
      }
    } catch (err: any) {
      console.error(err);
      if (err.message.includes('Missing or insufficient permissions')) {
        setError('Missing Permissions: You need to set up Firestore Security Rules in Firebase Console.');
      } else {
        setError('Failed to load courses. ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshCourses();
  }, []);

  return (
    <CourseContext.Provider value={{ courses, refreshCourses, loading, error, searchQuery, setSearchQuery }}>
      {children}
    </CourseContext.Provider>
  );
};

const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  
  useEffect(() => {
    // Persist login (basic implementation)
    const storedUser = localStorage.getItem('learnsphere_active_user');
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  const login = (u: User) => {
    setUser(u);
    localStorage.setItem('learnsphere_active_user', JSON.stringify(u));
  };

  const logout = () => {
    DB.logoutUser();
    setUser(null);
    localStorage.removeItem('learnsphere_active_user');
  };

  // Cart State
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const storedCart = localStorage.getItem('learnsphere_cart');
    if (storedCart) setCartItems(JSON.parse(storedCart));
  }, []);

  useEffect(() => {
    localStorage.setItem('learnsphere_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (course: Course) => {
    setCartItems(prev => [...prev, { ...course, cartId: Math.random().toString(36).substr(2, 9) }]);
  };

  const removeFromCart = (cartId: string) => {
    setCartItems(prev => prev.filter(item => item.cartId !== cartId));
  };

  const clearCart = () => setCartItems([]);

  const total = cartItems.reduce((sum, item) => sum + item.price, 0);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      <CourseProvider>
        <CartContext.Provider value={{ items: cartItems, addToCart, removeFromCart, clearCart, total }}>
          {children}
        </CartContext.Provider>
      </CourseProvider>
    </AuthContext.Provider>
  );
};

// --- Main Layout ---

const Layout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/login" element={<AuthForms type="login" />} />
          <Route path="/register" element={<AuthForms type="register" />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

// --- App Root ---

const App: React.FC = () => {
  return (
    <HashRouter>
      <AppProvider>
        <Layout />
      </AppProvider>
    </HashRouter>
  );
};

export default App;