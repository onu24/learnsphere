import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, Link, useNavigate, useParams } from 'react-router-dom';
import { User, CartItem, UserRole, AuthState, Course, Transaction, Review } from './types';
import { HERO_SLIDES } from './constants';
import * as DB from './services/firebase';
import * as EmailService from './services/email';
import { ShoppingCart, LogOut, Menu, X, Shield, BookOpen, Trash2, CheckCircle, AlertTriangle, Play, Mail, Check, RefreshCw, Search, XCircle, Heart, Download, ChevronLeft, ChevronRight, Lock, Plus, Save, FileText, Upload, Info, TrendingUp, Users, DollarSign, User as UserIcon, ArrowRight, LayoutDashboard } from 'lucide-react';

// --- Types & Contexts ---

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

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
  toggleWishlist: (courseId: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- Hooks ---
const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a ToastProvider");
  return context;
};

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

// --- UI Primitives ---

const Skeleton = ({ className }: { className: string }) => (
  <div className={`animate-pulse bg-slate-200 rounded ${className}`}></div>
);

const ToastContainer = ({ toasts, removeToast }: { toasts: ToastMessage[], removeToast: (id: string) => void }) => {
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <div 
          key={toast.id}
          className={`pointer-events-auto min-w-[300px] max-w-sm bg-white p-4 rounded-xl shadow-xl border-l-4 flex items-center gap-3 animate-slide-up transform transition-all duration-300 ${
            toast.type === 'success' ? 'border-green-500' :
            toast.type === 'error' ? 'border-red-500' : 'border-blue-500'
          }`}
        >
           <div className={`rounded-full p-1 ${
             toast.type === 'success' ? 'bg-green-100 text-green-600' :
             toast.type === 'error' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
           }`}>
             {toast.type === 'success' ? <CheckCircle size={18} /> :
              toast.type === 'error' ? <AlertTriangle size={18} /> : <Info size={18} />}
           </div>
           <p className="text-slate-700 font-medium text-sm">{toast.message}</p>
           <button onClick={() => removeToast(toast.id)} className="ml-auto text-slate-400 hover:text-slate-600">
             <X size={16} />
           </button>
        </div>
      ))}
    </div>
  );
};

const HighlightedText = ({ text, highlight }: { text: string, highlight: string }) => {
  if (!highlight.trim()) return <>{text}</>;
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

const StarRating = ({ rating, size = 16, interactive = false, onRate }: { rating: number, size?: number, interactive?: boolean, onRate?: (r: number) => void }) => {
  const [hoverRating, setHoverRating] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onRate && onRate(star)}
          onMouseEnter={() => interactive && setHoverRating(star)}
          onMouseLeave={() => interactive && setHoverRating(0)}
          className={`${interactive ? 'cursor-pointer' : 'cursor-default'} focus:outline-none transition-transform ${interactive && hoverRating >= star ? 'scale-110' : ''}`}
        >
          <svg 
            width={size} 
            height={size} 
            viewBox="0 0 24 24" 
            fill={(interactive ? (hoverRating || rating) : rating) >= star ? "#fbbf24" : "none"} 
            stroke={(interactive ? (hoverRating || rating) : rating) >= star ? "#fbbf24" : "#cbd5e1"}
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </button>
      ))}
    </div>
  );
};

const SimpleBarChart = ({ data }: { data: { label: string, value: number }[] }) => {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end justify-between gap-2 h-48 w-full pb-6 select-none">
      {data.map((item, idx) => (
        <div key={idx} className="flex flex-col items-center flex-1 h-full justify-end group">
           <div className="relative w-full flex justify-center h-full items-end px-1">
             <div 
               className="w-full max-w-[40px] bg-brand-200 hover:bg-brand-500 transition-all duration-500 rounded-t-md relative group-hover:shadow-lg"
               style={{ height: `${(item.value / maxValue) * 100}%` }}
             >
               <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none shadow-lg">
                 ₹{item.value}
               </div>
             </div>
           </div>
           <span className="text-[10px] text-slate-400 mt-2 truncate w-full text-center px-1" title={item.label}>
             {item.label.length > 8 ? item.label.substring(0, 6) + '..' : item.label}
           </span>
        </div>
      ))}
    </div>
  );
};

// --- Common Components ---

const Navbar: React.FC = () => {
  const { items } = useCart();
  const { user, logout } = useAuth();
  const { searchQuery, setSearchQuery } = useCourses();
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (e.target.value && location.pathname !== '/') navigate('/');
  };

  const navLinkClass = (path: string) => `
    relative text-sm font-medium transition-all duration-300 py-1
    ${location.pathname === path ? 'text-brand-600' : 'text-slate-600 hover:text-brand-600'}
    hover:-translate-y-0.5
    after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-0.5 after:bottom-0 after:left-0 after:bg-brand-600 after:origin-bottom-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-bottom-left
    ${location.pathname === path ? 'after:scale-x-100 after:origin-bottom-left' : ''}
  `;

  return (
    <nav className="fixed w-full z-50 glass-nav shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-6 flex-1">
            <Link to="/" className="flex items-center space-x-2 flex-shrink-0 group hover:scale-105 transition-transform duration-300">
              <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold text-xl group-hover:bg-brand-700 transition-colors">L</div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-700 to-brand-500 hidden sm:block">LearnSphere</span>
            </Link>

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
                  <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600">
                    <XCircle size={16} fill="currentColor" className="text-slate-300 hover:text-slate-500" />
                  </button>
                )}
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className={navLinkClass('/')}>Courses</Link>
            {user && (
              <>
                <Link to="/my-courses" className={navLinkClass('/my-courses')}>
                   <div className="flex items-center space-x-1"><BookOpen size={18} /><span>My Courses</span></div>
                </Link>
                <Link to="/wishlist" className={navLinkClass('/wishlist')}>
                   <div className="flex items-center space-x-1"><Heart size={18} className={user.wishlist?.length ? "fill-red-500 text-red-500" : ""} /><span>Wishlist</span></div>
                </Link>
              </>
            )}
            
            <Link to="/cart" className="relative group hover:scale-105 transition-transform duration-300">
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
                   <Link to="/admin" className="text-brand-600 hover:text-brand-800 font-medium flex items-center gap-1 hover:scale-105 transition-transform">
                     <Shield size={16} /> Admin
                   </Link>
                 )}
                 <button onClick={logout} className="text-slate-500 hover:text-red-500 transition-all duration-300 hover:scale-110">
                   <LogOut size={20} />
                 </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login" className="text-slate-600 hover:text-brand-600 font-medium hover:-translate-y-0.5 transition-transform duration-300">Login</Link>
                <Link to="/register" className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2 rounded-full font-medium transition-all shadow-md hover:shadow-lg text-sm hover:-translate-y-0.5">Register</Link>
              </div>
            )}
          </div>
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-slate-600">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>
      {isOpen && (
        <div className="md:hidden bg-white border-b border-slate-100 px-4 py-4 space-y-4 shadow-lg animate-fade-in">
          <input type="text" value={searchQuery} onChange={handleSearch} placeholder="Search..." className="block w-full px-4 py-2 border rounded-lg" />
          <Link to="/" onClick={() => setIsOpen(false)} className="block text-slate-600">Courses</Link>
          {user && <Link to="/my-courses" onClick={() => setIsOpen(false)} className="block text-slate-600">My Courses</Link>}
          <Link to="/cart" onClick={() => setIsOpen(false)} className="block text-slate-600">Cart ({items.length})</Link>
          {user ? (
            <button onClick={() => { logout(); setIsOpen(false); }} className="block text-red-500 w-full text-left">Logout</button>
          ) : (
            <Link to="/login" onClick={() => setIsOpen(false)} className="block text-brand-600">Login</Link>
          )}
        </div>
      )}
    </nav>
  );
};

const Hero: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [key, setKey] = useState(0);
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    setKey(k => k + 1); 
  };
  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
    setKey(k => k + 1);
  };

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [key]);

  return (
    <div className="relative h-[500px] w-full overflow-hidden bg-slate-900 group">
      {HERO_SLIDES.map((slide, index) => (
        <div key={slide.id} className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}>
          <div className="absolute inset-0 bg-black/50 z-10" />
          <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center text-white px-4">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 animate-slide-up">{slide.title}</h1>
            <p className="text-xl md:text-2xl text-slate-200 mb-8 max-w-2xl animate-fade-in">{slide.subtitle}</p>
            <button className="bg-brand-600 hover:bg-brand-700 text-white px-8 py-3 rounded-full font-semibold transition-all shadow-lg">
              {slide.cta}
            </button>
          </div>
        </div>
      ))}
      <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-white/10 text-white hover:bg-white/30 backdrop-blur-sm"><ChevronLeft size={32} /></button>
      <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-white/10 text-white hover:bg-white/30 backdrop-blur-sm"><ChevronRight size={32} /></button>
    </div>
  );
};

const VideoModal: React.FC<{ url: string; isOpen: boolean; onClose: () => void }> = ({ url, isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 animate-fade-in">
       <div className="relative w-full max-w-4xl bg-black rounded-xl overflow-hidden shadow-2xl aspect-video">
          <button onClick={onClose} className="absolute top-4 right-4 text-white hover:text-red-500 z-10 bg-black/50 p-2 rounded-full"><X size={24} /></button>
          <iframe src={url} className="absolute inset-0 w-full h-full" title="Trailer" allowFullScreen></iframe>
       </div>
    </div>
  );
};

const CourseCard: React.FC<{ course: Course }> = ({ course }) => {
  const { addToCart } = useCart();
  const { searchQuery } = useCourses();
  const { user, toggleWishlist } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [showTrailer, setShowTrailer] = useState(false);
  const isWishlisted = user?.wishlist?.includes(course.id);

  return (
    <>
    <div onClick={() => navigate(`/course/${course.id}`)} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] border border-slate-100 hover:border-brand-500 flex flex-col h-full group cursor-pointer relative">
      <div className="relative h-48 overflow-hidden">
        <img src={course.image} alt={course.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" onError={(e) => (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80'} />
        <div className="absolute top-4 right-4 bg-white/95 px-3 py-1 rounded-full font-bold text-slate-800 shadow-sm group-hover:bg-brand-600 group-hover:text-white transition-colors z-10">₹{course.price}</div>
        <button onClick={(e) => { e.stopPropagation(); user ? toggleWishlist(course.id) : navigate('/login'); }} className="absolute top-4 left-4 p-2 rounded-full bg-white/90 hover:bg-white text-slate-400 hover:text-red-500 transition-colors shadow-sm z-10">
           <Heart size={18} className={isWishlisted ? "fill-red-500 text-red-500" : ""} />
        </button>
        {course.trailerUrl && (
          <div onClick={(e) => { e.stopPropagation(); setShowTrailer(true); }} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-[1px]">
             <div className="flex flex-col items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform">
                <div className="w-12 h-12 bg-brand-600 rounded-full flex items-center justify-center text-white shadow-lg"><Play size={22} fill="currentColor" className="ml-1" /></div>
                <span className="text-white text-xs font-bold uppercase tracking-wide bg-black/50 px-2 py-1 rounded">Watch Trailer</span>
             </div>
          </div>
        )}
      </div>
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-lg font-bold text-slate-800 mb-1 leading-tight group-hover:text-brand-600 transition-colors">
          <HighlightedText text={course.name} highlight={searchQuery} />
        </h3>
        <p className="text-slate-500 text-sm mb-6 flex-grow line-clamp-2"><HighlightedText text={course.description} highlight={searchQuery} /></p>
        <button onClick={(e) => { e.stopPropagation(); addToCart(course); showToast(`Added ${course.name}`, 'success'); }} className="w-full bg-slate-900 text-white hover:bg-brand-600 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200">
           <ShoppingCart size={18} /> Add to Cart
        </button>
      </div>
    </div>
    <VideoModal isOpen={showTrailer} onClose={() => setShowTrailer(false)} url={course.trailerUrl || ''} />
    </>
  );
};

// --- Page Components ---

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await DB.loginUser(email, password);
      login(user);
      navigate('/');
    } catch (err: any) {
      if (err.message.includes("auth/invalid-credential")) {
        setError("Invalid email or password. For Admin, ensure you registered first.");
      } else if (err.message.includes("auth/configuration-not-found")) {
        setError("Login Disabled: Enable Email/Pass in Firebase Console.");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-brand-50 flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-brand-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
      
      <div className="max-w-md w-full bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/50 relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 text-white mb-6 shadow-lg shadow-brand-200">
             <UserIcon size={32} />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Welcome Back</h2>
          <p className="text-slate-500 mt-2">Access your professional courses</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm mb-6 flex items-start gap-2 animate-fade-in">
             <AlertTriangle size={18} className="mt-0.5 flex-shrink-0" />
             <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Email</label>
            <div className="relative group">
               <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-brand-500 transition-colors">
                  <Mail size={20} />
               </div>
               <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="block w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition-all font-medium" placeholder="name@company.com" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Password</label>
            <div className="relative group">
               <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-brand-500 transition-colors">
                  <Lock size={20} />
               </div>
               <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="block w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition-all font-medium" placeholder="••••••••" />
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-brand-200 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2">
            {loading ? <RefreshCw className="animate-spin" /> : 'Sign In'}
          </button>
        </form>
        <p className="mt-8 text-center text-slate-500 text-sm">
          Don't have an account? <Link to="/register" className="text-brand-600 font-bold hover:underline">Register</Link>
        </p>
      </div>
    </div>
  );
};

const Register: React.FC = () => {
  const [formData, setFormData] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) return setError("Passwords don't match");
    setLoading(true);
    try {
      const user = await DB.registerUser({ username: formData.username, email: formData.email, passwordHash: formData.password });
      login(user);
      navigate('/');
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-3xl font-bold text-center text-slate-800 mb-8">Create Account</h2>
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="Username" required value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full p-3 border rounded-lg" />
          <input type="email" placeholder="Email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-3 border rounded-lg" />
          <input type="password" placeholder="Password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full p-3 border rounded-lg" />
          <input type="password" placeholder="Confirm Password" required value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} className="w-full p-3 border rounded-lg" />
          <button type="submit" disabled={loading} className="w-full bg-brand-600 text-white py-3 rounded-lg font-bold">Register</button>
        </form>
        <p className="mt-4 text-center text-slate-600">Already have an account? <Link to="/login" className="text-brand-600 font-bold">Login</Link></p>
      </div>
    </div>
  );
};

const Home: React.FC = () => {
  const { courses, loading, searchQuery } = useCourses();
  
  // Filter courses based on search query
  const filteredCourses = courses.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="pt-16 min-h-screen bg-slate-50 pb-20">
      <Hero />
      <div id="courses" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Featured Courses</h2>
            <p className="text-slate-500 mt-2">Expert-led courses to boost your career</p>
          </div>
          <span className="text-sm font-medium text-slate-400">{filteredCourses.length} results</span>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
             {[1,2,3,4].map(i => <div key={i} className="bg-white rounded-2xl h-96 animate-pulse bg-slate-200"></div>)}
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
            <Search className="mx-auto h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900">No courses found</h3>
            <p className="text-slate-500">Try adjusting your search terms.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {filteredCourses.map(course => <CourseCard key={course.id} course={course} />)}
          </div>
        )}
      </div>
    </div>
  );
};

const CourseDetails: React.FC = () => {
  const { id } = useParams();
  const { courses } = useCourses();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const [course, setCourse] = useState<Course | null>(null);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  
  useEffect(() => {
    const found = courses.find(c => c.id === Number(id));
    if (found) {
        setCourse(found);
        if (user) {
            DB.hasUserPurchasedCourse(user._id, found.name).then(setHasPurchased);
        }
        DB.getReviews(found.id).then(setReviews);
    }
  }, [id, courses, user]);

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !course) return;
    const review: Review = {
        courseId: course.id,
        userId: user._id,
        userName: user.username,
        rating: newReview.rating,
        comment: newReview.comment,
        date: new Date().toISOString()
    };
    await DB.addReview(review);
    setReviews([review, ...reviews]);
    setNewReview({ rating: 5, comment: '' });
    showToast('Review submitted!', 'success');
  };

  if (!course) return <div className="pt-24 text-center">Loading...</div>;

  return (
    <div className="pt-24 min-h-screen pb-12 bg-slate-50">
       <div className="max-w-7xl mx-auto px-4">
          <div className="bg-white rounded-3xl overflow-hidden shadow-xl">
             <div className="h-[400px] relative">
                <img src={course.image} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-8">
                   <div className="text-white">
                      <h1 className="text-4xl font-bold mb-2">{course.name}</h1>
                      <p className="text-xl opacity-90">{course.instructor} • ⭐ {reviews.length > 0 ? (reviews.reduce((a,b)=>a+b.rating,0)/reviews.length).toFixed(1) : 'New'}</p>
                   </div>
                </div>
             </div>
             <div className="p-8 grid md:grid-cols-3 gap-12">
                <div className="md:col-span-2 space-y-8">
                   <div>
                      <h3 className="text-2xl font-bold mb-4">About this course</h3>
                      <p className="text-slate-600 leading-relaxed text-lg">{course.description}</p>
                   </div>
                   <div>
                      <h3 className="text-2xl font-bold mb-4">Reviews ({reviews.length})</h3>
                      {hasPurchased && (
                          <form onSubmit={submitReview} className="bg-slate-50 p-6 rounded-xl mb-8">
                              <h4 className="font-bold mb-4">Write a Review</h4>
                              <div className="mb-4"><StarRating rating={newReview.rating} interactive onRate={r => setNewReview({...newReview, rating: r})} size={24} /></div>
                              <textarea className="w-full p-3 rounded-lg border mb-4" rows={3} placeholder="Share your experience..." value={newReview.comment} onChange={e => setNewReview({...newReview, comment: e.target.value})} required></textarea>
                              <button type="submit" className="bg-brand-600 text-white px-6 py-2 rounded-lg font-bold">Post Review</button>
                          </form>
                      )}
                      <div className="space-y-6">
                          {reviews.map((r, i) => (
                              <div key={i} className="border-b pb-6">
                                  <div className="flex items-center gap-2 mb-2">
                                      <div className="font-bold">{r.userName}</div>
                                      <StarRating rating={r.rating} />
                                      <div className="text-sm text-slate-400">{new Date(r.date).toLocaleDateString()}</div>
                                  </div>
                                  <p className="text-slate-600">{r.comment}</p>
                              </div>
                          ))}
                      </div>
                   </div>
                </div>
                <div className="md:col-span-1">
                    <div className="bg-slate-50 p-6 rounded-2xl sticky top-24">
                        <div className="text-4xl font-bold text-slate-900 mb-6">₹{course.price}</div>
                        <button onClick={() => { addToCart(course); showToast('Added to cart', 'success'); }} className="w-full bg-brand-600 text-white py-4 rounded-xl font-bold hover:bg-brand-700 transition-colors mb-4 shadow-lg shadow-brand-200">Add to Cart</button>
                        <ul className="space-y-3 text-slate-600 mb-6">
                            <li className="flex items-center gap-2"><Check size={18} className="text-green-500" /> Full lifetime access</li>
                            <li className="flex items-center gap-2"><Check size={18} className="text-green-500" /> Certificate of completion</li>
                            <li className="flex items-center gap-2"><Check size={18} className="text-green-500" /> Premium support</li>
                        </ul>
                    </div>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
};

const Cart: React.FC = () => {
  const { items, removeFromCart, total, clearCart } = useCart();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pt-24 pb-12 bg-slate-50 px-4">
       <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">Shopping Cart ({items.length})</h2>
          {items.length === 0 ? (
             <div className="text-center py-20 bg-white rounded-2xl">
                <ShoppingCart size={48} className="mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500 mb-4">Your cart is empty</p>
                <Link to="/" className="text-brand-600 font-bold hover:underline">Browse Courses</Link>
             </div>
          ) : (
             <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-4">
                   {items.map(item => (
                      <div key={item.cartId} className="bg-white p-4 rounded-xl flex gap-4 items-center shadow-sm">
                         <img src={item.image} className="w-24 h-24 object-cover rounded-lg" />
                         <div className="flex-grow">
                            <h3 className="font-bold text-slate-800">{item.name}</h3>
                            <p className="text-slate-500 text-sm">{item.instructor}</p>
                            <div className="font-bold text-brand-600 mt-1">₹{item.price}</div>
                         </div>
                         <button onClick={() => removeFromCart(item.cartId)} className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={20} /></button>
                      </div>
                   ))}
                </div>
                <div className="h-fit bg-white p-6 rounded-2xl shadow-sm">
                   <h3 className="text-xl font-bold mb-4">Summary</h3>
                   <div className="flex justify-between mb-2"><span>Subtotal</span><span>₹{total}</span></div>
                   <div className="flex justify-between font-bold text-xl pt-4 border-t mt-4 mb-6"><span>Total</span><span>₹{total}</span></div>
                   <button onClick={() => navigate('/checkout')} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800">Checkout</button>
                </div>
             </div>
          )}
       </div>
    </div>
  );
};

const Checkout: React.FC = () => {
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ name: user?.username || '', email: user?.email || '', transactionId: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const transaction = await DB.createTransaction({
        userId: user ? user._id : null,
        customerName: formData.name,
        payerEmail: formData.email,
        transactionId: formData.transactionId,
        courses: items.map(i => i.name),
        totalAmount: total
      });
      await EmailService.sendOrderConfirmationEmail(transaction);
      clearCart();
      setSuccess(true);
      showToast('Payment Verified & Confirmed!', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally { setLoading(false); }
  };

  if (success) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"><Check size={32} className="text-green-600" /></div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Payment Confirmed!</h2>
        <p className="text-slate-600 mb-6">Your order has been automatically verified.</p>
        <Link to="/" className="block w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-brand-600">Start Learning</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12 px-4">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-lg border border-slate-100">
         <h2 className="text-2xl font-bold mb-6">Secure Checkout</h2>
         <div className="flex items-center gap-4 mb-8">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-brand-600 text-white' : 'bg-slate-200'}`}>1</div>
            <div className="h-1 flex-grow bg-slate-100"><div className={`h-full bg-brand-600 transition-all ${step === 2 ? 'w-full' : 'w-0'}`}></div></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 2 ? 'bg-brand-600 text-white' : 'bg-slate-200'}`}>2</div>
         </div>

         {step === 1 ? (
           <form onSubmit={(e) => { e.preventDefault(); setStep(2); }}>
             <div className="space-y-4">
               <input type="text" placeholder="Full Name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-3 border rounded-lg" />
               <input type="email" placeholder="Email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-3 border rounded-lg" />
               <button type="submit" className="w-full bg-brand-600 text-white py-3 rounded-xl font-bold">Next</button>
             </div>
           </form>
         ) : (
           <form onSubmit={handleSubmit}>
             <div className="mb-6 bg-yellow-50 p-4 rounded-lg text-sm text-yellow-800 border border-yellow-100 flex items-start gap-2">
               <AlertTriangle size={16} className="mt-0.5" /> 
               <p><strong>Auto-Confirmation Demo:</strong> Enter a unique Transaction ID. The system will instantly match and confirm your order.</p>
             </div>
             <input type="text" placeholder="Transaction ID (e.g., UPI Ref)" required value={formData.transactionId} onChange={e => setFormData({...formData, transactionId: e.target.value})} className="w-full p-3 border rounded-lg mb-6 font-mono" />
             <div className="flex gap-4">
               <button type="button" onClick={() => setStep(1)} className="flex-1 border py-3 rounded-xl font-bold">Back</button>
               <button type="submit" disabled={loading} className="flex-[2] bg-brand-600 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2">
                 {loading ? <RefreshCw className="animate-spin" /> : <>Confirm Payment <ArrowRight size={18} /></>}
               </button>
             </div>
           </form>
         )}
      </div>
    </div>
  );
};

const MyCourses: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      DB.getUserPurchasedCourses(user._id).then(setCourses).finally(() => setLoading(false));
    }
  }, [user]);

  if (loading) return <div className="pt-24 px-8 max-w-7xl mx-auto grid grid-cols-3 gap-8">{[1,2,3].map(i => <div key={i} className="h-64 bg-slate-200 animate-pulse rounded-2xl"></div>)}</div>;

  return (
    <div className="min-h-screen pt-24 pb-12 bg-slate-50 px-4">
       <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 flex items-center gap-2"><BookOpen className="text-brand-600" /> My Learning</h2>
          {courses.length === 0 ? (
             <div className="bg-white p-12 rounded-2xl text-center">
                <p>You haven't purchased any courses yet.</p>
                <Link to="/" className="text-brand-600 font-bold mt-4 inline-block">Browse Courses</Link>
             </div>
          ) : (
             <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {courses.map(course => (
                   <div key={course.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all border border-slate-100">
                      <div className="h-48 bg-slate-200 relative">
                         <img src={course.image} className="w-full h-full object-cover" />
                         <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
                            <Play size={48} className="text-white fill-white" />
                         </div>
                      </div>
                      <div className="p-6">
                         <h3 className="font-bold text-lg mb-2">{course.name}</h3>
                         <div className="w-full bg-slate-100 h-2 rounded-full mb-4 overflow-hidden">
                            <div className="bg-green-500 h-full w-[0%] animate-slide-up" style={{ width: `${Math.random() * 60 + 10}%` }}></div>
                         </div>
                         <div className="flex gap-2">
                             <button className="flex-1 bg-brand-600 text-white py-2 rounded-lg font-medium text-sm">Continue Learning</button>
                             <button className="flex-1 border border-slate-200 py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-1 hover:bg-slate-50"><Download size={16} /> Resources</button>
                         </div>
                      </div>
                   </div>
                ))}
             </div>
          )}
       </div>
    </div>
  );
};

const Wishlist: React.FC = () => {
  const { user, toggleWishlist } = useAuth();
  const { courses } = useCourses();
  const wishlistedCourses = courses.filter(c => user?.wishlist?.includes(c.id));

  return (
    <div className="min-h-screen pt-24 pb-12 bg-slate-50 px-4">
       <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 flex items-center gap-2"><Heart className="text-red-500 fill-red-500" /> My Wishlist</h2>
          {wishlistedCourses.length === 0 ? (
             <div className="text-center py-12">No items in wishlist.</div>
          ) : (
             <div className="grid md:grid-cols-4 gap-6">
                {wishlistedCourses.map(course => <CourseCard key={course.id} course={course} />)}
             </div>
          )}
       </div>
    </div>
  );
};

const Admin: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { courses, refreshCourses } = useCourses();
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'courses'>('overview');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Course State
  const [newCourse, setNewCourse] = useState({ name: '', price: '', description: '', image: '', trailerUrl: '' });
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    const txs = await DB.getTransactions();
    setTransactions(txs);
    setLoading(false);
  };

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        await DB.addCourse({
            name: newCourse.name,
            price: Number(newCourse.price),
            description: newCourse.description,
            image: newCourse.image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3',
            trailerUrl: newCourse.trailerUrl,
            instructor: "Admin Instructor"
        });
        showToast('Course Added Successfully', 'success');
        refreshCourses();
        setShowAddForm(false);
        setNewCourse({ name: '', price: '', description: '', image: '', trailerUrl: '' });
    } catch (e) {
        showToast('Failed to add course', 'error');
    }
  };

  if (!user || user.role !== UserRole.ADMIN) return <Navigate to="/login" />;

  // Metrics
  const totalRevenue = transactions.filter(t => t.status === 'Confirmed').reduce((acc, curr) => acc + curr.totalAmount, 0);
  const totalOrders = transactions.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  
  // Revenue per Course Data (Mock calculation based on transactions)
  const courseRevenueMap: Record<string, number> = {};
  transactions.forEach(tx => {
     if(tx.status === 'Confirmed') {
         const split = tx.totalAmount / tx.courses.length;
         tx.courses.forEach(c => {
             courseRevenueMap[c] = (courseRevenueMap[c] || 0) + split;
         });
     }
  });
  const chartData = Object.keys(courseRevenueMap).map(k => ({ label: k, value: Math.round(courseRevenueMap[k]) })).slice(0, 6);

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-12 flex">
       {/* Sidebar */}
       <aside className="w-64 bg-white fixed h-full border-r hidden md:block pt-6">
          <div className="px-6 mb-8 text-xs font-bold text-slate-400 uppercase tracking-wider">Main Menu</div>
          <nav className="space-y-1 px-3">
             <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${activeTab === 'overview' ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                <LayoutDashboard size={18} /> Overview
             </button>
             <button onClick={() => setActiveTab('transactions')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${activeTab === 'transactions' ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                <DollarSign size={18} /> Transactions
             </button>
             <button onClick={() => setActiveTab('courses')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${activeTab === 'courses' ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                <BookOpen size={18} /> Manage Courses
             </button>
          </nav>
       </aside>

       <main className="flex-1 md:ml-64 p-8">
          {activeTab === 'overview' && (
             <div className="space-y-8 animate-fade-in">
                <h1 className="text-2xl font-bold text-slate-800">Dashboard Overview</h1>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                      <div className="p-3 bg-green-100 text-green-600 rounded-xl"><DollarSign size={24} /></div>
                      <div><p className="text-slate-500 text-sm">Total Revenue</p><h3 className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</h3></div>
                   </div>
                   <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                      <div className="p-3 bg-blue-100 text-blue-600 rounded-xl"><Users size={24} /></div>
                      <div><p className="text-slate-500 text-sm">Total Orders</p><h3 className="text-2xl font-bold">{totalOrders}</h3></div>
                   </div>
                   <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                      <div className="p-3 bg-purple-100 text-purple-600 rounded-xl"><TrendingUp size={24} /></div>
                      <div><p className="text-slate-500 text-sm">Avg. Order Value</p><h3 className="text-2xl font-bold">₹{Math.round(avgOrderValue)}</h3></div>
                   </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                   <h3 className="text-lg font-bold mb-6">Revenue by Course</h3>
                   <SimpleBarChart data={chartData.length ? chartData : [{label: 'No Data', value: 0}]} />
                </div>
             </div>
          )}

          {activeTab === 'transactions' && (
             <div className="animate-fade-in">
                <h1 className="text-2xl font-bold text-slate-800 mb-6">Transaction History</h1>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                   <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm text-slate-600">
                         <thead className="bg-slate-50 text-slate-900 font-bold uppercase text-xs">
                            <tr>
                               <th className="px-6 py-4">Status</th>
                               <th className="px-6 py-4">Order ID</th>
                               <th className="px-6 py-4">Customer</th>
                               <th className="px-6 py-4">Items</th>
                               <th className="px-6 py-4">Amount</th>
                               <th className="px-6 py-4">Date</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-100">
                            {transactions.map((tx) => (
                               <tr key={tx._id} className="hover:bg-slate-50 transition-colors">
                                  <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs font-bold ${tx.status === 'Confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{tx.status}</span></td>
                                  <td className="px-6 py-4 font-mono">{tx.transactionId}</td>
                                  <td className="px-6 py-4"><div>{tx.customerName}</div><div className="text-xs text-slate-400">{tx.payerEmail}</div></td>
                                  <td className="px-6 py-4">{tx.courses.length} Items</td>
                                  <td className="px-6 py-4 font-bold">₹{tx.totalAmount}</td>
                                  <td className="px-6 py-4 text-xs">{new Date(tx.timestamp).toLocaleDateString()}</td>
                               </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                </div>
             </div>
          )}

          {activeTab === 'courses' && (
             <div className="animate-fade-in space-y-8">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-slate-800">Manage Courses</h1>
                    <button onClick={() => setShowAddForm(!showAddForm)} className="bg-brand-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2">
                        {showAddForm ? <X size={18} /> : <Plus size={18} />} {showAddForm ? 'Cancel' : 'Add New Course'}
                    </button>
                </div>
                
                {showAddForm && (
                    <div className="bg-white p-6 rounded-2xl border-l-4 border-brand-500 shadow-sm animate-slide-up">
                        <h3 className="font-bold mb-4">Add New Course</h3>
                        <form onSubmit={handleAddCourse} className="grid grid-cols-2 gap-4">
                            <input placeholder="Course Name" required className="border p-2 rounded" value={newCourse.name} onChange={e => setNewCourse({...newCourse, name: e.target.value})} />
                            <input placeholder="Price (₹)" type="number" required className="border p-2 rounded" value={newCourse.price} onChange={e => setNewCourse({...newCourse, price: e.target.value})} />
                            <input placeholder="Image URL (Unsplash)" className="border p-2 rounded" value={newCourse.image} onChange={e => setNewCourse({...newCourse, image: e.target.value})} />
                            <input placeholder="Trailer URL (YouTube Embed)" className="border p-2 rounded" value={newCourse.trailerUrl} onChange={e => setNewCourse({...newCourse, trailerUrl: e.target.value})} />
                            <textarea placeholder="Description" required className="col-span-2 border p-2 rounded" rows={3} value={newCourse.description} onChange={e => setNewCourse({...newCourse, description: e.target.value})} />
                            <div className="col-span-2 flex justify-end">
                                <button type="submit" className="bg-brand-600 text-white px-6 py-2 rounded-lg font-bold">Save Course</button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <div className="grid gap-4">
                        {courses.map(course => (
                            <div key={course.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-brand-200 transition-colors">
                                <div className="flex items-center gap-4">
                                    <img src={course.image} className="w-12 h-12 rounded-lg object-cover" />
                                    <div>
                                        <div className="font-bold">{course.name}</div>
                                        <div className="text-sm text-slate-500">₹{course.price}</div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={async () => { if(confirm('Delete?')) { await DB.deleteCourse(course.id); refreshCourses(); } }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-8 pt-8 border-t flex justify-end">
                       <button onClick={async () => { if(confirm('Reset DB?')) { await DB.resetCourses(); refreshCourses(); } }} className="text-red-600 text-sm font-bold flex items-center gap-2 hover:bg-red-50 px-3 py-1 rounded"><RefreshCw size={14} /> Reset Database</button>
                    </div>
                </div>
             </div>
          )}
       </main>
    </div>
  );
};

// --- Main App Component ---

const AppContent: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-900">
      <Navbar />
      <div className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/course/:id" element={<CourseDetails />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/my-courses" element={<MyCourses />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex justify-center items-center gap-2 mb-4 text-white font-bold text-xl">
             <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">L</div> LearnSphere
          </div>
          <p className="mb-8">Empowering learners worldwide with professional resources.</p>
          <div className="text-sm">© 2024 LearnSphere Inc. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
};

const App: React.FC = () => {
  // Global State Containers
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingCourses, setLoadingCourses] = useState(true);

  // --- Auth Effect ---
  useEffect(() => {
    // Check LocalStorage first (for instant load)
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
    
    // Subscribe to Firebase Auth
    const unsubscribe = DB.subscribeToAuth((u) => {
       setUser(u);
       if (u) localStorage.setItem('user', JSON.stringify(u));
       else localStorage.removeItem('user');
    });
    return () => unsubscribe();
  }, []);

  // --- Courses Effect ---
  const refreshCourses = async () => {
    setLoadingCourses(true);
    const data = await DB.getCourses();
    setCourses(data);
    setLoadingCourses(false);
  };
  useEffect(() => { refreshCourses(); }, []);

  // --- Toast Logic ---
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 3000);
  };
  const removeToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  // --- Cart Logic ---
  const addToCart = (course: Course) => {
    if (cartItems.find(i => i.id === course.id)) {
        showToast('Item already in cart', 'info');
        return;
    }
    setCartItems([...cartItems, { ...course, cartId: Date.now().toString() }]);
  };
  const removeFromCart = (id: string) => setCartItems(prev => prev.filter(i => i.cartId !== id));
  const clearCart = () => setCartItems([]);

  // --- Auth Actions ---
  const login = (u: User) => setUser(u);
  const logout = async () => { await DB.logoutUser(); setUser(null); showToast('Logged out successfully'); };
  const toggleWishlist = async (cid: number) => {
     if (!user) return;
     const current = user.wishlist || [];
     const updated = current.includes(cid) ? current.filter(id => id !== cid) : [...current, cid];
     const updatedUser = { ...user, wishlist: updated };
     setUser(updatedUser);
     await DB.updateUserWishlist(user._id, updated);
  };

  return (
    <ToastContext.Provider value={{ showToast, toasts, removeToast }}>
      <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, toggleWishlist }}>
        <CourseContext.Provider value={{ courses, refreshCourses, loading: loadingCourses, error: null, searchQuery, setSearchQuery }}>
          <CartContext.Provider value={{ items: cartItems, addToCart, removeFromCart, clearCart, total: cartItems.reduce((acc, i) => acc + i.price, 0) }}>
            <HashRouter>
               <AppContent />
               <ToastContainer toasts={toasts} removeToast={removeToast} />
            </HashRouter>
          </CartContext.Provider>
        </CourseContext.Provider>
      </AuthContext.Provider>
    </ToastContext.Provider>
  );
};

export default App;