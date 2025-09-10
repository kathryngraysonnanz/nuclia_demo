export interface RetrievalResource {
  id: string;
  slug?: string;
  title: string;
  summary?: string;
  icon?: string;
  thumbnail?: string;
  metadata?: {
    language?: string;
    status?: string;
    created?: string;
    modified?: string;
    [key: string]: any;
  };
  data?: {
    texts?: Record<string, {
      value: {
        body: string;
        [key: string]: any;
      };
      [key: string]: any;
    }>;
    files?: Record<string, {
      value: {
        file: {
          uri: string;
          content_type: string;
          filename?: string;
          [key: string]: any;
        };
        file_preview?: {
          uri: string;
          [key: string]: any;
        };
        [key: string]: any;
      };
      [key: string]: any;
    }>;
  };
  generics?: {
    title?: {
      value: string;
    };
    link?: {
      value: string;
    };
    [key: string]: any;
  };
  origin?: {
    url?: string;
    [key: string]: any;
  };
  labels?: string[];
}

export interface MerchandiserData {
  title?: string;
  purpose?: string;
  ideal_audience?: string[];
  value_to_audience?: string;
  sales_activation_tip?: string;
  key_message_points?: string[];
  confidence_level_to_share?: string;
  link?: string;
  visual_asset?: string;
  [key: string]: any;
}

export interface ResourceFilters {
  status: string;
  language: string;
  type: string;
}

export interface ResourcesResponse {
  resources: RetrievalResource[];
}

// API Configuration
export const getSynthaApiConfig = () => {
  const apiUrl = import.meta.env.VITE_SYNTHA_API_URL;
  const kbId = import.meta.env.VITE_SYNTHA_KB_ID;
  const apiKey = import.meta.env.VITE_SYNTHA_API_KEY;

  if (!apiUrl || !kbId || !apiKey) {
    throw new Error('Syntha API configuration missing. Please check your environment variables.');
  }

  return {
    apiUrl,
    kbId,
    apiKey,
    knowledgeBoxUrl: `${apiUrl}/kb/${kbId}`,
    resourcesUrl: `${apiUrl}/kb/${kbId}/resources`,
    headers: {
      'X-NUCLIA-SERVICEACCOUNT': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    }
  };
};

// API Functions - Simplified without pagination
export const fetchResourcesFromAPI = async (page: number = 0, size: number = 500): Promise<ResourcesResponse> => {
  const config = getSynthaApiConfig();

  // Add pagination parameters
  const queryParams = new URLSearchParams({
    page: page.toString(),
    size: size.toString()
  });

  const resourcesUrl = `${config.resourcesUrl}?${queryParams.toString()}`;
  console.log('Fetching resources from:', resourcesUrl);

  const apiResponse = await fetch(resourcesUrl, {
    method: 'GET',
    headers: config.headers,
  });

  if (!apiResponse.ok) {
    const errorText = await apiResponse.text();
    throw new Error(`API request failed: ${apiResponse.status} ${apiResponse.statusText}. Response: ${errorText}`);
  }

  const responseData = await apiResponse.json();
  console.log('Resources API response:', responseData);

  // Extract resources from the response
  let allResources: RetrievalResource[] = [];
  
  if (responseData.resources) {
    // If resources are in a resources property
    allResources = Object.values(responseData.resources) as RetrievalResource[];
  } else if (Array.isArray(responseData)) {
    // If response is directly an array
    allResources = responseData;
  } else if (responseData.items) {
    // If resources are in an items property
    allResources = responseData.items;
  } else {
    // Try to extract from any object structure
    const possibleResources = Object.values(responseData).find(value => 
      Array.isArray(value) || (typeof value === 'object' && value !== null)
    );
    
    if (Array.isArray(possibleResources)) {
      allResources = possibleResources;
    } else if (typeof possibleResources === 'object') {
      allResources = Object.values(possibleResources) as RetrievalResource[];
    }
  }

  console.log('Extracted resources:', allResources);

  // Filter out resources that don't have basic required fields
  const validResources = allResources.filter(resource => 
    resource && (resource.id || resource.title || resource.generics?.title?.value)
  );

  console.log('Valid resources after filtering:', validResources);

  if (validResources.length === 0) {
    console.warn('No valid resources found in the response');
    throw new Error('No resources found in the knowledge base. The knowledge base may be empty or the resources may not be properly indexed.');
  }

  return {
    resources: validResources
  };
};

// Fetch resource by slug - Fixed query parameters
export const fetchResourceBySlug = async (resourceSlug: string): Promise<RetrievalResource> => {
  const config = getSynthaApiConfig();
  
  // Use the correct slug endpoint: GET /kb/{kbid}/slug/{rslug}
  const resourceUrl = `${config.knowledgeBoxUrl}/slug/${resourceSlug}`;

  console.log('Fetching resource by slug from:', resourceUrl);

  // Build query parameters correctly - each array value needs its own parameter
  const queryParams = new URLSearchParams();
  
  // Add show parameters
  ['basic', 'origin', 'extra', 'values', 'extracted'].forEach(show => {
    queryParams.append('show', show);
  });
  
  // Add field_type parameters
  ['text', 'file', 'link', 'conversation', 'generic'].forEach(fieldType => {
    queryParams.append('field_type', fieldType);
  });
  
  // Add extracted parameters
  ['text', 'metadata', 'link', 'file'].forEach(extracted => {
    queryParams.append('extracted', extracted);
  });

  const fullUrl = `${resourceUrl}?${queryParams.toString()}`;
  console.log('Full URL with params:', fullUrl);

  const apiResponse = await fetch(fullUrl, {
    method: 'GET',
    headers: config.headers,
  });

  if (!apiResponse.ok) {
    const errorText = await apiResponse.text();
    if (apiResponse.status === 404) {
      throw new Error(`Resource with slug "${resourceSlug}" not found`);
    } else if (apiResponse.status === 403) {
      throw new Error('Access denied. Please check your API permissions.');
    } else {
      throw new Error(`Failed to fetch resource: ${apiResponse.status} ${apiResponse.statusText}. Response: ${errorText}`);
    }
  }

  const resource = await apiResponse.json();
  console.log('Resource by slug response:', resource);

  if (!resource || (!resource.id && !resource.title && !resource.generics?.title?.value)) {
    throw new Error('Invalid resource data received from API');
  }

  return resource as RetrievalResource;
};

// NEW APPROACH: Direct file download using browser navigation
const triggerBrowserDownload = (resourceSlug: string, fieldId: string, filename: string) => {
  const config = getSynthaApiConfig();
  
  // Create the download URL with proper authentication in the URL
  const downloadUrl = `${config.knowledgeBoxUrl}/slug/${resourceSlug}/file/${fieldId}/download/field?inline=false`;
  
  console.log('Triggering browser download from:', downloadUrl);
  
  // Create a temporary form to submit with authentication headers
  // Since we can't set custom headers on direct navigation, we'll use a different approach
  
  // Method 1: Try using window.location with authentication
  const authenticatedUrl = `${downloadUrl}&auth=${encodeURIComponent(config.apiKey)}`;
  
  // Create a hidden iframe to trigger the download
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = authenticatedUrl;
  
  document.body.appendChild(iframe);
  
  // Clean up after a delay
  setTimeout(() => {
    document.body.removeChild(iframe);
  }, 5000);
  
  console.log('Browser download triggered');
};

// NEW APPROACH: Use the file URI directly with authentication
const downloadFileDirectly = async (resource: RetrievalResource) => {
  try {
    const config = getSynthaApiConfig();
    
    // Get the file info from the resource
    const fileInfo = resource.data?.files?.[resource.id]?.value?.file;
    if (!fileInfo) {
      throw new Error('No file information found in resource');
    }
    
    console.log('File info:', fileInfo);
    
    // The URI should be something like /kb/{kbid}/resource/{rid}/file/{field}/download
    // We need to construct the full URL with our API base
    let fileUrl = fileInfo.uri;
    
    // If the URI is relative, make it absolute
    if (fileUrl.startsWith('/')) {
      fileUrl = `${config.apiUrl}${fileUrl}`;
    }
    
    // Add inline=false parameter for download
    const separator = fileUrl.includes('?') ? '&' : '?';
    const downloadUrl = `${fileUrl}${separator}inline=false`;
    
    console.log('Direct download URL:', downloadUrl);
    
    // Fetch the file with authentication
    const response = await fetch(downloadUrl, {
      method: 'GET',
      headers: {
        'X-NUCLIA-SERVICEACCOUNT': `Bearer ${config.apiKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Download failed: ${response.status} ${response.statusText}. ${errorText}`);
    }

    // Get the blob and create download
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    
    // Create and trigger download
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileInfo.filename || 'download';
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 1000);
    
    console.log('Direct file download completed');
  } catch (error) {
    console.error('Error in direct download:', error);
    throw error;
  }
};

// NEW APPROACH: Get authenticated file URL for streaming (videos/images)
export const getAuthenticatedFileUrl = async (resource: RetrievalResource): Promise<string> => {
  try {
    const config = getSynthaApiConfig();
    
    // Get the file info from the resource
    const fileInfo = resource.data?.files?.[resource.id]?.value?.file;
    if (!fileInfo) {
      throw new Error('No file information found in resource');
    }
    
    console.log('Getting authenticated URL for file:', fileInfo);
    
    // The URI should be something like /kb/{kbid}/resource/{rid}/file/{field}/download
    let fileUrl = fileInfo.uri;
    
    // If the URI is relative, make it absolute
    if (fileUrl.startsWith('/')) {
      fileUrl = `${config.apiUrl}${fileUrl}`;
    }
    
    // Add inline=true parameter for streaming/viewing
    const separator = fileUrl.includes('?') ? '&' : '?';
    const streamUrl = `${fileUrl}${separator}inline=true`;
    
    console.log('Stream URL:', streamUrl);
    
    // Fetch the file with authentication
    const response = await fetch(streamUrl, {
      method: 'GET',
      headers: {
        'X-NUCLIA-SERVICEACCOUNT': `Bearer ${config.apiKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to load file: ${response.status} ${response.statusText}. ${errorText}`);
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    
    console.log('Authenticated file URL created:', blobUrl);
    return blobUrl;
  } catch (error) {
    console.error('Error getting authenticated file URL:', error);
    throw error;
  }
};

// Check if resource is a video file
export const isVideoFile = (resource: RetrievalResource): boolean => {
  const hasFile = resource.data?.files && resource.data.files[resource.id];
  
  if (!hasFile) {
    return false;
  }

  const fileInfo = resource.data!.files![resource.id].value.file;
  return fileInfo.content_type?.startsWith('video/') || false;
};

// Check if resource is a link
export const isLinkResource = (resource: RetrievalResource): boolean => {
  return !!(resource.generics?.link?.value || resource.origin?.url);
};

// Get link URL from resource
export const getLinkUrl = (resource: RetrievalResource, merch?: MerchandiserData): string | null => {
  // Check merchandiser link first
  if (merch?.link) {
    return merch.link.replace(/\{[^}]+\}/g, resource.id);
  }
  
  // Check generic link field
  if (resource.generics?.link?.value) {
    return resource.generics.link.value;
  }
  
  // Check origin URL
  if (resource.origin?.url) {
    return resource.origin.url;
  }
  
  // Check for links in text metadata
  if (resource.data?.texts) {
    for (const textKey of Object.keys(resource.data.texts)) {
      const textData = resource.data.texts[textKey];
      if (textData?.extracted?.metadata?.links && textData.extracted.metadata.links.length > 0) {
        return textData.extracted.metadata.links[0];
      }
    }
  }
  
  return null;
};

// Enhanced resource link/file handling with proper download behavior
export const openResourceLink = async (resource: RetrievalResource, merch?: MerchandiserData): Promise<void> => {
  console.log('Opening resource:', resource);
  
  try {
    // First check if it's a video file - these should not be opened externally
    if (isVideoFile(resource)) {
      console.log('Video file detected - should be handled in preview panel');
      return;
    }
    
    // Check if it's a link resource
    const linkUrl = getLinkUrl(resource, merch);
    if (linkUrl) {
      console.log('Opening link in new tab:', linkUrl);
      window.open(linkUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    
    // Check if it's a file resource
    const hasFile = resource.data?.files && resource.data.files[resource.id];
    if (hasFile) {
      // Handle file resource using direct download
      const fileInfo = resource.data!.files![resource.id].value.file;
      console.log('File info:', fileInfo);
      
      // Handle different file types with proper download behavior
      if (fileInfo.content_type === 'application/pdf') {
        // For PDFs, trigger direct download
        console.log('Triggering PDF download');
        await downloadFileDirectly(resource);
      } else if (fileInfo.content_type?.includes('application/vnd.openxmlformats-officedocument') || 
                 fileInfo.content_type?.includes('application/msword') ||
                 fileInfo.content_type?.includes('application/vnd.ms-')) {
        // For Office documents, trigger direct download
        console.log('Triggering Office document download');
        await downloadFileDirectly(resource);
      } else if (fileInfo.content_type?.includes('image/')) {
        // For images, get authenticated URL and open in new tab
        console.log('Opening image in new tab');
        const imageUrl = await getAuthenticatedFileUrl(resource);
        window.open(imageUrl, '_blank', 'noopener,noreferrer');
        
        // Clean up after a delay
        setTimeout(() => {
          URL.revokeObjectURL(imageUrl);
        }, 5000);
      } else {
        // For all other files, trigger direct download
        console.log('Triggering generic file download');
        await downloadFileDirectly(resource);
      }
      
      return;
    }
    
    // No valid resource found
    console.warn('No valid file or link found for resource:', resource.id);
    alert('This resource cannot be opened. No valid file or link was found.');
    
  } catch (error) {
    console.error('Error opening resource:', error);
    alert(`Failed to open resource: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Get resource slug from resource object
export const getResourceSlug = (resource: RetrievalResource): string | null => {
  // Try to get slug from the resource object
  if (resource.slug) {
    return resource.slug;
  }
  
  // If no slug property, use ID as fallback since the slug API can accept resource IDs
  if (resource.id) {
    return resource.id;
  }
  
  return null;
};

// Helper Functions
export const getMerchandiserData = (resource: RetrievalResource): MerchandiserData | null => {
  if (!resource.data?.texts) {
    console.log('No texts data available for resource:', resource.id);
    return null;
  }

  // Debug: Log all available text keys
  const textKeys = Object.keys(resource.data.texts);
  console.log('Available text keys for resource', resource.id, ':', textKeys);

  // Look for merchandiser block with pattern matching - works for all resource types
  const merchKey = textKeys.find(key => 
    key.startsWith('da-ResourceMerchandiser-')
  );

  console.log('Found merchandiser key:', merchKey);

  if (!merchKey) {
    console.log('No merchandiser key found for resource:', resource.id);
    return null;
  }

  try {
    const merchRaw = resource.data.texts[merchKey]?.value?.body;
    if (!merchRaw) {
      console.log('No merchandiser body found for key:', merchKey);
      return null;
    }

    console.log('Raw merchandiser data for', resource.id, ':', merchRaw);
    const parsedMerch = JSON.parse(merchRaw) as MerchandiserData;
    console.log('Parsed merchandiser data for', resource.id, ':', parsedMerch);
    
    return parsedMerch;
  } catch (error) {
    console.error('Error parsing merchandiser data for', resource.id, ':', error);
    return null;
  }
};

export const get15WordSummary = (resource: RetrievalResource): string | null => {
  if (!resource.data?.texts) return null;

  const summaryKey = Object.keys(resource.data.texts).find(key => 
    key.includes('da-15WordSummary-')
  );

  if (!summaryKey) return null;

  return resource.data.texts[summaryKey]?.value?.body || null;
};

export const getContentPreview = (resource: RetrievalResource): string | null => {
  if (!resource.data?.texts) return null;

  // Find the main content (excluding merchandiser and summary)
  const contentKey = Object.keys(resource.data.texts).find(key => 
    !key.includes('da-ResourceMerchandiser-') && 
    !key.includes('da-15WordSummary-')
  );

  if (!contentKey) return null;

  const content = resource.data.texts[contentKey]?.value?.body;
  return content ? content.substring(0, 500) + (content.length > 500 ? '...' : '') : null;
};

export const getResourceTitle = (resource: RetrievalResource, merch?: MerchandiserData): string => {
  return merch?.title || resource.title || resource.generics?.title?.value || 'Untitled Document';
};

// Filter Functions
export const filterResources = (
  resources: RetrievalResource[], 
  searchTerm: string, 
  filters: ResourceFilters
): RetrievalResource[] => {
  let filtered = resources;

  // Apply search filter
  if (searchTerm) {
    filtered = filtered.filter(resource => {
      const title = getResourceTitle(resource);
      const summary = get15WordSummary(resource) || '';
      const labels = resource.labels?.join(' ') || '';
      
      return (
        title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
        labels.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }

  // Apply status filter
  if (filters.status !== 'all') {
    filtered = filtered.filter(resource => resource.metadata?.status === filters.status);
  }

  // Apply language filter
  if (filters.language !== 'all') {
    filtered = filtered.filter(resource => resource.metadata?.language === filters.language);
  }

  // Apply type filter
  if (filters.type !== 'all') {
    filtered = filtered.filter(resource => {
      const icon = resource.icon || '';
      const title = getResourceTitle(resource);
      return icon.includes(filters.type) || title.toLowerCase().includes(filters.type);
    });
  }

  return filtered;
};

// Visual Asset Renderer
export const renderVisualAsset = (visualAsset: string): JSX.Element => {
  try {
    const url = new URL(visualAsset);
    const pathname = url.pathname.toLowerCase();
    
    if (pathname.match(/\.(jpg|jpeg|png|gif|svg|webp)$/)) {
      return (
        <img 
          src={visualAsset} 
          alt="Visual asset" 
          className="w-full h-48 object-cover rounded-lg"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      );
    } else {
      return (
        <iframe 
          src={visualAsset} 
          className="w-full h-48 rounded-lg border"
          title="Visual asset"
        />
      );
    }
  } catch {
    return (
      <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
        <span className="text-gray-500">Invalid visual asset URL</span>
      </div>
    );
  }
};