import React from 'react';
import { Search, Filter, FileText, Image, Video, Music, Archive, File, Users, Target, Lightbulb, AlertTriangle, Globe, Calendar, Tag, RefreshCw } from 'lucide-react';
import { 
  RetrievalResource, 
  ResourceFilters, 
  MerchandiserData,
  getMerchandiserData, 
  get15WordSummary, 
  getContentPreview, 
  getResourceTitle, 
  openResourceLink,
  renderVisualAsset,
  getResourceSlug,
  isLinkResource,
  getLinkUrl
} from '../config/synthaResourcesConfig';
import ResourcePreviewPanel from './common/ResourcePreviewPanel';

interface SynthaResourcesLayoutProps {
  resources: RetrievalResource[];
  filteredResources: RetrievalResource[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filters: ResourceFilters;
  setFilters: React.Dispatch<React.SetStateAction<ResourceFilters>>;
  selectedResource: RetrievalResource | null;
  showPreview: boolean;
  openPreview: (resource: RetrievalResource) => void;
  closePreview: () => void;
  onRetry: () => void;
  totalResources: number;
}

const SynthaResourcesLayout: React.FC<SynthaResourcesLayoutProps> = ({
  resources,
  filteredResources,
  searchTerm,
  setSearchTerm,
  filters,
  setFilters,
  selectedResource,
  showPreview,
  openPreview,
  closePreview,
  onRetry,
  totalResources
}) => {
  const getFileIcon = (icon?: string, title?: string) => {
    if (icon?.includes('pdf') || title?.toLowerCase().includes('.pdf')) return <FileText className="w-6 h-6 text-red-500" />;
    if (icon?.includes('word') || icon?.includes('document') || title?.toLowerCase().includes('.doc')) return <FileText className="w-6 h-6 text-blue-500" />;
    if (icon?.includes('excel') || icon?.includes('spreadsheet') || title?.toLowerCase().includes('.xls')) return <FileText className="w-6 h-6 text-green-500" />;
    if (icon?.includes('powerpoint') || icon?.includes('presentation') || title?.toLowerCase().includes('.ppt')) return <FileText className="w-6 h-6 text-orange-500" />;
    if (icon?.includes('image') || title?.toLowerCase().match(/\.(jpg|jpeg|png|gif|svg)$/)) return <Image className="w-6 h-6 text-purple-500" />;
    if (icon?.includes('video') || title?.toLowerCase().match(/\.(mp4|avi|mov|wmv)$/)) return <Video className="w-6 h-6 text-red-600" />;
    if (icon?.includes('audio') || title?.toLowerCase().match(/\.(mp3|wav|ogg)$/)) return <Music className="w-6 h-6 text-indigo-500" />;
    if (icon?.includes('archive') || title?.toLowerCase().match(/\.(zip|rar|7z)$/)) return <Archive className="w-6 h-6 text-gray-500" />;
    return <File className="w-6 h-6 text-gray-500" />;
  };

  const handlePreviewClick = (resource: RetrievalResource) => {
    console.log('Opening preview for resource:', resource);
    const resourceSlug = getResourceSlug(resource);
    console.log('Resource slug:', resourceSlug);
    
    // Always use the slug-based API to get the most complete data including merchandiser fields
    if (resourceSlug) {
      console.log('Using slug-based preview for:', resourceSlug);
      // We'll pass the slug to trigger the API call
      openPreview({ ...resource, slug: resourceSlug });
    } else {
      console.log('No slug available, using resource data directly');
      openPreview(resource);
    }
  };

  const renderResourceCard = (resource: RetrievalResource) => {
    const merch = getMerchandiserData(resource);
    const summary = get15WordSummary(resource);
    const title = getResourceTitle(resource, merch);
    const resourceSlug = getResourceSlug(resource); 

    console.log('Rendering card for resource:', { 
      id: resource.id, 
      slug: resourceSlug, 
      title,
      hasMerch: !!merch,
      merchData: merch,
      textKeys: resource.data?.texts ? Object.keys(resource.data.texts) : [],
      resource: resource
    });

    // Standard card for resources without merchandiser data
    return (
      <button
        key={resource.id}
        onClick={() => handlePreviewClick(resource)}
        className="group p-6 border border-gray-200 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 bg-white text-black"
      >
        <div className="flex items-start space-x-3 mb-4">
          {getFileIcon(resource.icon, title)}
          <div className="flex-1 min-w-0">
  
               <h3 className="text-xl text-blue-700 mb-3 line-clamp-2 group-hover:underline transition-colors">
              {title}
            </h3>
            {summary && (
              <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                {summary}
              </p>
            )}
          </div>
        </div>

        {/* Labels */}
        {resource.labels && resource.labels.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {resource.labels.slice(0, 3).map((label, index) => (
              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                {label}
              </span>
            ))}
            {resource.labels.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                +{resource.labels.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Metadata - Language only */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-3">
            {resource.metadata?.language && (
              <span className="px-2 py-1 bg-gray-100 rounded">
                {resource.metadata.language.toUpperCase()}
              </span>
            )}
          </div>
        </div>
      </button>
    );
  };

  const activeFilterCount = Object.values(filters).filter(value => value !== 'all').length + (searchTerm ? 1 : 0);
  const isFiltered = searchTerm || Object.values(filters).some(f => f !== 'all');

  return (
    <div className="flex-1 bg-white overflow-y-auto">

      {/* Resources Grid */}
      <section className="py-12" style={{backgroundColor: '#101344'}}>
            
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-white mb-6">Relevant Resources:</h2>
          {filteredResources.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No resources found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || activeFilterCount > 0 
                  ? 'Try adjusting your search or filters'
                  : 'No resources available in your knowledge base'
                }
              </p>
              {resources.length === 0 && (
                <button 
                  onClick={onRetry}
                  className="inline-flex items-center space-x-2 bg-white-600 text-black px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <RefreshCw className="w-5 h-5" />
                  <span>Retry Loading</span>
                </button>
              )}
            </div>
          ) : (
            <>
  

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredResources.map(renderResourceCard)}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Preview Panel - Use slug-based fetching when available */}
      <ResourcePreviewPanel
        resourceSlug={selectedResource?.slug}
        resource={selectedResource?.slug ? undefined : selectedResource}
        isOpen={showPreview}
        onClose={closePreview}
      />
    </div>
  );
};

export default SynthaResourcesLayout;