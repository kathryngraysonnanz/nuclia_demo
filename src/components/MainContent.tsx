import React, { useState, useEffect } from 'react';
import { Bot, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface SynthaResponse {
  answer: string;
  status: string;
  retrieval_results?: {
    resources: Record<string, any>;
  };
  sources?: Array<{
    title: string;
    url?: string;
    snippet?: string;
  }>;
}

interface RetrievalResource {
  id: string;
  title: string;
  summary?: string;
  icon?: string;
  thumbnail?: string;
  metadata?: {
    language?: string;
    status?: string;
  };
  data?: {
    texts?: Record<string, any>;
  };
  generics?: {
    title?: {
      value: string;
    };
  };
}

const defaultQuery = {
  id: 'what-is-syntha',
  title: 'What is Syntha?',
  query: 'Write a paragraph describing Progress Software in under 50 words',
  description: 'Learn about Syntha\'s core capabilities and features'
}

const MainContent: React.FC<{ searchTerm: string }> = ({ searchTerm }) => {
  const [response, setResponse] = useState<SynthaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [streamedText, setStreamedText] = useState('');
  const [retrievalResults, setRetrievalResults] = useState<RetrievalResource[]>([]);
  const [currentQuery, setCurrentQuery] = useState(defaultQuery);

  useEffect(() => {
    if (searchTerm) {
      let searchQuery = {
        id: 'search-query',
        title: 'User Search', 
        query: `Write a paragraph describing Progress Software's products and features answering ${searchTerm} in under 50 words.`,
        description: 'Learn about Progress\'s core capabilities and features'
      };
      setCurrentQuery(searchQuery);
    }
  }, [searchTerm]);

  const fetchSynthaInfo = async (queryText?: string) => {
    setLoading(true);
    setError(null);
    setStreamedText('');
    setRetrievalResults([]);
    
    const queryToUse = queryText || currentQuery.query;
    
    try {
      // Get environment variables
      const apiUrl = import.meta.env.VITE_SYNTHA_API_URL;
      const kbId = import.meta.env.VITE_SYNTHA_KB_ID;
      const apiKey = import.meta.env.VITE_SYNTHA_API_KEY;

      if (!apiUrl || !kbId || !apiKey) {
        throw new Error('Syntha API configuration missing. Please check your environment variables.');
      }

      // Construct the correct API endpoint
      const knowledgeBoxUrl = `${apiUrl}/kb/${kbId}`;
      const askUrl = `${knowledgeBoxUrl}/ask`;

      const requestBody = {
        query: queryToUse,
        chat_history: [],
        show: [
          "basic",
          "values",
          "origin"
        ],
        features: [
          "semantic"
        ],
        highlight: false,
        citations: true,
        rephrase: true,
        debug: false,
        show_hidden: false,
        autofilter: false,
        filters: [],
        rag_strategies: [
          {
            name: "neighbouring_paragraphs",
            before: 2,
            after: 2
          }
        ],
        shards: [],
        max_tokens: 4000
      };

      const headers = {
        'X-NUCLIA-SERVICEACCOUNT': `Bearer ${apiKey}`,
        'x-synchronous': 'false',
        'Content-Type': 'application/json',
      };

      console.log('Making request to:', askUrl);
      console.log('Request body:', requestBody);

      const apiResponse = await fetch(askUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestBody),
      });

      if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        throw new Error(`API request failed: ${apiResponse.status} ${apiResponse.statusText}. Response: ${errorText}`);
      }

      // Handle streaming response
      if (!apiResponse.body) {
        throw new Error('Response body is null');
      }

      const reader = apiResponse.body.getReader();
      const decoder = new TextDecoder();
      let finalData: any = null;
      let currentAnswer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            break;
          }

          // Decode the chunk
          const chunk = decoder.decode(value, { stream: true });
          console.log('Raw chunk:', chunk);

          // Split by newlines and process each line
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;

            try {
              // Parse the JSON line
              const data = JSON.parse(trimmedLine);
              console.log('Parsed chunk data:', data);
              
              // Check for answer text in the item structure
              if (data?.item?.type === 'answer' && data.item.text !== undefined) {
                // Append the new text chunk to build the complete answer
                currentAnswer += data.item.text;
                setStreamedText(currentAnswer);
              }
              
              // Check for retrieval results
              if (data?.item?.type === 'retrieval' && data.item.results?.resources) {
                console.log('Found retrieval results:', data.item.results.resources);
                const resources = Object.values(data.item.results.resources) as RetrievalResource[];
                setRetrievalResults(resources);
              }
              
              // Check for complete answer at root level (fallback)
              if (data?.answer && data.answer !== currentAnswer) {
                currentAnswer = data.answer;
                setStreamedText(currentAnswer);
              }
              
              // Keep track of other important data (retrieval results, status, etc.)
              if (data && typeof data === 'object') {
                if (data.item?.type === 'retrieval' || data.retrieval_results) {
                  finalData = { ...finalData, ...data };
                }
                if (data.item?.type === 'status' || data.status) {
                  finalData = { ...finalData, ...data };
                }
                if (data.answer || data.item?.type === 'answer') {
                  finalData = { ...finalData, answer: currentAnswer };
                }
              }
            } catch (parseError) {
              console.log('Could not parse line as JSON:', trimmedLine, parseError);
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      console.log('Final streaming data:', finalData);
      console.log('Final answer text:', currentAnswer);
      
      // Process the final response
      const processedResponse: SynthaResponse = {
        answer: currentAnswer || finalData?.answer || 'No answer provided',
        status: finalData?.status || finalData?.item?.status || 'success',
        retrieval_results: finalData?.retrieval_results || finalData?.item?.results,
        sources: []
      };

      // Extract sources from retrieval_results if available
      const retrievalResultsData = finalData?.retrieval_results || finalData?.item?.results;
      if (retrievalResultsData?.resources) {
        const resources = Object.values(retrievalResultsData.resources) as any[];
        processedResponse.sources = resources.slice(0, 5).map((resource: any) => ({
          title: resource.title || resource.generics?.title?.value || resource.id || 'Unknown Source',
          url: resource.url,
          snippet: resource.data?.texts ? 
            Object.values(resource.data.texts)[0]?.value?.body?.substring(0, 200) + '...' :
            'No preview available'
        }));
      }

      setResponse(processedResponse);
    } catch (err) {
      console.error('Error fetching Syntha info:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch Syntha information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSynthaInfo();
  }, [currentQuery]);

  // Custom markdown components for better styling
  const markdownComponents = {
    // Headings
    h1: ({ children }: any) => (
      <h1 className="text-xl font-bold text-gray-900 mb-3 mt-4 first:mt-0">{children}</h1>
    ),
    h2: ({ children }: any) => (
      <h2 className="text-lg font-semibold text-gray-900 mb-2 mt-3 first:mt-0">{children}</h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="text-base font-semibold text-gray-900 mb-2 mt-3 first:mt-0">{children}</h3>
    ),
    
    // Paragraphs
    p: ({ children }: any) => (
      <p className="text-gray-700 leading-relaxed mb-3 last:mb-0">{children}</p>
    ),
    
    // Lists
    ul: ({ children }: any) => (
      <ul className="list-disc list-inside text-gray-700 mb-3 space-y-1">{children}</ul>
    ),
    ol: ({ children }: any) => (
      <ol className="list-decimal list-inside text-gray-700 mb-3 space-y-1">{children}</ol>
    ),
    li: ({ children }: any) => (
      <li className="text-gray-700">{children}</li>
    ),
    
    // Code
    code: ({ inline, children }: any) => 
      inline ? (
        <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-sm font-mono">
          {children}
        </code>
      ) : (
        <code className="block bg-gray-100 text-gray-800 p-3 rounded-lg text-sm font-mono overflow-x-auto mb-3">
          {children}
        </code>
      ),
    
    // Code blocks
    pre: ({ children }: any) => (
      <pre className="bg-gray-100 text-gray-800 p-3 rounded-lg text-sm font-mono overflow-x-auto mb-3">
        {children}
      </pre>
    ),
    
    // Blockquotes
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-blue-500 pl-4 py-2 mb-3 bg-blue-50 text-gray-700 italic">
        {children}
      </blockquote>
    ),
    
    // Links
    a: ({ href, children }: any) => (
      <a 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 underline"
      >
        {children}
      </a>
    ),
    
    // Strong/Bold
    strong: ({ children }: any) => (
      <strong className="font-semibold text-gray-900">{children}</strong>
    ),
    
    // Emphasis/Italic
    em: ({ children }: any) => (
      <em className="italic text-gray-700">{children}</em>
    ),
    
    // Tables
    table: ({ children }: any) => (
      <div className="overflow-x-auto mb-3">
        <table className="min-w-full border border-gray-300 rounded-lg">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }: any) => (
      <thead className="bg-gray-50">{children}</thead>
    ),
    tbody: ({ children }: any) => (
      <tbody className="divide-y divide-gray-200">{children}</tbody>
    ),
    tr: ({ children }: any) => (
      <tr className="hover:bg-gray-50">{children}</tr>
    ),
    th: ({ children }: any) => (
      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900 border-b border-gray-300">
        {children}
      </th>
    ),
    td: ({ children }: any) => (
      <td className="px-4 py-2 text-sm text-gray-700 border-b border-gray-200">
        {children}
      </td>
    ),
  };

  useEffect(() => {
    console.log('Search Term in MainContent:', searchTerm);
    // You can also trigger a new fetch here if needed based on the searchTerm change
    // fetchSynthaInfo(searchTerm);
  }, [searchTerm]);

  if (loading) {
    return (
      <main className="flex-1 bg-white">
        {/* Loading Hero Section */}
        <section className="relative text-white py-20"  style={{ backgroundImage: 'url(https://www.progress.com/images/default-source/home/home-footer-min.png?sfvrsn=c5e8151c_1)' }}>
          <div className="absolute inset-0 bg-black opacity-10"></div>
          <div className="relative max-w-7xl mx-auto px-6 text-center">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="text-xl font-medium">Loading Knowledge...</span>
            </div>  
          </div>
        </section>
      </main>
    );
  }

  // If no response or error, show minimal error state
  if (!response || error) {
    return (

        <section className="relative text-white"  style={{ backgroundImage: 'url(https://www.progress.com/images/default-source/home/home-footer-min.png?sfvrsn=c5e8151c_1)' }}>
         
          <div className="relative max-w-7xl mx-auto text-center">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <AlertCircle className="w-8 h-8 text-red-300" />
              <span className="text-xl font-medium">Unable to Load Syntha Content</span>
            </div>
            {error && (
              <p className="text-white/80 mb-6 max-w-2xl mx-auto">{error}</p>
            )}
            <button 
              onClick={handleRetry}
              className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/20 transition-all duration-200 border border-white/30"
            >
              <RefreshCw className="w-5 h-5" />
              <span>Retry Loading</span>
            </button>
          </div>
        </section>

    );
  }

  return (
    <main className="bg-white overflow-y-auto">
      {/* Hero Section - Content from Syntha */}
      <section
        className="relative bg-cover bg-center text-white py-10 lg:py-22"
        style={{ backgroundImage: 'url(https://dev-to-uploads.s3.amazonaws.com/uploads/articles/blbsc7sh2ieiuncs8fi0.png)', minHeight: '450px' }}
      >
        <div className="relative max-w-7xl mx-auto">
          <div className="text-left max-w-4xl mx-auto ml-10">
            <h1 className="text-5xl lg:text-5xl font-bold mb-6 leading-tight">
              What We Do
            </h1>
            <div className="text-lg lg:text-xl text-white/90 leading-relaxed mb-8">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  ...markdownComponents,
                  p: ({ children }: any) => (
                    <p className="text-white/90 leading-relaxed mb-4 last:mb-0">{children}</p>
                  ),
                  strong: ({ children }: any) => (
                    <strong className="font-semibold text-white">{children}</strong>
                  ),
                }}
              >
                {response.answer}
              </ReactMarkdown>
            </div>
            {searchTerm && 
            <button
              className="inline-flex items-center space-x-2 bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600 transition-all duration-200 shadow-md hover:shadow-lg"
            >
             Learn more about {searchTerm}
            </button>
            }
          </div>
        </div>
      </section>
    </main>
  );
};

export default MainContent;