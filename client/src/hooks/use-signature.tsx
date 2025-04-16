import { useState, useRef, useCallback } from 'react';
import SignatureCanvas from 'react-signature-canvas';

export function useSignature() {
  const [signatureURL, setSignatureURL] = useState<string | null>(null);
  const signatureRef = useRef<SignatureCanvas | null>(null);

  const clearSignature = useCallback(() => {
    try {
      if (signatureRef.current && typeof signatureRef.current.clear === 'function') {
        signatureRef.current.clear();
        setSignatureURL(null);
      }
    } catch (error) {
      console.error("Error clearing signature:", error);
    }
  }, []);

  const saveSignature = useCallback(() => {
    try {
      if (signatureRef.current && 
          typeof signatureRef.current.isEmpty === 'function' && 
          !signatureRef.current.isEmpty() && 
          typeof signatureRef.current.toDataURL === 'function') {
        const dataURL = signatureRef.current.toDataURL();
        setSignatureURL(dataURL);
        return dataURL;
      }
    } catch (error) {
      console.error("Error saving signature:", error);
    }
    return null;
  }, []);

  const isSignatureEmpty = useCallback(() => {
    try {
      return !signatureRef.current || 
             typeof signatureRef.current.isEmpty !== 'function' || 
             signatureRef.current.isEmpty();
    } catch (error) {
      console.error("Error checking if signature is empty:", error);
      return true;
    }
  }, []);

  return {
    signatureRef,
    signatureURL,
    clearSignature,
    saveSignature,
    isSignatureEmpty
  };
}