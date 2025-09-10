export interface SynthaQuery {
  id: string;
  title: string;
  query: string;
  description: string;
}

export const homepageQueries: SynthaQuery[] = [
  {
    id: 'what-is-syntha',
    title: 'What is Syntha?',
    query: 'Write a paragraph describing Progress Software in under 50 words',
    description: 'Learn about Syntha\'s core capabilities and features'
  }
];

export const getQueryById = (id: string): SynthaQuery | undefined => {
  return homepageQueries.find(query => query.id === id);
};

export const getDefaultQuery = (): SynthaQuery => {
  return homepageQueries[0]; // Returns "What is Syntha?" by default
};