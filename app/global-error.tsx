'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Optionally log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <html lang="en">
      <body className="antialiased">
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0a0a',
          color: '#ffffff',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: '24px'
        }}>
          <div style={{ maxWidth: '400px', textAlign: 'center' }}>
            <div style={{ 
              width: '80px', 
              height: '80px', 
              borderRadius: '50%', 
              backgroundColor: 'rgba(239, 68, 68, 0.1)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 24px auto'
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            
            <h1 style={{ fontSize: '24px', fontWeight: '900', marginBottom: '8px', letterSpacing: '-0.025em' }}>
              Critical Application Error
            </h1>
            <p style={{ color: '#a3a3a3', marginBottom: '32px', lineHeight: '1.5' }}>
              A critical error occurred while loading the application shell. Please try reloading the page.
            </p>

            <button 
              onClick={() => reset()} 
              style={{
                backgroundColor: '#ffffff',
                color: '#000000',
                border: 'none',
                borderRadius: '9999px',
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'opacity 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
              onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
