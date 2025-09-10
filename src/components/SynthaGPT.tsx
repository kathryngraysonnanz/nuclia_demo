import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, AlertCircle, X } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  isStreaming?: boolean;
}

interface ChatHistoryItem {
  author: 'NUCLIA' | 'USER';
  text: string;
}

const SynthaGPT: React.FC<{ searchTerm: string }> = ({ searchTerm }) => {

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm && !isLoading) {
        console.log('Search Term in SynthaGPT:', searchTerm);
        handleSubmit(searchTerm.trim());
      }
    }, 500); // Wait 500ms after the user stops typing

    return () => clearTimeout(delayDebounceFn); // Cleanup the timeout on component unmount or searchTerm change
  }, [searchTerm]);

  useEffect(() => {
    if (!searchTerm && !isLoading) {
      const defaultQuery = 'What are the top three Progress products?';
      console.log('Default Query in SynthaGPT:', defaultQuery);
      handleSubmit(defaultQuery);
    }
  }, [searchTerm]);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "",
      sender: 'assistant',
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('sitefinity');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

 
  

  const buildChatHistory = (): ChatHistoryItem[] => {
    // Convert messages to chat history format, excluding the initial greeting and streaming messages
    const conversationMessages = messages.slice(1).filter(msg => !msg.isStreaming);
    
    return conversationMessages.map(message => ({
      author: message.sender === 'user' ? 'USER' : 'NUCLIA',
      text: message.content
    }));
  };

  const askSynthaStreaming = async (
    query: string, 
    chatHistory: ChatHistoryItem[],
    onUpdate: (content: string) => void,
    signal: AbortSignal
  ): Promise<void> => {
    const apiUrl = import.meta.env.VITE_SYNTHA_API_URL;
    const kbId = import.meta.env.VITE_SYNTHA_KB_ID;
    const apiKey = import.meta.env.VITE_SYNTHA_API_KEY;

    if (!apiUrl || !kbId || !apiKey) {
      throw new Error('Syntha API configuration missing. Please check your environment variables.');
    }

    const knowledgeBoxUrl = `${apiUrl}/kb/${kbId}`;
    const askUrl = `${knowledgeBoxUrl}/ask`;

    const requestBody = {
      query: query,
      chat_history: chatHistory,
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

    console.log('Making Syntha streaming API request:', {
      url: askUrl,
      query: query,
      chatHistoryLength: chatHistory.length
    });

    const response = await fetch(askUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody),
      signal: signal,
    });

    console.log('answer', requestBody)

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${response.statusText}. Response: ${errorText}`);
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let currentAnswer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        if (signal.aborted) {
          throw new Error('Request aborted');
        }

        // Decode the chunk
        const chunk = decoder.decode(value, { stream: true });
        console.log('Raw streaming chunk:', chunk);

        // Split by newlines and process each line
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine) continue;

          try {
            // Parse the JSON line
            const data = JSON.parse(trimmedLine);
            console.log('Parsed streaming data:', data);
            
            // Check for answer text in the item structure
            if (data?.item?.type === 'answer' && data.item.text !== undefined) {
              // Append the new text chunk to build the complete answer
              currentAnswer += data.item.text;
              onUpdate(currentAnswer);
            }
            
            // Check for complete answer at root level (fallback)
            if (data?.answer && data.answer !== currentAnswer) {
              currentAnswer = data.answer;
              onUpdate(currentAnswer);
            }
          } catch (parseError) {
            console.log('Could not parse line as JSON:', trimmedLine, parseError);
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  };

  const handleSubmit = async (query: string) => {
    if (!query.trim() || isLoading) return;

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: `Tell me three Progress products related to ${query}. Respond in this format: { "data": [{ "id": 1, "product": "product1-title", "description": "product1-description", "link": "product-link" }] }`,
      sender: 'user',
      timestamp: new Date(),
    };

    setIsLoading(true);
    setError(null);

    // Create streaming assistant message
    const assistantMessageId = (Date.now() + 1).toString();
    const initialAssistantMessage: Message = {
      id: assistantMessageId,
      content: '',
      sender: 'assistant',
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages([userMessage, initialAssistantMessage]);

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      // Handle streaming response
      await askSynthaStreaming(
        userMessage.content,
        [],
        (content: string) => {
          // Update the streaming message with new content
          setMessages(prev => 
            prev.map(msg => 
              msg.id === assistantMessageId 
                ? { ...msg, content: content, isStreaming: true }
                : msg
            )
          );
        },
        abortControllerRef.current.signal
      );

      // Mark streaming as complete
      setMessages(prev => 
        prev.map(msg => 
          msg.id === assistantMessageId 
            ? { ...msg, isStreaming: false }
            : msg
        )
      );

    } catch (err) {
      console.error('Error calling Syntha streaming API:', err);
      
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was cancelled, remove the streaming message
        setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId));
        return;
      }

      setError(err instanceof Error ? err.message : 'Failed to get response from Syntha');
      
      // Update the streaming message with error
      setMessages(prev => 
        prev.map(msg => 
          msg.id === assistantMessageId 
            ? { 
                ...msg, 
                content: "I apologize, but I'm having trouble connecting to the knowledge base right now. Please try again in a moment.",
                isStreaming: false 
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputMessage]);

  const clearError = () => {
    setError(null);
  };

  const cancelRequest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 p-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">Connection Error</p>
                <p className="text-xs text-red-700">{error}</p>
              </div>
            </div>
            <button
              onClick={clearError}
              className="text-red-500 hover:text-red-700 text-sm font-medium"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6" style={{backgroundColor: '#101344'}}>
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-white mb-6">Related Products:</h2>
          {messages
            .filter((message) => message.sender === 'assistant')
            .map((message) => (
              <div
                key={message.id}
                className="flex items-start space-x-4"
              >
                <div>
                  <div>
                    <div className="text-sm leading-relaxed">
                      {message.isStreaming && !message.content ? (
                        <div className="flex items-center space-x-2">
                          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                          <span className="text-white">Searching the knowledge base...</span>
                        </div>
                      ) : (
                        <>
                          {message.content ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     
                              {(() => {
                                try {
                                  const parsedContent = JSON.parse(message.content);
                                  return parsedContent.data.map((item: any) => (
                                    <div
                                      key={item.id}
                                      className="p-6 border border-gray-200 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 bg-white"
                                    >
                                      <a href={item.link} target="_blank" rel="noopener noreferrer" className="no-underline hover:underline">
                                        <h3 className="text-xl text-blue-700 mb-3">{item.product}</h3>
                                      </a>
                                      <p className="text-gray-600 leading-relaxed">{item.description}</p>
                                    </div>
                                  ));
                                } catch (error) {
                                  console.log('error parsing response');
                                }
                              })()}
                            </div>
                          ) : (
                            <div>{message.content}</div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      
    </div>
  );
};

export default SynthaGPT;