import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';

const ConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false
}) => {
  // Use a ref to track if the confirm action has been triggered
  const hasConfirmedRef = useRef(false);
  // Create a ref for the cancel button to focus it by default
  const cancelButtonRef = useRef(null);
  const [isVisible, setIsVisible] = useState(isOpen);

  // Reset the confirmed state when the dialog opens
  useEffect(() => {
    console.log('ConfirmationDialog: isOpen changed to', isOpen);
    if (isOpen) {
      hasConfirmedRef.current = false;
      setIsVisible(true);
      console.log('ConfirmationDialog: Dialog is now visible');
    } else {
      // When dialog is closed externally, update our local state
      setIsVisible(false);
      console.log('ConfirmationDialog: Dialog is now hidden');
    }
  }, [isOpen]);

  // Log when isVisible changes
  useEffect(() => {
    console.log('ConfirmationDialog: isVisible changed to', isVisible);
  }, [isVisible]);

  // Focus the cancel button when the dialog opens
  useEffect(() => {
    if (isVisible && cancelButtonRef.current) {
      console.log('ConfirmationDialog: Focusing cancel button');
      setTimeout(() => {
        cancelButtonRef.current.focus();
      }, 100);
    }
  }, [isVisible]);

  // If the dialog is not open, don't render anything
  if (!isVisible) {
    console.log('ConfirmationDialog: Not rendering dialog because isVisible is false');
    return null;
  }

  console.log('ConfirmationDialog: Rendering dialog with title:', title);

  const handleConfirm = () => {
    // Only proceed if we haven't already confirmed
    if (hasConfirmedRef.current) return;

    // Mark as confirmed immediately to prevent double-triggering
    hasConfirmedRef.current = true;

    // Hide the dialog immediately
    setIsVisible(false);

    // Call onConfirm after a short delay to ensure UI updates first
    setTimeout(() => {
      if (onConfirm) onConfirm();
    }, 50);
  };

  const handleCancel = () => {
    // Hide the dialog immediately
    setIsVisible(false);

    // Call onClose after a short delay
    setTimeout(() => {
      if (onClose) onClose();
    }, 50);
  };

  return (
    <DialogOverlay onClick={handleCancel}>
      <DialogContent onClick={e => e.stopPropagation()}>
        <DialogTitle>{title}</DialogTitle>
        <DialogMessage>{message}</DialogMessage>
        <DialogActions>
          <ConfirmButton
            onClick={handleConfirm}
            $isDestructive={isDestructive}
            disabled={hasConfirmedRef.current}
          >
            {confirmText}
          </ConfirmButton>
          <CancelButton
            onClick={handleCancel}
            ref={cancelButtonRef}
            autoFocus
          >
            {cancelText}
          </CancelButton>
        </DialogActions>
      </DialogContent>
    </DialogOverlay>
  );
};

const DialogOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const DialogContent = styled.div`
  background-color: ${props => props.theme['--card-bg'] || '#fff'};
  border-radius: 8px;
  padding: 1.5rem;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
`;

const DialogTitle = styled.h3`
  margin: 0 0 1rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: ${props => props.theme['--text-color'] || '#333'};
`;

const DialogMessage = styled.p`
  margin: 0 0 1.5rem;
  font-size: 1rem;
  line-height: 1.5;
  color: ${props => props.theme['--text-color'] || '#333'};
`;

const DialogActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
`;

const Button = styled.button`
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
`;

const CancelButton = styled(Button)`
  background-color: #2196f3;
  border: none;
  color: white;
  font-weight: 600;

  &:focus {
    outline: 2px solid #64b5f6;
    outline-offset: 2px;
  }

  &:hover {
    background-color: #1976d2;
  }
`;

const ConfirmButton = styled(Button)`
  background-color: ${props => props.$isDestructive ? 'transparent' : 'transparent'};
  border: 1px solid ${props => props.$isDestructive ? '#e53935' : '#ddd'};
  color: ${props => props.$isDestructive ? '#e53935' : props.theme['--text-color'] || '#333'};

  &:hover {
    background-color: ${props => props.$isDestructive ? 'rgba(229, 57, 53, 0.1)' : '#f5f5f5'};
  }
`;

export default ConfirmationDialog;
