// Professional Flyer Preview Component
// Shows users a live preview of their professional flyer

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const ProfessionalFlyerPreview = ({ flyerData, isVisible, onClose }) => {
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewCss, setPreviewCss] = useState('');

  useEffect(() => {
    if (isVisible && flyerData) {
      generatePreview();
    }
  }, [isVisible, flyerData]);

  const generatePreview = async () => {
    try {
      // Call our API to generate preview
      const response = await fetch('/api/flyer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(flyerData),
      });

      const data = await response.json();

      if (data.success && data.type === 'professional-flyer') {
        setPreviewHtml(data.flyer.html);
        setPreviewCss(data.flyer.css);
      }
    } catch (error) {
      console.error('❌ Preview generation failed:', error);
    }
  };

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        style={{
          backgroundColor: '#1e293b',
          borderRadius: '16px',
          padding: '24px',
          maxWidth: '90vw',
          maxHeight: '90vh',
          overflow: 'auto',
          position: 'relative'
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          borderBottom: '2px solid #475569',
          paddingBottom: '16px'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '24px',
            fontWeight: 600,
            color: '#f8fafc'
          }}>
            🎨 Professional Flyer Preview
          </h2>
          <button
            onClick={onClose}
            style={{
              background: '#475569',
              color: '#e2e8f0',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = '#64748b'}
            onMouseLeave={(e) => e.target.style.background = '#475569'}
          >
            Close
          </button>
        </div>

        {/* Preview Content */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '20px',
          minHeight: '400px',
          position: 'relative'
        }}>
          {previewHtml ? (
            <>
              <style>{previewCss}</style>
              <div 
                dangerouslySetInnerHTML={{ __html: previewHtml }}
                style={{
                  transform: 'scale(0.8)',
                  transformOrigin: 'top left',
                  width: '125%',
                  height: '125%'
                }}
              />
            </>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '400px',
              color: '#64748b',
              fontSize: '16px'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎨</div>
                <div>Generating preview...</div>
                <div style={{ fontSize: '14px', marginTop: '8px', color: '#94a3b8' }}>
                  Creating your professional flyer preview
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '2px solid #475569',
          textAlign: 'center'
        }}>
          <p style={{
            margin: 0,
            color: '#cbd5e1',
            fontSize: '14px'
          }}>
            This is a preview of your professional flyer. Click &quot;Generate Professional Flyer&quot; to create the final version.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ProfessionalFlyerPreview;
