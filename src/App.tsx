import { useEffect, useState } from 'react';
import Header from './components/Header';
import MainContent from './components/MainContent';
import SynthaGPT from './components/SynthaGPT';
import SynthaResources from './components/SynthaResources';
import { Sparkle } from 'lucide-react';


function App() {
  const [searchTerm, setSearchTerm] = useState(''); 
  const [userInput, setUserInput] = useState(''); 

 useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (userInput) {
        setSearchTerm(userInput.trim());
        console.log('Search Term updated:', userInput.trim());
      }
    }, 500); // Wait 500ms after the user stops typing

    return () => clearTimeout(delayDebounceFn); // Cleanup the timeout on component unmount or userInput change
  }, [userInput]);

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
          <input
            type="text"
            placeholder="What are you curious about?"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
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