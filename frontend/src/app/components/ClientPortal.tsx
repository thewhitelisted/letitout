'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * ClientPortal component for rendering content in a portal
 * This ensures content is rendered at the root level of the DOM
 */
export default function ClientPortal({ children }: { children: React.ReactNode }) {
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
  
  useEffect(() => {
    // Create a div element for the portal if it doesn't exist
    let portalRoot = document.getElementById('notification-portal');
    
    if (!portalRoot) {
      portalRoot = document.createElement('div');
      portalRoot.id = 'notification-portal';
      // Ensure it's positioned at the top z-index
      portalRoot.style.position = 'fixed';
      portalRoot.style.zIndex = '9999';
      portalRoot.style.pointerEvents = 'none'; // Make it non-interactive by default
      document.body.appendChild(portalRoot);
    }
    
    setPortalContainer(portalRoot);
    
    // Clean up when component unmounts
    return () => {
      if (portalRoot && portalRoot.parentNode === document.body) {
        if (portalRoot.childNodes.length === 0) {
          document.body.removeChild(portalRoot);
        }
      }
    };
  }, []);
  
  // Don't render on the server or before the portal container is ready
  if (!portalContainer) return null;
  
  // Use createPortal to render the children into the portal container
  return createPortal(children, portalContainer);
}
