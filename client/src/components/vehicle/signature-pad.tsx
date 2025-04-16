import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import SignatureCanvas from "react-signature-canvas";

interface SignaturePadProps {
  existingSignature?: string;
  onChange: (signatureData: string) => void;
  disabled?: boolean;
}

// Use any for the ref until we resolve the type issues
export const SignaturePad = forwardRef<any, SignaturePadProps>(
  ({ existingSignature, onChange, disabled = false }, ref) => {
    const [signatureRef, setSignatureRef] = useState<SignatureCanvas | null>(null);
    const [isEmpty, setIsEmpty] = useState(true);
    
    // Forward the signature canvas ref - safely allowing null
    useImperativeHandle(ref, () => signatureRef);
    
    // Initialize the signature pad
    const handleSignatureRef = (ref: SignatureCanvas | null) => {
      if (ref) {
        setSignatureRef(ref);
        
        // Set up the signature pad properties
        try {
          ref.on();
        } catch (err) {
          console.error('Error initializing signature pad:', err);
        }
      }
    };
    
    // Handle when the signature changes
    const handleSignatureChange = () => {
      try {
        if (signatureRef && typeof signatureRef.isEmpty === 'function') {
          const empty = signatureRef.isEmpty();
          setIsEmpty(empty);
          if (!empty && typeof signatureRef.toDataURL === 'function') {
            const signatureData = signatureRef.toDataURL();
            onChange(signatureData);
          }
        }
      } catch (error) {
        console.error('Error in signature pad:', error);
      }
    };
    
    // Load existing signature if provided - disabled for now to prevent errors
    useEffect(() => {
      if (!existingSignature || !signatureRef || disabled) {
        return;
      }
      
      // Set isEmpty to false if we have an existing signature, 
      // but don't try to load it onto the canvas which can cause errors
      if (existingSignature) {
        setIsEmpty(false);
      }
    }, [existingSignature, signatureRef, disabled]);
    
    return (
      <div className="signature-pad-container">
        <div 
          className={`signature-pad border ${isEmpty ? 'border-neutral-300' : 'border-neutral-400'} 
            rounded-md w-full h-[150px] ${disabled ? 'bg-neutral-100' : 'bg-white'}`}
        >
          {disabled ? (
            // If disabled, just show the existing signature as an image
            existingSignature ? (
              <img 
                src={existingSignature} 
                alt="Customer signature" 
                className="w-full h-full object-contain p-2"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-neutral-400">
                No signature provided
              </div>
            )
          ) : (
            // Otherwise, show the interactive signature pad
            <SignatureCanvas
              ref={handleSignatureRef}
              onEnd={handleSignatureChange}
              canvasProps={{
                className: "signature-canvas",
                width: "100%",
                height: 150,
                style: { width: '100%', height: '100%' }
              }}
              backgroundColor="transparent"
            />
          )}
        </div>
        {isEmpty && !disabled && (
          <p className="text-xs text-neutral-500 mt-1">
            Click and drag to sign
          </p>
        )}
      </div>
    );
  }
);

SignaturePad.displayName = "SignaturePad";