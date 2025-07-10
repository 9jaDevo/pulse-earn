import React, { useEffect } from 'react';

interface SchemaMarkupProps {
  schema: Record<string, any>;
  id?: string;
}

/**
 * SchemaMarkup Component
 * 
 * This component dynamically creates and injects JSON-LD schema markup
 * into the document head for improved SEO and rich snippets in search results.
 * 
 * @param schema - The schema.org JSON-LD object to be injected
 * @param id - Optional unique identifier for the script tag
 */
export const SchemaMarkup: React.FC<SchemaMarkupProps> = ({ schema, id }) => {
  useEffect(() => {
    if (!schema || typeof window === 'undefined') return;

    // Create a unique ID for the script tag if not provided
    const scriptId = id || `schema-${Math.random().toString(36).substring(2, 9)}`;
    
    // Check if a script with this ID already exists
    let scriptElement = document.getElementById(scriptId) as HTMLScriptElement;
    
    // If it doesn't exist, create it
    if (!scriptElement) {
      scriptElement = document.createElement('script');
      scriptElement.id = scriptId;
      scriptElement.type = 'application/ld+json';
      document.head.appendChild(scriptElement);
    }
    
    // Set or update the script content
    scriptElement.innerHTML = JSON.stringify(schema);
    
    // Cleanup function to remove the script when component unmounts
    return () => {
      const scriptToRemove = document.getElementById(scriptId);
      if (scriptToRemove) {
        document.head.removeChild(scriptToRemove);
      }
    };
  }, [schema, id]);

  // This component doesn't render anything visible
  return null;
};

export default SchemaMarkup;