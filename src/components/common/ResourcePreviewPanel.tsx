import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Globe, Users, Target, Lightbulb, AlertTriangle, CheckCircle, Tag, Calendar, Loader2, AlertCircle, Download, FileText } from 'lucide-react';
import { 
  RetrievalResource, 
  MerchandiserData,
  getMerchandiserData, 
  get15WordSummary, 
  getContentPreview, 
  getResourceTitle, 
  openResourceLink,
  renderVisualAsset,
  fetchResourceBySlug,
  isVideoFile,
  isLinkResource,
  getLinkUrl,
  getAuthenticatedFileUrl,
  getResourceSlug
} from '../../config/synthaResourcesConfig';

interface ResourcePreviewPanelProps {
  resourceSlug?: string;
  resource?: RetrievalResource;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

const ResourcePreviewPanel: React.FC<ResourcePreviewPanelProps> = ({
  resourceSlug,
  resource: providedResource,
  isOpen,
  onClose,
  className = ''
}) => {
  const [resource, setResource] = useState<RetrievalResource | null>(providedResource || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);

  // Fetch resource by slug if slug is provided and no resource is passed
  useEffect(() => {
    if (isOpen && resourceSlug && !providedResource) {
      fetchResourceData();
    } else if (providedResource) {
      setResource(providedResource);
      setError(null);
      
      // If it's a video file, prepare the authenticated URL
      if (isVideoFile(providedResource)) {
        prepareVideoUrl(providedResource);
      }
    }
  }, [isOpen, resourceSlug, providedResource]);

  const fetchResourceData = async () => {
    if (!resourceSlug) return;

    setLoading(true);
    setError(null);

    try {
      const fetchedResource = await fetchResourceBySlug(resourceSlug);
      setResource(fetchedResource);
      
      // If it's a video file, prepare the authenticated URL
      if (isVideoFile(fetchedResource)) {
        prepareVideoUrl(fetchedResource);
      }
    } catch (err) {
      console.error('Error fetching resource:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch resource');
      setResource(null);
    } finally {
      setLoading(false);
    }
  };

  const prepareVideoUrl = async (resource: RetrievalResource) => {
    setVideoLoading(true);
    setVideoError(null);
    
    try {
      console.log('Preparing video URL for resource:', resource.id);
      
      // Use the new direct file URL approach
      const blobUrl = await getAuthenticatedFileUrl(resource);
      setVideoUrl(blobUrl);
      setVideoError(null);
    } catch (err) {
      console.error('Error preparing video URL:', err);
      setVideoError(err instanceof Error ? err.message : 'Failed to load video');
      setVideoUrl(null);
    } finally {
      setVideoLoading(false);
    }
  };

  console.log("resource:", resource)

  // Clean up blob URL when component unmounts or video changes
  useEffect(() => {
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);

  const getFileIcon = (icon?: string, title?: string) => {
    if (icon?.includes('pdf') || title?.toLowerCase().includes('.pdf')) return '📄';
    if (icon?.includes('word') || icon?.includes('document') || title?.toLowerCase().includes('.doc')) return '📝';
    if (icon?.includes('excel') || icon?.includes('spreadsheet') || title?.toLowerCase().includes('.xls')) return '📊';
    if (icon?.includes('powerpoint') || icon?.includes('presentation') || title?.toLowerCase().includes('.ppt')) return '📽️';
    if (icon?.includes('image') || title?.toLowerCase().match(/\.(jpg|jpeg|png|gif|svg)$/)) return '🖼️';
    if (icon?.includes('video') || title?.toLowerCase().match(/\.(mp4|avi|mov|wmv)$/)) return '🎥';
    if (icon?.includes('audio') || title?.toLowerCase().match(/\.(mp3|wav|ogg)$/)) return '🎵';
    if (icon?.includes('archive') || title?.toLowerCase().match(/\.(zip|rar|7z)$/)) return '📦';
    return '📄';
  };

  const handleOpenResource = async () => {
    if (!resource) return;
    
    try {
      await openResourceLink(resource, merch);
    } catch (error) {
      console.error('Error opening resource:', error);
    }
  };

  const handleOpenLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (!isOpen) return null;

  // Loading state
  if (loading) {
    return (
      <div className={`fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 ${className}`}>
        <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-12 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Resource</h3>
            <p className="text-gray-600">Fetching resource details...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 ${className}`}>
        <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between rounded-t-2xl">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-6 h-6 text-red-500" />
              <h2 className="text-xl font-bold text-gray-900">Error Loading Resource</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="p-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
            </div>
            <div className="mt-4 flex space-x-3">
              <button
                onClick={fetchResourceData}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Retry
              </button>
              <button
                onClick={onClose}
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No resource state
  if (!resource) {
    return (
      <div className={`fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 ${className}`}>
        <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between rounded-t-2xl">
            <h2 className="text-xl font-bold text-gray-900">Resource Not Found</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="p-6 text-center">
            <p className="text-gray-600">The requested resource could not be found.</p>
            <button
              onClick={onClose}
              className="mt-4 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const merch = getMerchandiserData(resource);
  const summary = get15WordSummary(resource);
  const contentPreview = getContentPreview(resource);
  const title = getResourceTitle(resource, merch);
  const isVideo = isVideoFile(resource);
  const isLink = isLinkResource(resource);
  const linkUrl = getLinkUrl(resource, merch);

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 ${className}`}>
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{getFileIcon(resource.icon, title)}</span>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{title}</h2>
              <div className="flex items-center space-x-2 mt-1">
                {merch?.confidence_level_to_share !== 'High' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Draft Content
                  </span>
                )}
                {isVideo && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    🎥 Video File
                  </span>
                )}
                {isLink && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    🔗 Link Resource
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Video Player for video files */}
          {isVideo && (
            <div className="mb-6">
              {videoLoading ? (
                <div className="bg-gray-100 rounded-lg p-8 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
                  <p className="text-gray-600">Loading video...</p>
                </div>
              ) : videoError ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <div>
                      <p className="text-red-800 font-medium">Video Loading Error</p>
                      <p className="text-red-700 text-sm">{videoError}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => prepareVideoUrl(resource)}
                    className="mt-3 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                  >
                    Retry Loading Video
                  </button>
                </div>
              ) : videoUrl ? (
                <div className="bg-gray-900 rounded-lg overflow-hidden">
                  <video
                    src={videoUrl}
                    controls
                    className="w-full max-h-96 object-contain"
                    preload="metadata"
                    onError={(e) => {
                      console.error('Video playback error:', e);
                      setVideoError('Video playback failed. The file may be corrupted or in an unsupported format.');
                    }}
                  >
                    <p className="text-white p-4">
                      Your browser does not support the video element.
                    </p>
                  </video>
                </div>
              ) : (
                <div className="bg-gray-100 rounded-lg p-8 text-center">
                  <p className="text-gray-600">Video not available</p>
                </div>
              )}
            </div>
          )}

          {/* Link Preview for link resources */}
          {isLink && linkUrl && (
            <div className="mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <Globe className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-blue-900 font-medium">External Link</p>
                    <p className="text-blue-700 text-sm truncate">{linkUrl}</p>
                  </div>
                  <button
                    onClick={() => handleOpenLink(linkUrl)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center space-x-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Open Link</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Visual Asset (for non-video files) */}
          {!isVideo && merch?.visual_asset && (
            <div className="mb-6">
              {renderVisualAsset(merch.visual_asset)}
            </div>
          )}

          {/* Merchandiser Content */}
          {merch && (
            <div className="space-y-6">
              {/* Purpose */}
              {merch.purpose && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Purpose</h3>
                  <p className="text-gray-700 leading-relaxed">{merch.purpose}</p>
                </div>
              )}

              {/* Value to Audience */}
              {merch.value_to_audience && (
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2 flex items-center">
                    <Target className="w-5 h-5 mr-2" />
                    Value to Audience
                  </h3>
                  <p className="text-blue-800 font-medium">{merch.value_to_audience}</p>
                </div>
              )}

              {/* Ideal Audience */}
              {merch.ideal_audience && merch.ideal_audience.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    Ideal Audience
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {merch.ideal_audience.map((audience, index) => (
                      <span key={index} className="px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                        {audience}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Message Points */}
              {merch.key_message_points && merch.key_message_points.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Key Message Points</h3>
                  <ul className="space-y-2">
                    {merch.key_message_points.map((point, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                        <span className="text-gray-700">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Sales Activation Tip */}
              {merch.sales_activation_tip && (
                <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                  <h3 className="text-lg font-semibold text-yellow-900 mb-2 flex items-center">
                    <Lightbulb className="w-5 h-5 mr-2" />
                    Sales Activation Tip
                  </h3>
                  <p className="text-yellow-800">{merch.sales_activation_tip}</p>
                </div>
              )}
            </div>
          )}

          {/* 15-Word Summary */}
          {summary && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Summary</h3>
              <p className="text-gray-700 bg-gray-50 rounded-lg p-3">{summary}</p>
            </div>
          )}

          {/* Content Preview (only for non-video files) */}
          {!isVideo && contentPreview && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Content Preview</h3>
              <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                  {contentPreview}
                </pre>
              </div>
            </div>
          )}

          

          {/* Labels */}
          {resource.labels && resource.labels.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <Tag className="w-5 h-5 mr-2" />
                Labels
              </h3>
              <div className="flex flex-wrap gap-2">
                {resource.labels.map((label, index) => (
                  <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                    {label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
       
      </div>
    </div>
  );
};

export default ResourcePreviewPanel;