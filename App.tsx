import React, { useState, useEffect, createContext, useContext, useRef, useCallback } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, Link, useNavigate, useParams } from 'react-router-dom';
import { User, CartItem, UserRole, AuthState, Course, Transaction, OrderStatus, Review } from './types';
import { HERO_SLIDES } from './constants';
// Switch to Firebase Service
import * as DB from './services/firebase';
import * as EmailService from './services/email';
import { ShoppingCart, User as UserIcon, LogOut, Menu, X, Shield, BookOpen, Trash2, ArrowLeft, CheckCircle, Clock, Plus, Edit2, Save, XCircle, AlertTriangle, Play, Mail, Check, RefreshCw, Search, Upload, FileText, Download, ChevronLeft, ChevronRight, Heart, Share2, Info, UserPlus, Grid, Star, CreditCard, ArrowRight, Loader, LayoutDashboard, TrendingUp, Users, DollarSign } from 'lucide-react';

// --- Types & Contexts ---

// Toast Types
interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
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

// --- UI Primitives (Skeletons & Toast) ---

const Skeleton = ({ className }: { className: string }) => (
  <div className={`animate-pulse bg-slate-200 rounded ${className}`}></div>
);

const CourseCardSkeleton = () => (
  <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 h-full flex flex-col">
    <Skeleton className="h-48 w-full" />
    <div className="p-6 flex flex-col flex-grow space-y-4">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-1/4" />
      <div className="space-y-2 flex-grow">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      <Skeleton className="h-12 w-full rounded-xl" />
    </div>
  </div>
);

const TableRowSkeleton = () => (
  <tr className="border-b border-slate-100">
    <td className="p-4"><Skeleton className="h-4 w-24" /></td>
    <td className="p-4"><div className="space-y-2"><Skeleton className="h-5 w-32" /><Skeleton className="h-3 w-40" /></div></td>
    <td className="p-4"><Skeleton className="h-4 w-20" /></td>
    <td className="p-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
    <td className="p-4"><Skeleton className="h-8 w-8 rounded-full" /></td>
  </tr>
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
          <Star 
            size={size} 
            fill={(interactive ? (hoverRating || rating) : rating) >= star ? "currentColor" : "none"} 
            className={(interactive ? (hoverRating || rating) : rating) >= star ? "text-yellow-400" : "text-slate-300"} 
          />
        </button>
      ))}
    </div>
  );
};

const SimpleBarChart = ({ data }: { data: { label: string, value: number }[] }) => {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end justify-between gap-2 h-48 w-full">
      {data.map((item, idx) => (
        <div key={idx} className="flex flex-col items-center flex-1 h-full justify-end group">
           <div 
             className="w-full bg-brand-200 hover:bg-brand-500 transition-all rounded-t-sm relative"
             style={{ height: `${(item.value / maxValue) * 100}%` }}
           >
             <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
               ₹{item.value}
             </div>
           </div>
           <span className="text-[10px] text-slate-400 mt-2 truncate w-full text-center" title={item.label}>{item.label.substring(0, 8)}...</span>
        </div>
      ))}
    </div>
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

  // Enhanced Hover Effect (Sliding Underline)
  const navLinkClass = (path: string) => `
    relative text-sm font-medium transition-colors duration-300
    ${location.pathname === path ? 'text-brand-600' : 'text-slate-600 hover:text-brand-600'}
    after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-0.5 after:bottom-[-4px] after:left-0 after:bg-brand-600 after:origin-bottom-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-bottom-left
    ${location.pathname === path ? 'after:scale-x-100 after:origin-bottom-left' : ''}
  `;

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
            <Link to="/" className={navLinkClass('/')}>Courses</Link>

            {user && (
              <>
                <Link to="/my-courses" className={navLinkClass('/my-courses')}>
                   <div className="flex items-center space-x-1">
                      <BookOpen size={20} />
                      <span>My Courses</span>
                   </div>
                </Link>
                <Link to="/wishlist" className={navLinkClass('/wishlist')}>
                   <div className="flex items-center space-x-1">
                      <Heart size={20} className={user.wishlist?.length ? "fill-red-500 text-red-500" : ""} />
                      <span>Wishlist</span>
                   </div>
                </Link>
              </>
            )}
            
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
          {user && (
             <>
               <Link to="/my-courses" onClick={() => setIsOpen(false)} className="block text-slate-600 py-2">My Courses</Link>
               <Link to="/wishlist" onClick={() => setIsOpen(false)} className="block text-slate-600 py-2">Wishlist</Link>
             </>
          )}
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

  // Auto-slide timer that resets when slide changes
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [currentSlide]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  };

  return (
    <div className="relative h-[500px] w-full overflow-hidden bg-slate-900 group">
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
      
      {/* Navigation Arrows */}
      <button 
        onClick={prevSlide}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 z-30 p-2 rounded-full bg-white/10 text-white hover:bg-white/30 backdrop-blur-sm transition-all hover:scale-110"
        aria-label="Previous Slide"
      >
        <ChevronLeft size={32} />
      </button>

      <button 
        onClick={nextSlide}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 z-30 p-2 rounded-full bg-white/10 text-white hover:bg-white/30 backdrop-blur-sm transition-all hover:scale-110"
        aria-label="Next Slide"
      >
        <ChevronRight size={32} />
      </button>
      
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
  const { user, toggleWishlist } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [added, setAdded] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const [avgRating, setAvgRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  
  const isWishlisted = user?.wishlist?.includes(course.id);

  useEffect(() => {
    // Fetch basic rating info
    const loadRating = async () => {
      try {
        const reviews = await DB.getReviews(course.id);
        if (reviews.length > 0) {
          const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
          setAvgRating(avg);
          setReviewCount(reviews.length);
        }
      } catch (e) {
        // ignore
      }
    };
    loadRating();
  }, [course.id]);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(course);
    setAdded(true);
    showToast(`Added ${course.name} to cart`, 'success');
    setTimeout(() => setAdded(false), 2000);
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    await toggleWishlist(course.id);
    showToast(isWishlisted ? "Removed from wishlist" : "Added to wishlist", 'info');
  };

  const handleCardClick = () => {
    navigate(`/course/${course.id}`);
  };

  return (
    <>
    <div 
      onClick={handleCardClick}
      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] border border-slate-100 hover:border-brand-500 flex flex-col h-full group cursor-pointer relative"
    >
      <div className="relative overflow-hidden h-48">
        <img 
           src={course.image} 
           alt={course.name} 
           className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
           onError={(e) => {
             (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80';
           }}
        />
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full font-bold text-slate-800 shadow-sm transition-colors group-hover:bg-brand-600 group-hover:text-white z-10">
          ₹{course.price}
        </div>
        
        {/* Wishlist Button */}
        <button 
          onClick={handleWishlist}
          className="absolute top-4 left-4 p-2 rounded-full bg-white/90 hover:bg-white text-slate-400 hover:text-red-500 transition-colors shadow-sm z-10"
        >
           <Heart size={18} className={isWishlisted ? "fill-red-500 text-red-500" : ""} />
        </button>

        {/* Video Overlay Thumbnail */}
        {course.trailerUrl && (
          <div 
             onClick={(e) => { e.stopPropagation(); setShowTrailer(true); }}
             className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-[1px] cursor-pointer"
          >
             <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-brand-600 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 hover:bg-brand-500 transition-all">
                  <Play size={22} fill="currentColor" className="ml-1" />
                </div>
                <span className="text-white text-xs font-bold tracking-wide uppercase bg-black/50 px-2 py-1 rounded">Watch Trailer</span>
             </div>
          </div>
        )}
      </div>
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-lg font-bold text-slate-800 mb-1 leading-tight group-hover:text-brand-600 transition-colors">
          <HighlightedText text={course.name} highlight={searchQuery} />
        </h3>
        
        {/* Ratings on Card */}
        {reviewCount > 0 && (
          <div className="flex items-center gap-1 mb-2">
             <StarRating rating={Math.round(avgRating)} size={12} />
             <span className="text-xs text-slate-400">({reviewCount})</span>
          </div>
        )}

        <p className="text-slate-500 text-sm mb-6 flex-grow">
          <HighlightedText text={course.description} highlight={searchQuery} />
        </p>
        <div className="flex gap-2">
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

const CourseDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { courses } = useCourses();
  const { addToCart } = useCart();
  const { user, toggleWishlist } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [added, setAdded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false); 
  
  // Reviews State
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);

  // Find course
  const course = courses.find(c => c.id === Number(id));
  const isWishlisted = user?.wishlist?.includes(course?.id || -1);

  useEffect(() => {
    if (course) {
       loadReviews();
       checkPurchaseStatus();
    }
  }, [course, user]);

  const loadReviews = async () => {
    if (!course) return;
    setIsLoadingReviews(true);
    const data = await DB.getReviews(course.id);
    setReviews(data);
    if (data.length > 0) {
      setAvgRating(data.reduce((a, b) => a + b.rating, 0) / data.length);
    }
    setIsLoadingReviews(false);
  };

  const checkPurchaseStatus = async () => {
    if (user && course) {
       const purchased = await DB.hasUserPurchasedCourse(user._id, course.name);
       setHasPurchased(purchased);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !course) return;

    setIsSubmittingReview(true);
    try {
      await DB.addReview({
        courseId: course.id,
        userId: user._id,
        userName: user.username,
        rating: newReview.rating,
        comment: newReview.comment,
        date: new Date().toISOString()
      });
      await loadReviews();
      setNewReview({ rating: 5, comment: '' }); // Reset
      showToast('Review submitted successfully!', 'success');
    } catch (e) {
      console.error(e);
      showToast('Failed to submit review', 'error');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleAdd = () => {
    if (course) {
      addToCart(course);
      setAdded(true);
      showToast(`Added ${course.name} to cart`, 'success');
      setTimeout(() => setAdded(false), 2000);
    }
  };

  const handleWishlist = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if(course) {
      await toggleWishlist(course.id);
      showToast(isWishlisted ? "Removed from wishlist" : "Added to wishlist", 'info');
    }
  };

  if (!course) {
    return <div className="text-center py-24">Course not found</div>;
  }
  
  return (
    <div className="min-h-screen bg-slate-50 pt-16">
      {/* Hero Header */}
      <div className="bg-slate-900 text-white py-12 md:py-20">
         <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
               <h1 className="text-3xl md:text-5xl font-bold mb-4">{course.name}</h1>
               
               <div className="flex items-center gap-2 mb-6 text-yellow-400">
                  <StarRating rating={Math.round(avgRating)} size={20} />
                  <span className="text-slate-300 ml-2">({reviews.length} reviews)</span>
               </div>

               <p className="text-lg text-slate-300 mb-6">{course.description}</p>
               <div className="flex items-center gap-4 text-sm text-slate-400">
                  <div className="flex items-center gap-1">
                     <BookOpen size={16} /> <span>PDF Materials Included</span>
                  </div>
                  <div className="flex items-center gap-1">
                     <UserIcon size={16} /> <span>{course.instructor || "Expert Instructor"}</span>
                  </div>
               </div>
            </div>
            {course.trailerUrl && (
               <div className="rounded-xl overflow-hidden shadow-2xl border border-slate-700 aspect-video relative group">
                  {!isPlaying ? (
                    // Thumbnail View
                    <div 
                      className="w-full h-full relative cursor-pointer" 
                      onClick={() => setIsPlaying(true)}
                    >
                      <img 
                        src={course.image} 
                        alt={course.name} 
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80';
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-colors">
                        <div className="w-20 h-20 bg-brand-600 rounded-full flex items-center justify-center text-white shadow-lg transform group-hover:scale-110 transition-transform">
                          <Play size={32} fill="currentColor" className="ml-2" />
                        </div>
                      </div>
                      <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium">
                         Watch Trailer
                      </div>
                    </div>
                  ) : (
                    // Video View
                    <iframe 
                      src={`${course.trailerUrl}?autoplay=1`} 
                      className="w-full h-full"
                      title="Course Trailer"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  )}
               </div>
            )}
         </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
         {/* Main Content */}
         <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
               <h2 className="text-2xl font-bold text-slate-800 mb-4">Course Overview</h2>
               <p className="text-slate-600 leading-relaxed mb-6">
                 This comprehensive course on <strong>{course.name}</strong> is designed to take you from basics to advanced concepts. 
                 It includes detailed PDF notes, exercises, and real-world examples to ensure you master the topic.
               </p>
               <h3 className="text-lg font-bold text-slate-800 mb-3">What You'll Learn</h3>
               <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {['Comprehensive Theory', 'Practical Examples', 'Expert Tips', 'Downloadable PDF Resources', 'Lifetime Access', 'Certificate of Completion'].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-slate-600">
                       <CheckCircle size={16} className="text-green-500" /> {item}
                    </li>
                  ))}
               </ul>
            </div>
            
            {/* Reviews Section */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
               <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-slate-800">Student Reviews</h2>
                  <div className="text-right">
                     <div className="text-3xl font-bold text-slate-800">{avgRating.toFixed(1)}</div>
                     <StarRating rating={Math.round(avgRating)} size={18} />
                     <div className="text-sm text-slate-500">{reviews.length} ratings</div>
                  </div>
               </div>
               
               {/* Write Review Form */}
               {user && hasPurchased && (
                 <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-8">
                    <h3 className="font-bold text-lg mb-4">Write a Review</h3>
                    <form onSubmit={handleSubmitReview}>
                       <div className="mb-4">
                          <label className="block text-sm font-medium text-slate-700 mb-1">Your Rating</label>
                          <StarRating 
                            rating={newReview.rating} 
                            interactive={true} 
                            size={24}
                            onRate={(r) => setNewReview({...newReview, rating: r})} 
                          />
                       </div>
                       <div className="mb-4">
                          <label className="block text-sm font-medium text-slate-700 mb-1">Your Review</label>
                          <textarea 
                             value={newReview.comment}
                             onChange={(e) => setNewReview({...newReview, comment: e.target.value})}
                             className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                             rows={3}
                             placeholder="Share your experience..."
                             required
                          ></textarea>
                       </div>
                       <button 
                         type="submit" 
                         disabled={isSubmittingReview}
                         className="bg-brand-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-brand-700 transition-colors"
                       >
                         {isSubmittingReview ? "Submitting..." : "Submit Review"}
                       </button>
                    </form>
                 </div>
               )}
               
               {/* Reviews List */}
               <div className="space-y-6">
                 {isLoadingReviews ? (
                    // Review Skeleton
                    [1,2].map(i => (
                       <div key={i} className="border-b border-slate-100 pb-6">
                          <div className="flex gap-4 mb-2">
                             <Skeleton className="w-8 h-8 rounded-full" />
                             <div className="space-y-1"><Skeleton className="w-24 h-4" /><Skeleton className="w-16 h-3" /></div>
                          </div>
                          <Skeleton className="w-full h-12" />
                       </div>
                    ))
                 ) : reviews.length === 0 ? (
                    <p className="text-slate-500 italic">No reviews yet. Be the first to review!</p>
                 ) : (
                    reviews.map((review, idx) => (
                      <div key={idx} className="border-b border-slate-100 last:border-0 pb-6 last:pb-0">
                         <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                               <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-bold text-xs">
                                  {review.userName.charAt(0).toUpperCase()}
                               </div>
                               <div>
                                  <div className="font-bold text-slate-800 text-sm">{review.userName}</div>
                                  <div className="text-xs text-slate-400">{new Date(review.date).toLocaleDateString()}</div>
                               </div>
                            </div>
                            <StarRating rating={review.rating} size={14} />
                         </div>
                         <p className="text-slate-600 text-sm">{review.comment}</p>
                      </div>
                    ))
                 )}
               </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
               <h2 className="text-2xl font-bold text-slate-800 mb-4">Instructor</h2>
               <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 text-2xl font-bold">
                     {course.instructor ? course.instructor.charAt(0) : "I"}
                  </div>
                  <div>
                     <h3 className="font-bold text-lg">{course.instructor || "Expert Instructor"}</h3>
                     <p className="text-slate-500 text-sm">Industry Professional & Mentor</p>
                  </div>
               </div>
            </div>
         </div>

         {/* Sidebar */}
         <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 sticky top-24">
               <img 
                 src={course.image} 
                 alt={course.name} 
                 className="w-full h-48 object-cover rounded-xl mb-6"
                 onError={(e) => {
                   (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80';
                 }} 
               />
               <div className="text-3xl font-bold text-slate-900 mb-2">₹{course.price}</div>
               <p className="text-slate-500 text-sm mb-6 line-through">₹{course.price * 2}</p>
               
               <div className="space-y-3">
                  <button 
                    onClick={handleAdd}
                    disabled={added}
                    className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                      added 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-brand-600 text-white hover:bg-brand-700 shadow-lg shadow-brand-500/20'
                    }`}
                  >
                    {added ? 'Added to Cart' : 'Add to Cart'}
                  </button>
                  <button 
                    onClick={handleWishlist}
                    className={`w-full py-3 rounded-xl font-bold border-2 transition-all flex items-center justify-center gap-2 ${
                       isWishlisted ? "border-red-500 text-red-500 bg-red-50" : "border-slate-200 text-slate-600 hover:border-slate-400"
                    }`}
                  >
                     <Heart size={20} className={isWishlisted ? "fill-current" : ""} /> 
                     {isWishlisted ? "Wishlisted" : "Add to Wishlist"}
                  </button>
               </div>
               
               <p className="text-center text-xs text-slate-400 mt-4">30-Day Money-Back Guarantee</p>
            </div>
         </div>
      </div>
    </div>
  );
};

const Wishlist: React.FC = () => {
  const { user } = useAuth();
  const { courses } = useCourses();
  
  if (!user) return <Navigate to="/login" />;

  const wishlistCourses = courses.filter(c => user.wishlist?.includes(c.id));

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
          <Heart className="text-red-500 fill-red-500" /> Your Wishlist
        </h1>
        
        {wishlistCourses.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-slate-100">
             <Heart size={48} className="mx-auto text-slate-300 mb-4" />
             <h3 className="text-xl font-medium text-slate-600 mb-2">Your wishlist is empty</h3>
             <p className="text-slate-400 mb-6">Save courses you're interested in to view them later.</p>
             <Link to="/" className="text-brand-600 hover:text-brand-800 font-medium">Browse Courses</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {wishlistCourses.map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
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
      DB.getUserPurchasedCourses(user._id).then(data => {
        setCourses(data);
        setLoading(false);
      });
    }
  }, [user]);

  if (!user) return <Navigate to="/login" />;

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
          <BookOpen className="text-brand-600" /> My Learning
        </h1>
        {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3].map(i => (
                    <div key={i} className="bg-white rounded-2xl p-4 shadow-sm h-80 flex flex-col gap-4">
                        <Skeleton className="w-full h-40 rounded-xl" />
                        <Skeleton className="w-3/4 h-6" />
                        <Skeleton className="w-full h-12" />
                    </div>
                ))}
            </div>
        ) : courses.length === 0 ? (
           <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-slate-100">
             <BookOpen size={48} className="mx-auto text-slate-300 mb-4" />
             <h3 className="text-xl font-medium text-slate-600 mb-2">No courses yet</h3>
             <p className="text-slate-400 mb-6">You haven't purchased any courses yet.</p>
             <Link to="/" className="text-brand-600 font-medium">Browse Courses</Link>
           </div>
        ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {courses.map(course => (
                 <div key={course.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl hover:translate-y-[-4px] group">
                    <div className="h-48 relative overflow-hidden">
                       <img 
                          src={course.image} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                          alt={course.name}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80';
                          }}
                       />
                       <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/40 shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                            <Play size={24} fill="currentColor" className="ml-1" />
                          </div>
                       </div>
                    </div>
                    <div className="p-6 flex-grow flex flex-col">
                       <h3 className="font-bold text-lg mb-2 text-slate-800 group-hover:text-brand-600 transition-colors">{course.name}</h3>
                       <p className="text-sm text-slate-500 mb-6 flex-grow line-clamp-2">{course.description}</p>
                       
                       <div className="w-full bg-slate-100 h-2 rounded-full mb-4 overflow-hidden">
                          <div className="bg-brand-500 h-full rounded-full" style={{ width: '0%' }}></div>
                       </div>
                       
                       <div className="mt-auto space-y-3">
                          <button className="w-full bg-brand-600 text-white py-2.5 rounded-xl font-bold hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/20">
                             Continue Learning
                          </button>
                          <button className="w-full border border-slate-200 text-slate-600 py-2.5 rounded-xl font-bold hover:bg-slate-50 hover:border-slate-300 flex items-center justify-center gap-2 transition-colors">
                             <Download size={18} /> Download Resources
                          </button>
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

const Cart: React.FC = () => {
  const { items, removeFromCart, total, clearCart } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-slate-100 p-6 rounded-full inline-block mb-4">
            <ShoppingCart size={48} className="text-slate-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Your cart is empty</h2>
          <p className="text-slate-500 mb-6">Looks like you haven't added any courses yet.</p>
          <Link to="/" className="bg-brand-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-brand-700 transition-colors">
            Start Learning
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Shopping Cart ({items.length})</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item.cartId} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex gap-4 items-center">
                <img src={item.image} alt={item.name} className="w-24 h-24 object-cover rounded-lg hidden sm:block" />
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-slate-800">{item.name}</h3>
                  <p className="text-slate-500 text-sm mb-1">{item.instructor}</p>
                  <div className="font-bold text-brand-600">₹{item.price}</div>
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
            {items.length > 0 && (
                <button onClick={clearCart} className="text-red-500 text-sm hover:underline flex items-center gap-1">
                    <Trash2 size={14} /> Clear Cart
                </button>
            )}
          </div>
          
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 sticky top-24">
              <h3 className="text-xl font-bold mb-4">Order Summary</h3>
              <div className="flex justify-between mb-2 text-slate-600">
                <span>Subtotal</span>
                <span>₹{total}</span>
              </div>
              <div className="flex justify-between mb-4 text-slate-600">
                <span>Tax</span>
                <span>₹0</span>
              </div>
              <div className="border-t border-slate-100 pt-4 mb-6 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>₹{total}</span>
              </div>
              <button 
                onClick={() => navigate('/checkout')}
                className="w-full bg-brand-600 text-white py-3 rounded-xl font-bold hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/20"
              >
                Proceed to Checkout
              </button>
              <p className="text-xs text-center text-slate-400 mt-4">Secure Checkout</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Checkout: React.FC = () => {
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  // Checkout Steps State
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState({
    name: user?.username || '',
    email: user?.email || '',
    transactionId: ''
  });

  if (items.length === 0 && !success) {
      return <Navigate to="/cart" />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Create Transaction in DB
      // The service now handles checking uniqueness and Auto-Confirming
      const transaction = await DB.createTransaction({
        userId: user ? user._id : null,
        customerName: formData.name,
        payerEmail: formData.email,
        transactionId: formData.transactionId,
        courses: items.map(i => i.name),
        totalAmount: total
      });

      // 2. Send Confirmation Email
      await EmailService.sendOrderConfirmationEmail(transaction);

      // 3. Cleanup
      clearCart();
      setSuccess(true);
      showToast('Payment Verified! Receipt Sent.', 'success');
    } catch (err: any) {
      setError(err.message || 'Payment verification failed');
      showToast(err.message || 'Payment verification failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if(step === 1) setStep(2);
  };

  const prevStep = () => {
    if(step === 2) setStep(1);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check size={32} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Payment Confirmed!</h2>
          <p className="text-slate-600 mb-6">Thank you for your order, {formData.name}. Your access is ready.</p>
          
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6 text-sm text-blue-700 flex flex-col items-start gap-2 text-left">
              <div className="flex items-center gap-2 font-bold"><Mail size={16} /> Receipt Sent</div>
              <p>A personalized receipt with your course links has been sent to <span className="font-bold">{formData.email}</span>.</p>
          </div>

          <div className="space-y-3">
             <button 
                onClick={() => navigate('/my-courses')}
                className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-brand-600 transition-colors"
              >
                Start Learning
              </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12">
      <div className="max-w-2xl mx-auto px-4">
        
        {/* Stepper Header */}
        <div className="mb-10 flex items-center justify-between relative z-0">
          <div className="absolute left-0 top-1/2 w-full h-0.5 bg-slate-200 -z-10 transform -translate-y-1/2"></div>
          
          <div className={`flex flex-col items-center bg-slate-50 px-2 ${step >= 1 ? 'text-brand-600' : 'text-slate-400'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm mb-2 transition-colors ${step >= 1 ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
              {step > 1 ? <Check size={20} /> : '1'}
            </div>
            <span className="text-xs font-bold uppercase tracking-wide">Details</span>
          </div>

          <div className={`flex flex-col items-center bg-slate-50 px-2 ${step >= 2 ? 'text-brand-600' : 'text-slate-400'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm mb-2 transition-colors ${step >= 2 ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
              {step > 2 ? <Check size={20} /> : '2'}
            </div>
            <span className="text-xs font-bold uppercase tracking-wide">Payment</span>
          </div>

           <div className={`flex flex-col items-center bg-slate-50 px-2 ${step >= 3 ? 'text-brand-600' : 'text-slate-400'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm mb-2 transition-colors ${step >= 3 ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
              3
            </div>
            <span className="text-xs font-bold uppercase tracking-wide">Confirm</span>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            {step === 1 ? <UserIcon className="text-brand-600" /> : <CreditCard className="text-brand-600" />} 
            {step === 1 ? 'Personal Details' : 'Payment Information'}
          </h2>

          {error && <div className="bg-red-50 text-red-500 p-4 rounded-lg mb-6 flex items-center gap-2"><AlertTriangle size={18} /> {error}</div>}

          {step === 1 && (
            <form onSubmit={nextStep} className="space-y-6 animate-fade-in">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                    <input 
                      type="text" 
                      required
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                    />
                 </div>
                 
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                    <input 
                      type="email" 
                      required
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                    />
                 </div>
               </div>
               
               <div className="flex justify-end pt-4">
                  <button type="submit" className="bg-brand-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-brand-700 transition-colors flex items-center gap-2">
                    Next Step <ArrowRight size={18} />
                  </button>
               </div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
              <div className="mb-8 p-6 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200">
                    <h3 className="font-bold text-slate-700">Order Summary</h3>
                    <Link to="/cart" className="text-sm text-brand-600 hover:underline">Edit Cart</Link>
                  </div>
                  <div className="space-y-2 mb-4">
                    {items.map(item => (
                      <div key={item.cartId} className="flex justify-between text-sm text-slate-600">
                        <span>{item.name}</span>
                        <span>₹{item.price}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between font-bold text-lg text-slate-800 pt-2 border-t border-slate-200">
                      <span>Total Amount</span>
                      <span>₹{total}</span>
                  </div>
               </div>

               <div>
                 <h3 className="font-semibold text-slate-800 mb-4">Payment Method (Simulation)</h3>
                 <div className="bg-yellow-50 p-4 rounded-lg text-sm text-yellow-800 mb-4 border border-yellow-100">
                    <p className="flex items-start gap-2">
                        <Info size={16} className="mt-0.5 flex-shrink-0" />
                        This is a verified demo. Enter any unique Transaction ID to instantly confirm payment.
                    </p>
                 </div>
                 
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Transaction ID / UPI Reference</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. 1234567890"
                      value={formData.transactionId}
                      onChange={e => setFormData({...formData, transactionId: e.target.value})}
                      className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all font-mono"
                    />
                 </div>
               </div>

               <div className="flex gap-4 pt-4">
                 <button 
                   type="button" 
                   onClick={prevStep}
                   className="flex-1 border border-slate-200 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                 >
                   Back
                 </button>
                 <button 
                   type="submit" 
                   disabled={loading}
                   className="flex-[2] bg-brand-600 text-white py-3 rounded-xl font-bold hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                 >
                   {loading ? <RefreshCw className="animate-spin" /> : 'Confirm Payment'}
                 </button>
               </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await DB.loginUser(email, password);
      login(user);
      showToast('Welcome back!', 'success');
      navigate('/');
    } catch (err: any) {
      let msg = err.message;
      if(msg.includes('auth/invalid-credential')) msg = "Invalid Email or Password. If you are admin, please Register first.";
      if(msg.includes('auth/configuration-not-found')) msg = "Authentication not enabled in Firebase Console. Please enable Email/Password provider.";
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h2 className="text-3xl font-bold mb-6 text-center text-slate-800">Welcome Back</h2>
        {error && <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-4 text-sm flex items-center gap-2"><AlertTriangle size={16} />{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
             <input type="email" required className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
             <input type="password" required className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-brand-600 text-white py-3 rounded-xl font-bold hover:bg-brand-700 transition-colors flex justify-center">
             {loading ? <RefreshCw className="animate-spin" /> : "Login"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
           Don't have an account? <Link to="/register" className="text-brand-600 font-bold hover:underline">Register</Link>
        </p>
      </div>
    </div>
  );
};

const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await DB.registerUser({ username, email, passwordHash: password }); // Pass raw password to be handled by firebase
      login(user);
      showToast('Account created successfully!', 'success');
      navigate('/');
    } catch (err: any) {
      setError(err.message);
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h2 className="text-3xl font-bold mb-6 text-center text-slate-800">Create Account</h2>
        {error && <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-4 text-sm flex items-center gap-2"><AlertTriangle size={16} />{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
             <input type="text" required className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" value={username} onChange={e => setUsername(e.target.value)} />
          </div>
          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
             <input type="email" required className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
             <input type="password" required className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-brand-600 text-white py-3 rounded-xl font-bold hover:bg-brand-700 transition-colors flex justify-center">
             {loading ? <RefreshCw className="animate-spin" /> : "Register"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
           Already have an account? <Link to="/login" className="text-brand-600 font-bold hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
};

const Admin: React.FC = () => {
  const { user } = useAuth();
  const { courses, refreshCourses } = useCourses();
  const { showToast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tab, setTab] = useState<'dashboard' | 'courses' | 'orders'>('dashboard');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editPrice, setEditPrice] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // New Course State
  const [newCourse, setNewCourse] = useState({
    name: '',
    price: '',
    description: '',
    image: '',
    trailerUrl: '',
    instructor: ''
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (user?.role === UserRole.ADMIN) {
      setLoading(true);
      DB.getTransactions().then(txs => {
        setTransactions(txs);
        setLoading(false);
      });
    }
  }, [user]);

  const handleConfirm = async (id: string) => {
    try {
      await DB.confirmTransaction(id);
      const updated = await DB.getTransactions();
      setTransactions(updated);
      showToast("Order confirmed successfully", "success");
    } catch (e) {
      showToast("Failed to confirm order", "error");
    }
  };

  const handleUpdatePrice = async (id: number) => {
    if (!editPrice) return;
    try {
      await DB.updateCoursePrice(id, parseFloat(editPrice));
      setEditingId(null);
      refreshCourses();
      showToast("Price updated", "success");
    } catch (e) {
      showToast("Failed to update price", "error");
    }
  };

  const handleDeleteCourse = async (id: number) => {
    if(window.confirm('Are you sure?')) {
      try {
        await DB.deleteCourse(id);
        refreshCourses();
        showToast("Course deleted", "info");
      } catch (e) {
        showToast("Failed to delete course", "error");
      }
    }
  };

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await DB.addCourse({
        name: newCourse.name,
        price: parseFloat(newCourse.price),
        description: newCourse.description,
        image: newCourse.image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
        trailerUrl: newCourse.trailerUrl,
        instructor: newCourse.instructor
      });
      setNewCourse({ name: '', price: '', description: '', image: '', trailerUrl: '', instructor: '' });
      setShowAddForm(false);
      refreshCourses();
      showToast("Course added successfully", "success");
    } catch (error) {
      showToast("Failed to add course", "error");
    }
  };

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTransactions = transactions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(transactions.length / itemsPerPage);

  const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

  // Analytics Logic
  const totalRevenue = transactions.reduce((sum, tx) => sum + tx.totalAmount, 0);
  const activeOrders = transactions.length;
  const avgOrderValue = activeOrders > 0 ? (totalRevenue / activeOrders).toFixed(0) : "0";
  
  // Prepare Chart Data
  const courseRevenue: {[key: string]: number} = {};
  transactions.forEach(tx => {
    tx.courses.forEach(courseName => {
      // Rough estimation per course if multiple courses in one tx
      const amountPerCourse = tx.totalAmount / tx.courses.length;
      courseRevenue[courseName] = (courseRevenue[courseName] || 0) + amountPerCourse;
    });
  });
  
  const chartData = Object.keys(courseRevenue).map(key => ({
    label: key,
    value: Math.round(courseRevenue[key])
  })).sort((a,b) => b.value - a.value).slice(0, 5); // Top 5

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
          <Shield className="text-brand-600" /> Admin Dashboard
        </h1>

        <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
           <button 
             onClick={() => setTab('dashboard')}
             className={`px-6 py-2 rounded-full font-bold transition-all whitespace-nowrap flex items-center gap-2 ${tab === 'dashboard' ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
           >
             <LayoutDashboard size={18} /> Overview
           </button>
           <button 
             onClick={() => setTab('courses')}
             className={`px-6 py-2 rounded-full font-bold transition-all whitespace-nowrap flex items-center gap-2 ${tab === 'courses' ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
           >
             <BookOpen size={18} /> Manage Courses
           </button>
           <button 
             onClick={() => setTab('orders')}
             className={`px-6 py-2 rounded-full font-bold transition-all whitespace-nowrap flex items-center gap-2 ${tab === 'orders' ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
           >
             <ShoppingCart size={18} /> Manage Orders
           </button>
        </div>

        {tab === 'dashboard' && (
          <div className="animate-fade-in space-y-8">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                   <div className="p-4 bg-green-100 text-green-600 rounded-xl">
                      <DollarSign size={24} />
                   </div>
                   <div>
                      <p className="text-sm text-slate-500 font-medium">Total Revenue</p>
                      <h3 className="text-2xl font-bold text-slate-800">₹{totalRevenue.toLocaleString()}</h3>
                   </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                   <div className="p-4 bg-blue-100 text-blue-600 rounded-xl">
                      <ShoppingCart size={24} />
                   </div>
                   <div>
                      <p className="text-sm text-slate-500 font-medium">Total Orders</p>
                      <h3 className="text-2xl font-bold text-slate-800">{activeOrders}</h3>
                   </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                   <div className="p-4 bg-purple-100 text-purple-600 rounded-xl">
                      <TrendingUp size={24} />
                   </div>
                   <div>
                      <p className="text-sm text-slate-500 font-medium">Avg Order Value</p>
                      <h3 className="text-2xl font-bold text-slate-800">₹{avgOrderValue}</h3>
                   </div>
                </div>
             </div>

             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-6">Top Revenue by Course</h3>
                {chartData.length > 0 ? (
                  <SimpleBarChart data={chartData} />
                ) : (
                  <div className="h-48 flex items-center justify-center text-slate-400 italic">No data available</div>
                )}
             </div>
          </div>
        )}

        {tab === 'courses' && (
          <div className="space-y-8 animate-fade-in">
            {/* Add Course Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
               <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                     <Plus className="bg-brand-100 text-brand-600 p-1.5 rounded-lg w-8 h-8" />
                     <h2 className="text-xl font-bold text-slate-800">Add New Course</h2>
                  </div>
                  <button 
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="text-sm font-medium text-brand-600 hover:text-brand-700"
                  >
                    {showAddForm ? 'Cancel' : 'Open Form'}
                  </button>
               </div>
               
               {showAddForm && (
                 <form onSubmit={handleAddCourse} className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in border-t border-slate-100 pt-4">
                    <input 
                      placeholder="Course Name" required 
                      className="p-3 border rounded-lg"
                      value={newCourse.name} onChange={e => setNewCourse({...newCourse, name: e.target.value})}
                    />
                    <input 
                      placeholder="Price (₹)" type="number" required 
                      className="p-3 border rounded-lg"
                      value={newCourse.price} onChange={e => setNewCourse({...newCourse, price: e.target.value})}
                    />
                    <input 
                      placeholder="Instructor Name" 
                      className="p-3 border rounded-lg"
                      value={newCourse.instructor} onChange={e => setNewCourse({...newCourse, instructor: e.target.value})}
                    />
                    <input 
                      placeholder="Image URL (Unsplash recommended)" 
                      className="p-3 border rounded-lg"
                      value={newCourse.image} onChange={e => setNewCourse({...newCourse, image: e.target.value})}
                    />
                    <input 
                      placeholder="Trailer URL (YouTube Embed)" 
                      className="p-3 border rounded-lg"
                      value={newCourse.trailerUrl} onChange={e => setNewCourse({...newCourse, trailerUrl: e.target.value})}
                    />
                    <textarea 
                      placeholder="Description" required 
                      className="p-3 border rounded-lg md:col-span-2"
                      value={newCourse.description} onChange={e => setNewCourse({...newCourse, description: e.target.value})}
                    />
                    <button type="submit" className="bg-brand-600 text-white py-3 rounded-lg font-bold md:col-span-2 hover:bg-brand-700">Add Course</button>
                 </form>
               )}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
               <table className="w-full text-left">
                 <thead className="bg-slate-50 border-b border-slate-100">
                   <tr>
                     <th className="p-4 text-slate-500 font-medium">ID</th>
                     <th className="p-4 text-slate-500 font-medium">Name</th>
                     <th className="p-4 text-slate-500 font-medium">Price</th>
                     <th className="p-4 text-slate-500 font-medium">Actions</th>
                   </tr>
                 </thead>
                 <tbody>
                   {courses.map(course => (
                     <tr key={course.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                       <td className="p-4 text-slate-600">#{course.id}</td>
                       <td className="p-4 font-bold text-slate-800">{course.name}</td>
                       <td className="p-4 text-brand-600 font-bold">
                         {editingId === course.id ? (
                           <div className="flex items-center gap-2">
                             <input 
                               type="number" 
                               value={editPrice} 
                               onChange={e => setEditPrice(e.target.value)}
                               className="w-20 p-1 border rounded"
                             />
                             <button onClick={() => handleUpdatePrice(course.id)} className="text-green-600"><Save size={18} /></button>
                             <button onClick={() => setEditingId(null)} className="text-red-500"><X size={18} /></button>
                           </div>
                         ) : (
                           <span>₹{course.price}</span>
                         )}
                       </td>
                       <td className="p-4 flex gap-3">
                         <button onClick={() => { setEditingId(course.id); setEditPrice(course.price.toString()); }} className="text-slate-400 hover:text-brand-600"><Edit2 size={18} /></button>
                         <button onClick={() => handleDeleteCourse(course.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={18} /></button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
            </div>
          </div>
        )}

        {tab === 'orders' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-fade-in">
             <table className="w-full text-left">
               <thead className="bg-slate-50 border-b border-slate-100">
                 <tr>
                   <th className="p-4 text-slate-500 font-medium">Date</th>
                   <th className="p-4 text-slate-500 font-medium">User</th>
                   <th className="p-4 text-slate-500 font-medium">Transaction ID</th>
                   <th className="p-4 text-slate-500 font-medium">Amount</th>
                   <th className="p-4 text-slate-500 font-medium">Status</th>
                   <th className="p-4 text-slate-500 font-medium">Action</th>
                 </tr>
               </thead>
               <tbody>
                 {loading ? (
                   [...Array(5)].map((_, i) => <TableRowSkeleton key={i} />)
                 ) : (
                   currentTransactions.map(tx => (
                     <tr key={tx._id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                       <td className="p-4 text-slate-500 text-sm">{new Date(tx.timestamp).toLocaleDateString()}</td>
                       <td className="p-4 font-bold text-slate-800">
                          {tx.customerName}
                          <div className="text-xs text-slate-400 font-normal">{tx.payerEmail}</div>
                       </td>
                       <td className="p-4 font-mono text-sm text-slate-600">{tx.transactionId}</td>
                       <td className="p-4 font-bold">₹{tx.totalAmount}</td>
                       <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${tx.status === OrderStatus.CONFIRMED ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {tx.status}
                          </span>
                       </td>
                       <td className="p-4">
                         {tx.status === OrderStatus.PENDING && (
                           <button onClick={() => handleConfirm(tx._id)} className="text-brand-600 hover:underline text-sm font-bold">Confirm</button>
                         )}
                         {tx.status === OrderStatus.CONFIRMED && (
                             <span className="text-green-600 text-sm flex items-center gap-1"><CheckCircle size={14} /> Verified</span>
                         )}
                       </td>
                     </tr>
                   ))
                 )}
               </tbody>
             </table>
             {/* Pagination Controls */}
             {!loading && transactions.length > itemsPerPage && (
                <div className="flex justify-between items-center p-4 bg-slate-50 border-t border-slate-100">
                    <button 
                      onClick={prevPage} 
                      disabled={currentPage === 1}
                      className="px-4 py-2 text-sm text-slate-600 disabled:opacity-50 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-slate-500">Page {currentPage} of {totalPages}</span>
                    <button 
                      onClick={nextPage} 
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 text-sm text-slate-600 disabled:opacity-50 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      Next
                    </button>
                </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
};

const Home: React.FC = () => {
  const { courses, searchQuery, loading } = useCourses();
  
  const filteredCourses = courses.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50">
       <div className="pt-16">
          <Hero />
          <div id="courses" className="max-w-7xl mx-auto px-4 py-16">
            <h2 className="text-3xl font-bold mb-8 text-slate-800">Explore Courses</h2>
            {loading ? (
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {[...Array(8)].map((_, i) => <CourseCardSkeleton key={i} />)}
               </div>
            ) : filteredCourses.length === 0 ? (
               <div className="text-center py-12 text-slate-500">No courses found matching "{searchQuery}"</div>
            ) : (
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {filteredCourses.map(course => (
                     <CourseCard key={course.id} course={course} />
                  ))}
               </div>
            )}
          </div>
       </div>
    </div>
  );
};

const App: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // Toast State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Toast Function
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Load Courses
  const refreshCourses = async () => {
    setLoading(true);
    const data = await DB.getCourses();
    setCourses(data);
    setLoading(false);
  };

  useEffect(() => {
    refreshCourses();
  }, []);

  // Auth Subscription
  useEffect(() => {
    const unsubscribe = DB.subscribeToAuth((u) => {
       setUser(u);
       setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Cart Logic
  const addToCart = (course: Course) => {
     // Check if already in cart
     if (cartItems.find(i => i.id === course.id)) return;
     setCartItems([...cartItems, { ...course, cartId: `cart_${Date.now()}_${course.id}` }]);
  };

  const removeFromCart = (cartId: string) => {
     setCartItems(cartItems.filter(i => i.cartId !== cartId));
  };

  const clearCart = () => setCartItems([]);
  
  const cartTotal = cartItems.reduce((sum, item) => sum + item.price, 0);

  // Auth Actions
  const login = (u: User) => setUser(u);
  
  const logout = async () => {
     await DB.logoutUser();
     setUser(null);
     clearCart();
     showToast("Logged out successfully", "info");
  };

  const toggleWishlist = async (courseId: number) => {
    if (!user) return;
    let newWishlist = user.wishlist || [];
    if (newWishlist.includes(courseId)) {
      newWishlist = newWishlist.filter(id => id !== courseId);
    } else {
      newWishlist = [...newWishlist, courseId];
    }
    // Optimistic Update
    const updatedUser = { ...user, wishlist: newWishlist };
    setUser(updatedUser);
    await DB.updateUserWishlist(user._id, newWishlist);
  };

  if (authLoading) return <div className="h-screen flex items-center justify-center bg-slate-50"><RefreshCw className="animate-spin text-brand-600" /></div>;

  return (
    <ToastContext.Provider value={{ showToast }}>
      <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, toggleWishlist }}>
        <CourseContext.Provider value={{ courses, refreshCourses, loading, error: null, searchQuery, setSearchQuery }}>
           <CartContext.Provider value={{ items: cartItems, addToCart, removeFromCart, clearCart, total: cartTotal }}>
              <HashRouter>
                 <Navbar />
                 <ToastContainer toasts={toasts} removeToast={removeToast} />
                 <div className="flex flex-col min-h-screen">
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                      <Route path="/course/:id" element={<CourseDetails />} />
                      <Route path="/cart" element={<Cart />} />
                      <Route path="/checkout" element={<Checkout />} />
                      <Route path="/my-courses" element={<MyCourses />} />
                      <Route path="/wishlist" element={<Wishlist />} />
                      <Route path="/admin" element={user?.role === UserRole.ADMIN ? <Admin /> : <Navigate to="/" />} />
                    </Routes>
                    <Footer />
                 </div>
              </HashRouter>
           </CartContext.Provider>
        </CourseContext.Provider>
      </AuthContext.Provider>
    </ToastContext.Provider>
  );
};

export default App;