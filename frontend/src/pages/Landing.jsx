import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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
    <div className="font-sans flex flex-col min-h-screen bg-white overflow-x-hidden relative">
      
      {/* 1. TOP HEADER (Floating Glass Navbar) */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 w-[95%] max-w-7xl z-50">
        <header className="bg-white/40 backdrop-blur-md border border-white/60 h-[75px] rounded-full flex items-center justify-between px-6 lg:px-8 shadow-lg">
          <div className="flex items-center gap-10">
            <div className="flex items-center drop-shadow-md">
              <img src="/distribucore-logo.png" alt="DistribuCore" className="h-10 object-contain" />
            </div>
            <nav className="hidden md:flex items-center gap-6 font-bold text-[15px] text-[#1a2c3a]">
              <a href="#features" className="hover:text-green-700 transition-colors">Modules</a>
              <a href="#about" className="hover:text-green-700 transition-colors">About</a>
              <a href="#contact" className="hover:text-green-700 transition-colors">Support</a>
            </nav>
          </div>
          
          <div className="flex items-center gap-3">
            <Link to={isAuthenticated ? "/dashboard" : "/register"} className="bg-amber-400 hover:bg-amber-500 text-black font-bold py-2.5 px-6 rounded-full shadow-md transition-transform hover:scale-105 active:scale-95 text-[14px]">
              Get Started
            </Link>
            <Link to="/login" className="bg-amber-400 hover:bg-amber-500 text-black font-bold py-2.5 px-6 rounded-full shadow-md transition-transform hover:scale-105 active:scale-95 text-[14px]">
              Login
            </Link>
            
            <select 
              onChange={(e) => changeLanguage(e.target.value)}
              className="ml-2 appearance-none bg-white text-gray-800 text-[13px] font-bold py-2.5 pl-4 pr-8 rounded-full shadow-md focus:outline-none cursor-pointer border border-gray-100"
            >
              <option value="en">English</option>
              <option value="hi">हिन्दी</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
            </select>
          </div>
        </header>
      </div>

      {/* 2. HERO SECTION (Solid Red) */}
      <section className="w-full bg-[#dff5c7] flex flex-col lg:flex-row items-center justify-between px-10 lg:px-24 pt-32 pb-20 min-h-[600px] relative overflow-hidden">
        
        {/* Decor */}
        <div className="absolute top-0 left-0 w-64 opacity-50 pointer-events-none">
          <img src="https://res.cloudinary.com/dp5rqtjnk/image/upload/v1766664536/conorimage_zimsv8.svg" alt="Decor" className="w-full" />
        </div>

        {/* Left Text */}
        <div className="flex-1 flex flex-col justify-center max-w-[800px] text-left relative z-10 pl-10">
          <h2 className="text-shine-black font-black text-[3rem] lg:text-[4rem] leading-[1.1] tracking-tight mb-4 animate-float-smooth">
            Complete Wholesale ERP & CRM System
          </h2>
          <h3 className="text-black font-black text-[1.8rem] mb-6 tracking-wide">
            Streamline your distribution operations
          </h3>
          <p className="text-black font-medium text-[19px] opacity-90 tracking-wide mt-2">
            Manage customers, products, stock, sales challans, and invoices in one place.
          </p>
          <p className="text-black font-medium text-[19px] opacity-90 tracking-wide mt-2">
            Built for sales, warehouse, and accounts teams.
          </p>
        </div>

        {/* Right Image */}
        <div className="flex-1 flex flex-col items-center justify-center mt-16 lg:mt-0 relative z-10">
          <div className="relative w-[400px] h-[400px] flex items-center justify-center">
            <div className="absolute inset-0 bg-[#dff5c7] shadow-[0_0_90px_20px_rgba(255,255,255,0.8)] rounded-sm"></div>
            <img 
              src="https://res.cloudinary.com/dp5rqtjnk/image/upload/v1766664716/Shopping_bag-cuate_nerjbu.svg" 
              alt="Shopping bag" 
              className="relative z-10 w-full h-full object-cover p-4" 
            />
          </div>
          <p className="text-black font-bold text-[16px] mt-10 tracking-wide">
            Real-time Stock • Sales Challans • Basic CRM Follow-ups
          </p>
        </div>
      </section>

      {/* 3. SHOP WITH CATEGORIES */}
      <section id="features" className="w-full bg-[#cbd1d4] flex flex-col items-center py-20 pb-28 border-t border-gray-300/30">
        <h2 className="text-[#1a2c3a] text-[38px] font-black mb-16 tracking-tight">Core Modules</h2>
        
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
              className="w-[220px] h-[270px] bg-[#bbc2c6] rounded-[24px] flex flex-col items-center p-6 cursor-pointer transition-all duration-300 hover:bg-white hover:-translate-y-2 hover:shadow-2xl hover:outline hover:outline-[3px] hover:outline-[#1a5b5e] hover:outline-offset-[6px] group"
            >
              <div className="flex-1 w-full flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-105">
                 <img src={cat.img} alt={cat.name} className="w-full h-full object-contain" />
              </div>
              <h3 className="text-[#1a2c3a] font-bold text-[16px] text-center leading-tight">
                {cat.name}
              </h3>
            </div>
          ))}
        </div>
      </section>

      {/* 4. DISCOVER LOCAL SERVICES */}
      <section id="about" className="w-full bg-[#dff5c7] flex justify-center py-24 px-8">
        <div className="max-w-[1400px] w-full flex flex-col lg:flex-row items-center justify-between gap-16">
          
          {/* Left Text */}
          <div className="flex-1 max-w-2xl text-[#0b1727]">
            <h2 className="text-4xl md:text-[44px] font-black leading-[1.1] mb-8 tracking-tight">
              Manage Wholesale Distribution<br/>Workflows, Instantly
            </h2>
            <p className="text-xl font-bold mb-8">
              Empower your internal teams with a reliable ERP system — fast, reliable, and hassle-free.
            </p>
            <p className="text-[19px] font-black mb-6 leading-snug">
              <span className="text-[#e34234] font-bold">Distribu<span className="text-[#1B512D]">C</span>ore</span> connects your sales, warehouse, and accounts teams<br/>
              using a centralized business platform.
            </p>
            <p className="text-[18px] font-medium mb-8 leading-relaxed opacity-90">
              Many distribution businesses struggle with scattered data, while teams struggle<br/>
              to track stock and process sales in urgent situations.<br/>
              <span className="text-[#e34234] font-bold">Distribu<span className="text-[#1B512D]">C</span>ore</span> bridges this gap with full-stack workflow management.
            </p>
            
            <ul className="space-y-4 font-black text-[18px] opacity-90 mt-4">
              <li>• Centralized customer CRM</li>
              <li>• Real-time stock tracking</li>
              <li>• Automated sales challans & invoices</li>
              <li>• Complete team access for sales & warehouse</li>
            </ul>
          </div>

          {/* Right SVG Diagram */}
          <div className="flex-1 flex justify-center items-center h-[550px]">
            <img 
              src="https://res.cloudinary.com/dp5rqtjnk/image/upload/v1766664278/brand_loyalty-bro_katozf.svg" 
              alt="Discover local services" 
              className="w-full max-w-[550px] object-contain" 
            />
          </div>
        </div>
      </section>

      {/* 5. HOW IT WORKS (Steps) */}
      <section className="w-full bg-[#cbd0d2] flex justify-center py-28 pb-32">
        <div className="flex flex-col md:flex-row justify-center gap-10 px-8 max-w-6xl w-full">
          
          <div className="flex-1 bg-[#b9bec1] rounded-2xl p-10 flex flex-col items-center text-center transition-all duration-300 hover:bg-white hover:shadow-xl hover:-translate-y-2 hover:ring-2 hover:ring-teal-200/50 cursor-pointer">
            <div className="h-44 w-44 flex items-center justify-center mb-6">
              <img src="https://res.cloudinary.com/dp5rqtjnk/image/upload/v1766664693/search_b3egwz.svg" alt="Search nearby services" className="w-full h-full object-contain" />
            </div>
            <h4 className="text-[#103a27] font-black text-[22px] mb-2 tracking-tight">Record Sales</h4>
            <p className="text-gray-700 font-medium text-[16px]">Create sales challans and track orders</p>
          </div>

          <div className="flex-1 bg-[#b9bec1] rounded-2xl p-10 flex flex-col items-center text-center transition-all duration-300 hover:bg-white hover:shadow-xl hover:-translate-y-2 hover:ring-2 hover:ring-teal-200/50 cursor-pointer">
            <div className="h-44 w-44 flex items-center justify-center mb-6">
              <img src="https://res.cloudinary.com/dp5rqtjnk/image/upload/v1766664524/choose_tlzjzs.svg" alt="Choose provider" className="w-full h-full object-contain" />
            </div>
            <h4 className="text-[#102347] font-black text-[22px] mb-2 tracking-tight">Manage Stock</h4>
            <p className="text-gray-700 font-medium text-[16px]">Monitor real-time inventory</p>
          </div>

          <div className="flex-1 bg-[#b9bec1] rounded-2xl p-10 flex flex-col items-center text-center transition-all duration-300 hover:bg-white hover:shadow-xl hover:-translate-y-2 hover:ring-2 hover:ring-teal-200/50 cursor-pointer">
            <div className="h-44 w-44 flex items-center justify-center mb-6">
              <img src="https://res.cloudinary.com/dp5rqtjnk/image/upload/v1766664550/contact_u8qd6m.svg" alt="Connect instantly" className="w-full h-full object-contain" />
            </div>
            <h4 className="text-[#102347] font-black text-[22px] mb-2 tracking-tight">Generate Invoices</h4>
            <p className="text-gray-700 font-medium text-[16px]">Auto-generate PDF summaries for accounts</p>
          </div>

        </div>
      </section>

      {/* 6. CTA SECTION */}
      <section className="w-full bg-[#dff5c7] flex justify-center py-20 px-8 border-y-8 border-yellow-400">
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
      <footer id="contact" className="w-full bg-[#1b2b3a] text-white py-16 px-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          
          <div>
            <div className="mb-4">
              <img src="/distribucore-logo.png" alt="DistribuCore" className="h-10 object-contain" />
            </div>
            <p className="text-gray-300 font-medium mb-2">+91 908765654</p>
            <p className="text-gray-300 font-medium">distribucoreinfo@distribucore.com</p>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-4 text-gray-200">Quick Links</h4>
            <ul className="space-y-3 text-gray-400">
              <li className="hover:text-white cursor-pointer transition-colors"><Link to="/dashboard">Dashboard</Link></li>
              <li className="hover:text-white cursor-pointer transition-colors"><Link to="/products">Stock Management</Link></li>
              <li className="hover:text-white cursor-pointer transition-colors"><Link to="/transactions">Transactions</Link></li>
              <li className="hover:text-white cursor-pointer transition-colors"><Link to="/customers">Customer CRM</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-4 text-gray-200">Legal</h4>
            <ul className="space-y-3 text-gray-400">
              <li className="hover:text-white cursor-pointer transition-colors">Terms & conditions</li>
              <li className="hover:text-white cursor-pointer transition-colors">Privacy Policy</li>
              <li className="hover:text-white cursor-pointer transition-colors">Refund Policy</li>
            </ul>
          </div>

        </div>
        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-gray-700 text-center text-gray-500 text-sm">
          © {new Date().getFullYear()} DistribuCore. All rights reserved.
        </div>
      </footer>

      {/* Floating Chat Icon (Removed per request) */}
      
    </div>
  );
};

export default Landing;
