import React from 'react';
import { Menu, Bot, Home, GraduationCap, Sparkles, Presentation, Lightbulb, Radio, PenTool, FileText, Brain } from 'lucide-react';

interface HeaderProps {
  onMenuToggle: () => void;
  activeView: string;
}

const Header: React.FC<HeaderProps> = ({ onMenuToggle, activeView }) => {

  return (
    <header className="bg-white shadow-md border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center space-x-3">
           <img src='https://companieslogo.com/img/orig/PRGS-0584b711.png?t=1720244493' style={{width: '30px'}}/>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Progress</h1>
            </div>
          </div>
        </div>
        <div className="hidden lg:flex items-center space-x-6">
          <a href="#ai" className="text-gray-600 hover:text-blue-600 transition-colors font-bold uppercase flex items-center space-x-1">
            <span>AI</span>
            <span className="text-sm">▼</span>
          </a>
          <a href="#solutions" className="text-gray-600 hover:text-blue-600 transition-colors font-bold uppercase flex items-center space-x-1">
            <span>Solutions</span>
            <span className="text-sm">▼</span>
          </a>
          <a href="#products" className="text-gray-600 hover:text-blue-600 transition-colors font-bold uppercase flex items-center space-x-1">
            <span>Products</span>
            <span className="text-sm">▼</span>
          </a>
          <a href="#support" className="text-gray-600 hover:text-blue-600 transition-colors font-bold uppercase flex items-center space-x-1">
            <span>Support & Services</span>
            <span className="text-sm">▼</span>
          </a>
          <a href="#resources" className="text-gray-600 hover:text-blue-600 transition-colors font-bold uppercase flex items-center space-x-1">
            <span>Resources</span>
            <span className="text-sm">▼</span>
          </a>
          <a href="#partners" className="text-gray-600 hover:text-blue-600 transition-colors font-bold uppercase flex items-center space-x-1">
            <span>Partners</span>
            <span className="text-sm">▼</span>
          </a>
          <a href="#company" className="text-gray-600 hover:text-blue-600 transition-colors font-bold uppercase flex items-center space-x-1">
            <span>Company</span>
            <span className="text-sm">▼</span>
          </a>
          <div className="flex items-center space-x-4">
            <button className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-600 transition-all">
              <Sparkles className="w-5 h-5" />
              <span>Ready to Talk?</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;