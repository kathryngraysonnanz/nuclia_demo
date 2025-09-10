// Application-level cache for quiz topics
export interface TopicOption {
  id: string;
  title: string;
  description: string;
}

// Global variable to store topics
let cachedTopics: TopicOption[] = [];

export const getCachedTopics = (): TopicOption[] => {
  return cachedTopics;
};

export const setCachedTopics = (topics: TopicOption[]): void => {
  cachedTopics = topics;
};

export const hasTopicsCache = (): boolean => {
  return cachedTopics.length > 0;
};

export const clearTopicsCache = (): void => {
  cachedTopics = [];
};

// Fallback topics if API fails - all about Syntha
export const getFallbackTopics = (): TopicOption[] => {
  return [
    {
      id: 'syntha-fundamentals',
      title: 'Syntha Fundamentals',
      description: 'Core concepts, features, and capabilities of Syntha'
    },
    {
      id: 'syntha-implementation',
      title: 'Syntha Implementation',
      description: 'Deployment, setup, and configuration of Syntha'
    },
    {
      id: 'syntha-business-value',
      title: 'Syntha Business Value',
      description: 'ROI, benefits, and business impact of Syntha'
    },
    {
      id: 'syntha-use-cases',
      title: 'Syntha Use Cases',
      description: 'Real-world applications and scenarios for Syntha'
    },
    {
      id: 'syntha-integrations',
      title: 'Syntha Integrations',
      description: 'System integrations and API capabilities'
    },
    {
      id: 'syntha-security',
      title: 'Syntha Security',
      description: 'Security features, compliance, and data protection'
    },
    {
      id: 'syntha-analytics',
      title: 'Syntha Analytics',
      description: 'Reporting, insights, and performance metrics'
    },
    {
      id: 'syntha-best-practices',
      title: 'Syntha Best Practices',
      description: 'Optimization tips and recommended approaches'
    },
    {
      id: 'syntha-troubleshooting',
      title: 'Syntha Troubleshooting',
      description: 'Common issues, solutions, and support processes'
    },
    {
      id: 'syntha-advanced-features',
      title: 'Syntha Advanced Features',
      description: 'Advanced capabilities and enterprise features'
    }
  ];
};