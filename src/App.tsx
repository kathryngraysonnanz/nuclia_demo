import { useEffect, useState } from 'react';
import Header from './components/Header';
import MainContent from './components/MainContent';
import SynthaGPT from './components/SynthaGPT';
import SynthaResources from './components/SynthaResources';
import { Sparkle } from 'lucide-react';


function App() {
  const [searchTerm, setSearchTerm] = useState(''); 
  const [userInput, setUserInput] = useState(''); 

  console.log('home search', searchTerm);

  return (
    <div className="flex flex-col h-screen overflow-y-auto" style={{backgroundColor: '#101344'}}>
      {/* Header */}
      <Header />

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        <div>
          <MainContent searchTerm={searchTerm} />
        </div>

         {/* Search Input */}
      <div className="p-4 bg-gray-100 border-b-4 border-green-500" style={{ padding: '30px'}}>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center space-x-2 mb-4">
            <Sparkle className="w-6 h-6 text-blue-500" />
            <h2 className="text-3xl">How can we help you today?</h2>
          </div>
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="What are you curious about?"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setSearchTerm(userInput.trim());
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <button
              onClick={() => setSearchTerm(userInput.trim())}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
            >
              Submit
            </button>
          </div>
        </div>
      </div>
       <div>
          <SynthaGPT searchTerm={searchTerm} />
        </div>

        <div>
          <SynthaResources searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </div>

       
      </div>
    </div>
  );
}

export default App;