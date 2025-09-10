import React, { useState } from 'react';
import { ArrowLeft, Loader2, AlertCircle, Copy, Check, Download, FileText, Sparkles, Target, Users, Calendar, Globe, Zap, PenTool, Mail, MessageSquare, Video, Image, Megaphone } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ContentConfiguration {
  contentType: string;
  format: string;
  topic: string;
  targetAudience: string;
  tone: string;
  length: string;
  keywords: string[];
  additionalContext: string;
}

interface SynthaResponse {
  answer: string;
  status: string;
}

const SynthaContentStudio: React.FC = () => {
  const [showForm, setShowForm] = useState(true);
  const [configuration, setConfiguration] = useState<ContentConfiguration>({
    contentType: '',
    format: '',
    topic: '',
    targetAudience: '',
    tone: '',
    length: '',
    keywords: [],
    additionalContext: ''
  });
  const [response, setResponse] = useState<SynthaResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamedText, setStreamedText] = useState('');
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

  const contentTypes = [
    { id: 'blog', name: 'Blog Content', icon: FileText, description: 'Articles, posts, and editorial content' },
    { id: 'social', name: 'Social Media', icon: MessageSquare, description: 'Posts, captions, and social content' },
    { id: 'email', name: 'Email Marketing', icon: Mail, description: 'Newsletters, campaigns, and sequences' },
    { id: 'ads', name: 'Advertising', icon: Megaphone, description: 'Ad copy, headlines, and promotional content' },
    { id: 'web', name: 'Website Copy', icon: Globe, description: 'Landing pages, product descriptions, CTAs' },
    { id: 'video', name: 'Video Content', icon: Video, description: 'Scripts, descriptions, and video marketing' },
    { id: 'creative', name: 'Creative Content', icon: PenTool, description: 'Storytelling, brand narratives, creative copy' }
  ];

  const formatsByType: Record<string, Array<{id: string, name: string, description: string}>> = {
    blog: [
      { id: 'how-to', name: 'How-To Guide', description: 'Step-by-step instructional content' },
      { id: 'listicle', name: 'Listicle', description: 'List-based articles (Top 10, Best of, etc.)' },
      { id: 'case-study', name: 'Case Study', description: 'Success stories and detailed analyses' },
      { id: 'thought-leadership', name: 'Thought Leadership', description: 'Industry insights and expert opinions' },
      { id: 'news-analysis', name: 'News Analysis', description: 'Commentary on industry trends and news' },
      { id: 'comparison', name: 'Comparison Guide', description: 'Product/service comparisons' }
    ],
    social: [
      { id: 'linkedin-post', name: 'LinkedIn Post', description: 'Professional networking content' },
      { id: 'twitter-thread', name: 'Twitter Thread', description: 'Multi-tweet storytelling' },
      { id: 'instagram-caption', name: 'Instagram Caption', description: 'Visual content descriptions' },
      { id: 'facebook-post', name: 'Facebook Post', description: 'Community engagement content' },
      { id: 'social-carousel', name: 'Social Carousel', description: 'Multi-slide social content' },
      { id: 'hashtag-strategy', name: 'Hashtag Strategy', description: 'Hashtag research and recommendations' }
    ],
    email: [
      { id: 'newsletter', name: 'Newsletter', description: 'Regular subscriber updates' },
      { id: 'welcome-series', name: 'Welcome Series', description: 'Onboarding email sequences' },
      { id: 'promotional', name: 'Promotional Email', description: 'Sales and offer announcements' },
      { id: 'nurture-sequence', name: 'Nurture Sequence', description: 'Lead nurturing campaigns' },
      { id: 'reengagement', name: 'Re-engagement', description: 'Win-back campaigns' },
      { id: 'event-invitation', name: 'Event Invitation', description: 'Event promotion and invites' }
    ],
    ads: [
      { id: 'google-ads', name: 'Google Ads', description: 'Search and display ad copy' },
      { id: 'facebook-ads', name: 'Facebook Ads', description: 'Social media advertising' },
      { id: 'linkedin-ads', name: 'LinkedIn Ads', description: 'Professional platform advertising' },
      { id: 'display-banners', name: 'Display Banners', description: 'Banner ad copy and CTAs' },
      { id: 'video-ads', name: 'Video Ad Scripts', description: 'Video advertising scripts' },
      { id: 'retargeting', name: 'Retargeting Ads', description: 'Audience retargeting campaigns' }
    ],
    web: [
      { id: 'landing-page', name: 'Landing Page', description: 'Conversion-focused page copy' },
      { id: 'product-description', name: 'Product Description', description: 'E-commerce product copy' },
      { id: 'about-page', name: 'About Page', description: 'Company story and mission' },
      { id: 'homepage', name: 'Homepage Copy', description: 'Main website messaging' },
      { id: 'cta-buttons', name: 'CTA Buttons', description: 'Call-to-action optimization' },
      { id: 'faq-section', name: 'FAQ Section', description: 'Frequently asked questions' }
    ],
    video: [
      { id: 'youtube-script', name: 'YouTube Script', description: 'Long-form video content' },
      { id: 'explainer-video', name: 'Explainer Video', description: 'Product/service explanations' },
      { id: 'testimonial-video', name: 'Testimonial Video', description: 'Customer success stories' },
      { id: 'social-video', name: 'Social Video', description: 'Short-form social content' },
      { id: 'webinar-script', name: 'Webinar Script', description: 'Educational presentation content' },
      { id: 'video-description', name: 'Video Description', description: 'YouTube/social video descriptions' }
    ],
    creative: [
      { id: 'brand-story', name: 'Brand Story', description: 'Company narrative and mission' },
      { id: 'campaign-concept', name: 'Campaign Concept', description: 'Creative campaign ideas' },
      { id: 'tagline-slogan', name: 'Tagline/Slogan', description: 'Memorable brand phrases' },
      { id: 'press-release', name: 'Press Release', description: 'News announcements' },
      { id: 'white-paper', name: 'White Paper', description: 'In-depth research content' },
      { id: 'ebook-outline', name: 'eBook Outline', description: 'Long-form content structure' }
    ]
  };

  const targetAudiences = [
    'Business Decision Makers',
    'Technical Professionals',
    'Marketing Professionals',
    'Small Business Owners',
    'Enterprise Executives',
    'Developers & Engineers',
    'Sales Teams',
    'HR Professionals',
    'Students & Educators',
    'General Consumers',
    'Industry Specialists',
    'Startup Founders'
  ];

  const tones = [
    'Professional & Authoritative',
    'Friendly & Conversational',
    'Enthusiastic & Energetic',
    'Educational & Informative',
    'Persuasive & Compelling',
    'Casual & Approachable',
    'Formal & Corporate',
    'Creative & Playful',
    'Urgent & Action-Oriented',
    'Empathetic & Understanding'
  ];

  const lengths = [
    'Short (100-300 words)',
    'Medium (300-600 words)',
    'Long (600-1000 words)',
    'Extended (1000+ words)',
    'Brief (50-100 words)',
    'Comprehensive (1500+ words)'
  ];

  const handleKeywordChange = (keyword: string) => {
    setConfiguration(prev => ({
      ...prev,
      keywords: prev.keywords.includes(keyword)
        ? prev.keywords.filter(k => k !== keyword)
        : [...prev.keywords, keyword]
    }));
  };

  const addCustomKeyword = (keyword: string) => {
    if (keyword.trim() && !configuration.keywords.includes(keyword.trim())) {
      setConfiguration(prev => ({
        ...prev,
        keywords: [...prev.keywords, keyword.trim()]
      }));
    }
  };

  const removeKeyword = (keyword: string) => {
    setConfiguration(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword)
    }));
  };

  const generateContent = async () => {
    setLoading(true);
    setError(null);
    setStreamedText('');
    setResponse(null);
    setShowForm(false);

    const selectedContentType = contentTypes.find(ct => ct.id === configuration.contentType);
    const selectedFormat = formatsByType[configuration.contentType]?.find(f => f.id === configuration.format);

    const query = `Create ${selectedFormat?.name || 'content'} for ${selectedContentType?.name || 'marketing'} with the following specifications:

CONTENT SPECIFICATIONS:
- Content Type: ${selectedContentType?.name}
- Format: ${selectedFormat?.name} - ${selectedFormat?.description}
- Topic: ${configuration.topic}
- Target Audience: ${configuration.targetAudience}
- Tone: ${configuration.tone}
- Length: ${configuration.length}
- Keywords to include: ${configuration.keywords.join(', ')}
- Additional Context: ${configuration.additionalContext || 'None provided'}

REQUIREMENTS:
1. Create compelling, high-quality content that matches the specified format and tone
2. Ensure the content is optimized for the target audience
3. Naturally incorporate the specified keywords without keyword stuffing
4. Follow best practices for ${selectedContentType?.name.toLowerCase()} content
5. Include clear calls-to-action where appropriate
6. Make the content engaging, valuable, and actionable
7. Structure the content with proper headings, bullet points, and formatting for readability
8. Ensure the content length matches the specified requirement

Please provide ready-to-use content that a marketer can immediately implement in their campaigns.`;

    try {
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
        chat_history: [],
        show: ["basic", "values", "origin"],
        features: ["semantic"],
        highlight: false,
        citations: true,
        rephrase: true,
        debug: false,
        show_hidden: false,
        autofilter: false,
        filters: [],
        rag_strategies: [{
          name: "neighbouring_paragraphs",
          before: 2,
          after: 2
        }],
        shards: [],
        max_tokens: 4000
      };

      const headers = {
        'X-NUCLIA-SERVICEACCOUNT': `Bearer ${apiKey}`,
        'x-synchronous': 'false',
        'Content-Type': 'application/json',
      };

      const apiResponse = await fetch(askUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestBody),
      });

      if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        throw new Error(`API request failed: ${apiResponse.status} ${apiResponse.statusText}. Response: ${errorText}`);
      }

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

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;

            try {
              const data = JSON.parse(trimmedLine);
              
              if (data?.item?.type === 'answer' && data.item.text !== undefined) {
                currentAnswer += data.item.text;
                setStreamedText(currentAnswer);
              }
              
              if (data?.answer && data.answer !== currentAnswer) {
                currentAnswer = data.answer;
                setStreamedText(currentAnswer);
              }
              
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

      const processedResponse: SynthaResponse = {
        answer: currentAnswer || finalData?.answer || 'No content generated',
        status: finalData?.status || finalData?.item?.status || 'success',
      };

      setResponse(processedResponse);
    } catch (err) {
      console.error('Error generating content:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate content');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!configuration.contentType || !configuration.format || !configuration.topic || 
        !configuration.targetAudience || !configuration.tone || !configuration.length) {
      setError('Please fill in all required fields');
      return;
    }
    generateContent();
  };

  const handleBack = () => {
    setShowForm(true);
    setResponse(null);
    setError(null);
    setStreamedText('');
  };

  const handleRetry = () => {
    generateContent();
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStates(prev => ({ ...prev, [id]: true }));
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [id]: false }));
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const downloadContent = () => {
    if (response) {
      const selectedContentType = contentTypes.find(ct => ct.id === configuration.contentType);
      const selectedFormat = formatsByType[configuration.contentType]?.find(f => f.id === configuration.format);
      
      const blob = new Blob([response.answer], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${selectedFormat?.name || 'content'}-${configuration.topic.replace(/\s+/g, '-').toLowerCase()}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  // Custom markdown components for better styling
  const markdownComponents = {
    h1: ({ children }: any) => (
      <h1 className="text-3xl font-bold text-gray-900 mb-6 mt-8 first:mt-0 border-b border-gray-200 pb-3">{children}</h1>
    ),
    h2: ({ children }: any) => (
      <h2 className="text-2xl font-semibold text-gray-900 mb-4 mt-8 first:mt-0">{children}</h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6 first:mt-0">{children}</h3>
    ),
    p: ({ children }: any) => (
      <p className="text-gray-700 leading-relaxed mb-4 last:mb-0">{children}</p>
    ),
    ul: ({ children }: any) => (
      <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2 pl-4">{children}</ul>
    ),
    ol: ({ children }: any) => (
      <ol className="list-decimal list-inside text-gray-700 mb-4 space-y-2 pl-4">{children}</ol>
    ),
    li: ({ children }: any) => (
      <li className="text-gray-700">{children}</li>
    ),
    strong: ({ children }: any) => (
      <strong className="font-semibold text-gray-900">{children}</strong>
    ),
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-blue-500 pl-6 py-3 mb-4 bg-blue-50 text-gray-700 italic">
        {children}
      </blockquote>
    ),
  };

  // If showing results or loading
  if (!showForm) {
    const selectedContentType = contentTypes.find(ct => ct.id === configuration.contentType);
    const selectedFormat = formatsByType[configuration.contentType]?.find(f => f.id === configuration.format);

    return (
      <div className="flex-1 bg-white overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-8">
          <div className="max-w-7xl mx-auto px-6">
            <button
              onClick={handleBack}
              className="inline-flex items-center space-x-2 text-white/80 hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Studio</span>
            </button>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
                {loading ? (
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                ) : (
                  <PenTool className="w-8 h-8 text-white" />
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold">
                  {loading ? 'Generating Content' : 'Content Generated'}
                </h1>
                <p className="text-white/90 text-lg">
                  {selectedFormat?.name} • {configuration.targetAudience} • {configuration.tone}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border-b border-red-200 p-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-800">Unable to generate content</p>
                  <p className="text-xs text-red-700">{error}</p>
                </div>
              </div>
              <button
                onClick={handleRetry}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="max-w-5xl mx-auto px-6 py-12">
          {loading ? (
            <div className="text-center py-16">
              <div className="flex flex-col items-center justify-center space-y-6 mb-12">
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                    <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center">
                    <PenTool className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Creating Your Content</h2>
                  <p className="text-lg text-gray-600 mb-4">
                    Generating {selectedFormat?.name} about "{configuration.topic}"...
                  </p>
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                    <span>Optimizing for {configuration.targetAudience}</span>
                  </div>
                </div>
              </div>

              {/* Show streaming text as it comes in */}
              {streamedText && (
                <div className="mt-8 p-8 bg-gray-50 rounded-2xl border text-left">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <Sparkles className="w-5 h-5 mr-2" />
                    Live Generation:
                  </h3>
                  <div className="prose prose-gray max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={markdownComponents}
                    >
                      {streamedText}
                    </ReactMarkdown>
                    <span className="inline-block w-2 h-5 bg-purple-500 ml-1 animate-pulse"></span>
                  </div>
                </div>
              )}
            </div>
          ) : response ? (
            <div className="space-y-8">
              {/* Configuration Summary */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Target className="w-6 h-6 mr-2 text-purple-600" />
                  Content Specifications
                </h2>
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Content Details</h3>
                    <p className="text-gray-700 text-sm">{selectedContentType?.name}</p>
                    <p className="text-gray-600 text-sm">{selectedFormat?.name}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Audience & Tone</h3>
                    <p className="text-gray-700 text-sm">{configuration.targetAudience}</p>
                    <p className="text-gray-600 text-sm">{configuration.tone}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Topic & Length</h3>
                    <p className="text-gray-700 text-sm">{configuration.topic}</p>
                    <p className="text-gray-600 text-sm">{configuration.length}</p>
                  </div>
                </div>
                {configuration.keywords.length > 0 && (
                  <div className="mt-4">
                    <h3 className="font-medium text-gray-900 mb-2">Keywords</h3>
                    <div className="flex flex-wrap gap-2">
                      {configuration.keywords.map(keyword => (
                        <span key={keyword} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Generated Content */}
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold flex items-center">
                      <FileText className="w-7 h-7 mr-3" />
                      Generated Content
                    </h2>
                    <p className="text-purple-100 text-sm mt-1">
                      {selectedFormat?.name} • Ready to use
                    </p>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => copyToClipboard(response.answer, 'main-content')}
                      className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg font-medium hover:bg-white/30 transition-colors"
                    >
                      {copiedStates['main-content'] ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={downloadContent}
                      className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg font-medium hover:bg-white/30 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
                <div className="p-8">
                  <div className="prose prose-lg max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={markdownComponents}
                    >
                      {response.answer}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>

              {/* Content Tips */}
              <div className="bg-blue-50 rounded-2xl p-8 border border-blue-200">
                <h3 className="text-xl font-semibold text-blue-900 mb-4 flex items-center">
                  <Zap className="w-6 h-6 mr-2" />
                  Content Optimization Tips
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-blue-900 mb-2">Before Publishing</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Review and customize the content for your brand voice</li>
                      <li>• Add specific company details and examples</li>
                      <li>• Optimize headlines and CTAs for your goals</li>
                      <li>• Check keyword placement and density</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-900 mb-2">Performance Tracking</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Set up analytics to track engagement</li>
                      <li>• A/B test different versions</li>
                      <li>• Monitor audience response and feedback</li>
                      <li>• Iterate based on performance data</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="text-center py-4">
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                  <div className={`w-2 h-2 rounded-full ${
                    response.status === 'success' ? 'bg-green-500' : 
                    response.status === 'fallback' ? 'bg-yellow-500' : 'bg-gray-500'
                  }`} />
                  <span>
                    Content generated by Syntha AI • Status: {response.status}
                  </span>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  // Configuration form
  return (
    <div className="flex-1 bg-white overflow-y-auto">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-purple-600 via-pink-600 to-red-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
              <PenTool className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-5xl lg:text-6xl font-bold mb-6">Syntha Content Studio</h1>
          <p className="text-xl lg:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
            Generate high-quality marketing content tailored to your audience, tone, and objectives. 
            From blog posts to social media, create compelling content that converts.
          </p>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 max-w-2xl mx-auto border border-white/20">
            <p className="text-white/90 text-sm">
              <strong>✨ AI-Powered:</strong> Content optimized for engagement, SEO, and conversion across all marketing channels.
            </p>
          </div>
        </div>
      </section>

      {/* Configuration Form */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Configure Your Content</h2>
            <p className="text-lg text-gray-600">
              Select your content type, format, and specifications to generate tailored marketing content
            </p>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Content Type Selection */}
            <div className="bg-gray-50 rounded-2xl p-8">
              <div className="flex items-center space-x-3 mb-6">
                <Sparkles className="w-6 h-6 text-purple-600" />
                <h3 className="text-xl font-semibold text-gray-900">Content Type *</h3>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {contentTypes.map(type => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setConfiguration(prev => ({ ...prev, contentType: type.id, format: '' }))}
                      className={`p-6 rounded-xl border-2 transition-all text-left ${
                        configuration.contentType === type.id
                          ? 'border-purple-500 bg-purple-50 text-purple-900'
                          : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <Icon className="w-8 h-8 mb-3 text-purple-600" />
                      <h4 className="font-semibold mb-2">{type.name}</h4>
                      <p className="text-sm text-gray-600">{type.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Format Selection */}
            {configuration.contentType && (
              <div className="bg-gray-50 rounded-2xl p-8">
                <div className="flex items-center space-x-3 mb-6">
                  <FileText className="w-6 h-6 text-blue-600" />
                  <h3 className="text-xl font-semibold text-gray-900">Content Format *</h3>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {formatsByType[configuration.contentType]?.map(format => (
                    <button
                      key={format.id}
                      type="button"
                      onClick={() => setConfiguration(prev => ({ ...prev, format: format.id }))}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        configuration.format === format.id
                          ? 'border-blue-500 bg-blue-50 text-blue-900'
                          : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <h4 className="font-semibold mb-1">{format.name}</h4>
                      <p className="text-sm text-gray-600">{format.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Topic and Basic Info */}
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gray-50 rounded-2xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Target className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Topic *</h3>
                </div>
                <input
                  type="text"
                  value={configuration.topic}
                  onChange={(e) => setConfiguration(prev => ({ ...prev, topic: e.target.value }))}
                  placeholder="e.g., AI in Healthcare, Social Media Marketing Tips, Product Launch Strategy..."
                  className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="bg-gray-50 rounded-2xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Users className="w-5 h-5 text-orange-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Target Audience *</h3>
                </div>
                <select
                  value={configuration.targetAudience}
                  onChange={(e) => setConfiguration(prev => ({ ...prev, targetAudience: e.target.value }))}
                  className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select target audience...</option>
                  {targetAudiences.map(audience => (
                    <option key={audience} value={audience}>{audience}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tone and Length */}
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gray-50 rounded-2xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <MessageSquare className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Tone *</h3>
                </div>
                <select
                  value={configuration.tone}
                  onChange={(e) => setConfiguration(prev => ({ ...prev, tone: e.target.value }))}
                  className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select tone...</option>
                  {tones.map(tone => (
                    <option key={tone} value={tone}>{tone}</option>
                  ))}
                </select>
              </div>

              <div className="bg-gray-50 rounded-2xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Calendar className="w-5 h-5 text-pink-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Length *</h3>
                </div>
                <select
                  value={configuration.length}
                  onChange={(e) => setConfiguration(prev => ({ ...prev, length: e.target.value }))}
                  className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select length...</option>
                  {lengths.map(length => (
                    <option key={length} value={length}>{length}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Keywords */}
            <div className="bg-gray-50 rounded-2xl p-8">
              <div className="flex items-center space-x-3 mb-6">
                <Zap className="w-6 h-6 text-yellow-600" />
                <h3 className="text-xl font-semibold text-gray-900">Keywords (Optional)</h3>
              </div>
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Add custom keywords..."
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomKeyword((e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.querySelector('input[placeholder="Add custom keywords..."]') as HTMLInputElement;
                      if (input) {
                        addCustomKeyword(input.value);
                        input.value = '';
                      }
                    }}
                    className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Add
                  </button>
                </div>
                {configuration.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {configuration.keywords.map(keyword => (
                      <span
                        key={keyword}
                        className="inline-flex items-center space-x-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                      >
                        <span>{keyword}</span>
                        <button
                          type="button"
                          onClick={() => removeKeyword(keyword)}
                          className="text-purple-500 hover:text-purple-700"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Additional Context */}
            <div className="bg-gray-50 rounded-2xl p-8">
              <div className="flex items-center space-x-3 mb-6">
                <FileText className="w-6 h-6 text-gray-600" />
                <h3 className="text-xl font-semibold text-gray-900">Additional Context (Optional)</h3>
              </div>
              <textarea
                value={configuration.additionalContext}
                onChange={(e) => setConfiguration(prev => ({ ...prev, additionalContext: e.target.value }))}
                placeholder="Provide any additional context, specific requirements, brand guidelines, or special instructions for the content..."
                className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                rows={4}
              />
            </div>

            {/* Submit Button */}
            <div className="text-center">
              <button
                type="submit"
                disabled={!configuration.contentType || !configuration.format || !configuration.topic || 
                         !configuration.targetAudience || !configuration.tone || !configuration.length}
                className="inline-flex items-center space-x-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-12 py-4 rounded-2xl font-semibold text-lg hover:from-purple-700 hover:to-pink-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <PenTool className="w-6 h-6" />
                <span>Generate Content</span>
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
};

export default SynthaContentStudio;