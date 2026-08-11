import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import useAuthStore from '../store/authStore';

const Landing = () => {
  const { isAuthenticated } = useAuthStore();
  const [isChatOpen, setIsChatOpen] = useState(false);

  const changeLanguage = (langCode) => {
    const selectField = document.querySelector(".goog-te-combo");
    if (selectField) {
      selectField.value = langCode;
      selectField.dispatchEvent(new Event("change"));
    }
  };

  return (
    <div className="font-sans flex flex-col min-h-screen bg-gradient-to-b from-[#a7f3d0]/60 via-[#bbf7d0]/30 to-slate-50 overflow-x-hidden relative text-gray-800">
      
      {/* 1. TOP FLOATING MINT HEADER */}
      <div className="pt-5 px-4 lg:px-8 max-w-7xl mx-auto w-full z-50">
        <header className="bg-gradient-to-r from-[#a7f3d0]/90 via-[#bbf7d0]/90 to-[#a7f3d0]/90 backdrop-blur-xl border border-white/90 h-[68px] rounded-full flex items-center justify-between px-6 lg:px-8 shadow-[0_8px_32px_rgba(16,185,129,0.2)]">
          <div className="flex items-center gap-8">
            <div className="flex items-center">
              <img src="/distribucore-logo.png" alt="DistribuCore" className="h-9 object-contain drop-shadow-sm" />
            </div>
            <nav className="hidden md:flex items-center gap-7 font-['Plus_Jakarta_Sans',sans-serif] font-extrabold text-[13px] tracking-wide text-[#1B512D]">
              <a href="#features" className="hover:text-emerald-950 transition-all hover:scale-105">Modules</a>
              <a href="#about" className="hover:text-emerald-950 transition-all hover:scale-105">About</a>
              <a href="#contact" className="hover:text-emerald-950 transition-all hover:scale-105">Support</a>
            </nav>
          </div>
          
          <div className="flex items-center gap-3 font-['Plus_Jakarta_Sans',sans-serif]">
            <Link to={isAuthenticated ? "/dashboard" : "/register"} className="bg-amber-400 hover:bg-amber-500 text-gray-900 font-extrabold py-2 px-5 rounded-full shadow-sm hover:shadow-md transition-all hover:scale-105 active:scale-95 text-[12px] tracking-wider uppercase">
              Get Started
            </Link>
            <Link to="/login" className="bg-amber-400 hover:bg-amber-500 text-gray-900 font-extrabold py-2 px-5 rounded-full shadow-sm hover:shadow-md transition-all hover:scale-105 active:scale-95 text-[12px] tracking-wider uppercase">
              Login
            </Link>
            
            <select 
              onChange={(e) => changeLanguage(e.target.value)}
              className="ml-1 bg-white/90 backdrop-blur-sm text-gray-800 text-[12px] font-extrabold py-2 pl-3 pr-7 rounded-full shadow-sm focus:outline-none cursor-pointer border border-white/90 tracking-wide"
            >
              <option value="en">English</option>
              <option value="hi">हिन्दी</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
            </select>
          </div>
        </header>
      </div>

      {/* STRUCTURAL GAP BETWEEN HEADER AND HERO CARD */}
      <div className="h-5"></div>

      {/* 2. HERO SECTION CARD CONTAINER WITH STRUCTURAL GAP & ROUNDED CORNERS */}
      <div className="max-w-7xl mx-auto w-full px-4 lg:px-8">
        <section className="w-full bg-gradient-to-br from-[#f4fce3] to-[#e6fcf0] rounded-[36px] border border-white/80 shadow-[0_12px_40px_rgba(16,185,129,0.15)] flex flex-col lg:flex-row items-center justify-between px-8 lg:px-16 py-16 min-h-[540px] relative overflow-hidden">
          
          {/* Decor */}
          <div className="absolute top-0 left-0 w-64 opacity-40 pointer-events-none">
            <img src="https://res.cloudinary.com/dp5rqtjnk/image/upload/v1766664536/conorimage_zimsv8.svg" alt="Decor" className="w-full" />
          </div>

          {/* Left Text */}
          <div className="flex-1 flex flex-col justify-center max-w-[750px] text-left relative z-10 lg:pl-6">
            <h2 className="font-black text-[2.8rem] lg:text-[3.6rem] leading-[1.1] tracking-tight mb-4 text-[#1B512D]">
              Complete Wholesale ERP & CRM System
            </h2>
            <h3 className="text-gray-800 font-extrabold text-[1.5rem] mb-5 tracking-wide">
              Streamline your distribution operations
            </h3>
            <p className="text-gray-700 font-semibold text-[17px] leading-relaxed opacity-90 mt-1">
              Manage customers, products, stock, sales challans, and invoices in one place.
            </p>
            <p className="text-gray-700 font-semibold text-[17px] leading-relaxed opacity-90 mt-1">
              Built for sales, warehouse, and accounts teams.
            </p>
          </div>

          {/* Right Image */}
          <div className="flex-1 flex flex-col items-center justify-center mt-12 lg:mt-0 relative z-10">
            <div className="relative w-[360px] h-[360px] flex items-center justify-center">
              <div className="absolute inset-0 bg-[#dff5c7]/60 shadow-[0_0_80px_20px_rgba(255,255,255,0.9)] rounded-full"></div>
              <img 
                src="https://res.cloudinary.com/dp5rqtjnk/image/upload/v1766664716/Shopping_bag-cuate_nerjbu.svg" 
                alt="Shopping bag" 
                className="relative z-10 w-full h-full object-contain p-4 drop-shadow-md" 
              />
            </div>
            <p className="text-[#1B512D] font-bold text-[15px] mt-8 tracking-wide bg-white/70 backdrop-blur-md px-5 py-2 rounded-full border border-white shadow-sm">
              Real-time Stock • Sales Challans • Basic CRM Follow-ups
            </p>
          </div>
        </section>
      </div>

      {/* STRUCTURAL GAP BEFORE MODULES SECTION */}
      <div className="h-8"></div>

      {/* 3. SHOP WITH CATEGORIES */}
      <section id="features" className="w-full bg-gradient-to-br from-[#e0f2fe] via-[#dbeafe] to-[#e0f2fe] flex flex-col items-center py-20 pb-28 border-t border-sky-200/50">
        <h2 className="text-[#0369a1] text-[38px] font-black mb-16 tracking-tight">Core Modules</h2>
        
        <div className="flex flex-wrap justify-center gap-6 px-4 max-w-7xl mx-auto">
          {[
            { name: "Customers & CRM", img: "https://res.cloudinary.com/dp5rqtjnk/image/upload/v1766664649/Grocery_tfqqyi.svg" },
            { name: "Products & Stock", img: "https://res.cloudinary.com/dp5rqtjnk/image/upload/v1766664673/healthcare_wlqdj2.svg" },
            { name: "Purchase Orders", img: "https://res.cloudinary.com/dp5rqtjnk/image/upload/v1766664608/fruites_nmktha.svg" },
            { name: "Sales Challans", img: "https://res.cloudinary.com/dp5rqtjnk/image/upload/v1766664634/gadgets_vcvfuh.svg" },
            { name: "Billing & Invoices", img: "https://res.cloudinary.com/dp5rqtjnk/image/upload/v1766664562/dress_w7zk5r.svg" }
          ].map((cat, idx) => (
            <div 
              key={idx} 
              className="w-[220px] h-[270px] bg-[#bae6fd]/70 backdrop-blur-md rounded-[24px] border border-sky-200/60 flex flex-col items-center p-6 cursor-pointer transition-all duration-300 hover:bg-white hover:-translate-y-2 hover:shadow-2xl hover:outline hover:outline-[3px] hover:outline-[#0284c7] hover:outline-offset-[6px] group"
            >
              <div className="flex-1 w-full flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-105">
                 <img src={cat.img} alt={cat.name} className="w-full h-full object-contain" />
              </div>
              <h3 className="text-[#0c4a6e] font-bold text-[16px] text-center leading-tight">
                {cat.name}
              </h3>
            </div>
          ))}
        </div>
      </section>

      {/* 4. DISCOVER LOCAL SERVICES */}
      <section id="about" className="w-full bg-[#dff5c7]/60 flex justify-center py-24 px-8">
        <div className="max-w-[1400px] w-full flex flex-col lg:flex-row items-center justify-between gap-16">
          
          {/* Left Text */}
          <div className="flex-1 max-w-2xl text-gray-800">
            <h2 className="text-3xl md:text-4xl lg:text-[42px] font-extrabold text-[#1B512D] leading-[1.2] mb-6 tracking-tight">
              Manage Wholesale Distribution Workflows, Instantly
            </h2>
            <p className="text-lg md:text-xl font-semibold text-gray-800 mb-6 leading-relaxed">
              Empower your internal teams with a reliable ERP system — fast, reliable, and hassle-free.
            </p>
            <p className="text-base md:text-lg font-medium text-gray-700 mb-4 leading-relaxed">
              <span className="text-[#e34234] font-bold">Distribu<span className="text-[#1B512D]">C</span>ore</span> connects your sales, warehouse, and accounts teams using a centralized business platform.
            </p>
            <p className="text-base md:text-lg font-normal text-gray-600 mb-8 leading-relaxed">
              Many distribution businesses struggle with scattered data, while teams struggle to track stock and process sales in urgent situations. <span className="text-[#e34234] font-semibold">Distribu<span className="text-[#1B512D]">C</span>ore</span> bridges this gap with full-stack workflow management.
            </p>
            
            <div className="space-y-3 font-semibold text-base md:text-lg text-[#1B512D] mt-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={20} className="text-[#1B512D] flex-shrink-0" />
                <span>Centralized customer CRM</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 size={20} className="text-[#1B512D] flex-shrink-0" />
                <span>Real-time stock tracking</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 size={20} className="text-[#1B512D] flex-shrink-0" />
                <span>Automated sales challans & invoices</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 size={20} className="text-[#1B512D] flex-shrink-0" />
                <span>Complete team access for sales & warehouse</span>
              </div>
            </div>
          </div>

          {/* Right SVG Diagram */}
          <div className="flex-1 flex justify-center items-center h-[550px]">
            <img 
              src="https://res.cloudinary.com/dp5rqtjnk/image/upload/v1766664278/brand_loyalty-bro_katozf.svg" 
              alt="Discover local services" 
              className="w-full max-w-[550px] object-contain drop-shadow-md" 
            />
          </div>
        </div>
      </section>

      {/* 5. HOW IT WORKS (Steps) */}
      <section className="w-full bg-gradient-to-br from-[#e0f2fe] via-[#bae6fd]/50 to-[#e0f2fe] flex justify-center py-28 pb-32 border-y border-sky-200/50">
        <div className="flex flex-col md:flex-row justify-center gap-10 px-8 max-w-6xl w-full">
          
          <div className="flex-1 bg-[#bae6fd]/70 backdrop-blur-md rounded-2xl border border-sky-200/70 p-10 flex flex-col items-center text-center transition-all duration-300 hover:bg-white hover:shadow-xl hover:-translate-y-2 hover:ring-2 hover:ring-sky-400/50 cursor-pointer">
            <div className="h-44 w-44 flex items-center justify-center mb-6">
              <img src="https://res.cloudinary.com/dp5rqtjnk/image/upload/v1766664693/search_b3egwz.svg" alt="Search nearby services" className="w-full h-full object-contain" />
            </div>
            <h4 className="text-[#0369a1] font-black text-[22px] mb-2 tracking-tight">Record Sales</h4>
            <p className="text-gray-700 font-medium text-[16px]">Create sales challans and track orders</p>
          </div>

          <div className="flex-1 bg-[#bae6fd]/70 backdrop-blur-md rounded-2xl border border-sky-200/70 p-10 flex flex-col items-center text-center transition-all duration-300 hover:bg-white hover:shadow-xl hover:-translate-y-2 hover:ring-2 hover:ring-sky-400/50 cursor-pointer">
            <div className="h-44 w-44 flex items-center justify-center mb-6">
              <img src="https://res.cloudinary.com/dp5rqtjnk/image/upload/v1766664524/choose_tlzjzs.svg" alt="Choose provider" className="w-full h-full object-contain" />
            </div>
            <h4 className="text-[#0369a1] font-black text-[22px] mb-2 tracking-tight">Manage Stock</h4>
            <p className="text-gray-700 font-medium text-[16px]">Monitor real-time inventory</p>
          </div>

          <div className="flex-1 bg-[#bae6fd]/70 backdrop-blur-md rounded-2xl border border-sky-200/70 p-10 flex flex-col items-center text-center transition-all duration-300 hover:bg-white hover:shadow-xl hover:-translate-y-2 hover:ring-2 hover:ring-sky-400/50 cursor-pointer">
            <div className="h-44 w-44 flex items-center justify-center mb-6">
              <img src="https://res.cloudinary.com/dp5rqtjnk/image/upload/v1766664550/contact_u8qd6m.svg" alt="Connect instantly" className="w-full h-full object-contain" />
            </div>
            <h4 className="text-[#0369a1] font-black text-[22px] mb-2 tracking-tight">Generate Invoices</h4>
            <p className="text-gray-700 font-medium text-[16px]">Auto-generate PDF summaries for accounts</p>
          </div>

        </div>
      </section>

      {/* 6. CTA SECTION */}
      <section className="w-full bg-gradient-to-br from-[#dff5c7] via-[#e6fcf0] to-[#dff5c7] flex justify-center py-20 px-8">
        <div className="max-w-6xl w-full flex flex-col md:flex-row items-center justify-between bg-white rounded-3xl p-12 shadow-2xl">
          <div className="flex-1 pr-8">
            <h2 className="text-[#196568] text-4xl font-black mb-4">Ready to streamline your wholesale business?</h2>
            <p className="text-gray-600 text-xl font-medium mb-8">Deploy our full-stack ERP system to manage your distribution workflow today.</p>
            <Link to={isAuthenticated ? "/dashboard" : "/login"} className="inline-block bg-[#196568] hover:bg-[#145254] text-white font-bold py-3 px-8 rounded-lg shadow-lg transition-transform hover:scale-105 text-lg">
              Access Dashboard
            </Link>
          </div>
          <div className="flex-1 flex justify-end">
            <img 
              src="https://res.cloudinary.com/dp5rqtjnk/image/upload/v1768032157/Online_Groceries-bro_1_wpqb3j.svg" 
              alt="Mobile App Preview" 
              className="w-full max-w-[400px] object-contain drop-shadow-xl"
            />
          </div>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer id="contact" className="w-full bg-gradient-to-br from-[#dff5c7] via-[#e6fcf0] to-[#dff5c7] text-gray-800 py-16 px-10 border-t border-emerald-200/60">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          
          <div>
            <div className="mb-4">
              <img src="/distribucore-logo.png" alt="DistribuCore" className="h-10 object-contain drop-shadow-sm" />
            </div>
            <p className="text-[#1B512D] font-bold mb-2">+91 908765654</p>
            <p className="text-[#1B512D] font-semibold">distribucoreinfo@distribucore.com</p>
          </div>

          <div>
            <h4 className="text-lg font-extrabold mb-4 text-[#1B512D]">Quick Links</h4>
            <ul className="space-y-3 text-gray-700 font-semibold text-sm">
              <li className="hover:text-[#1B512D] cursor-pointer transition-colors"><Link to="/dashboard">Dashboard</Link></li>
              <li className="hover:text-[#1B512D] cursor-pointer transition-colors"><Link to="/products">Stock Management</Link></li>
              <li className="hover:text-[#1B512D] cursor-pointer transition-colors"><Link to="/transactions">Transactions</Link></li>
              <li className="hover:text-[#1B512D] cursor-pointer transition-colors"><Link to="/customers">Customer CRM</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-extrabold mb-4 text-[#1B512D]">Legal</h4>
            <ul className="space-y-3 text-gray-700 font-semibold text-sm">
              <li className="hover:text-[#1B512D] cursor-pointer transition-colors">Terms & conditions</li>
              <li className="hover:text-[#1B512D] cursor-pointer transition-colors">Privacy Policy</li>
              <li className="hover:text-[#1B512D] cursor-pointer transition-colors">Refund Policy</li>
            </ul>
          </div>

        </div>
        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-[#1B512D]/20 text-center text-[#1B512D] font-bold text-sm">
          © {new Date().getFullYear()} DistribuCore. All rights reserved.
        </div>
      </footer>

      {/* Floating Chat Icon (Removed per request) */}
      
    </div>
  );
};

export default Landing;
