import React, { useState, useEffect } from 'react';
import { Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import { 
  RetrievalResource, 
  ResourceFilters, 
  ResourcesResponse,
  fetchResourcesFromAPI, 
  filterResources 
} from '../config/synthaResourcesConfig';
import SynthaResourcesLayout from './SynthaResourcesLayout';

const SynthaResources: React.FC<{ searchTerm: string; setSearchTerm: (term: string) => void }> = ({ searchTerm, setSearchTerm }) => {
  const [allResources, setAllResources] = useState<RetrievalResource[]>([]);
  const [filteredResources, setFilteredResources] = useState<RetrievalResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedResource, setSelectedResource] = useState<RetrievalResource | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [filters, setFilters] = useState<ResourceFilters>({
    status: 'all',
    language: 'all',
    type: 'all'
  });

  // Fetch resources from Syntha API with large page size
  const fetchResources = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response: ResourcesResponse = await fetchResourcesFromAPI(0, 500);
      setAllResources(response.resources);
    } catch (err) {
      console.error('Error fetching resources:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch resources');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  // Filter resources based on search and filters
  useEffect(() => {
    const keywords = ["CMS", "AI", "sitefinity", "testing", "test", "automate", "file transfer", "corticon", "moveit"];
    const matchedKeyword = keywords.find((keyword) => searchTerm.includes(keyword));

    const termToSearch = matchedKeyword || searchTerm;
    const filtered = filterResources(allResources, termToSearch, filters);
    setFilteredResources(filtered.slice(0, 3)); // Limit to top 3 results
  }, [allResources, searchTerm, filters]);

  const openPreview = (resource: RetrievalResource) => {
    setSelectedResource(resource);
    setShowPreview(true);
  };

  const closePreview = () => {
    setShowPreview(false);
    setSelectedResource(null);
  };

  const handleRetry = () => {
    fetchResources();
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex-1 bg-white overflow-y-auto">
        <section className="relative text-white py-20" style={{backgroundColor: '#101344'}}>
          <div className="max-w-7xl mx-auto px-6 text-center">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="text-xl font-medium">Loading Resources...</span>
            </div>
            <p className="text-white/80">Fetching resources from your knowledge base...</p>
          </div>
        </section>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex-1 bg-white overflow-y-auto">
        <section className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 text-white py-20">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <AlertTriangle className="w-8 h-8 text-red-300" />
              <span className="text-xl font-medium">Unable to Load Resources</span>
            </div>
            <p className="text-white/80 mb-6 max-w-2xl mx-auto">{error}</p>
            <button 
              onClick={handleRetry}
              className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/20 transition-all duration-200 border border-white/30"
            >
              <RefreshCw className="w-5 h-5" />
              <span>Retry Loading</span>
            </button>
          </div>
        </section>
      </div>
    );
  }

  // Main component with layout
  return (
    <div className="flex-1 bg-white overflow-y-auto">
     

      <SynthaResourcesLayout
        resources={allResources}
        filteredResources={filteredResources}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filters={filters}
        setFilters={setFilters}
        selectedResource={selectedResource}
        showPreview={showPreview}
        openPreview={openPreview}
        closePreview={closePreview}
        onRetry={handleRetry}
        totalResources={allResources.length}
      />
      
    </div>
  );
};

export default SynthaResources;