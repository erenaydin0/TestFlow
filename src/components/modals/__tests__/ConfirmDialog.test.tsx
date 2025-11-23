import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfirmDialog from '../ConfirmDialog';

describe('ConfirmDialog', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?',
  };

  it('should render when open', () => {
    render(<ConfirmDialog {...defaultProps} />);
    
    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(<ConfirmDialog {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByText('Confirm Action')).not.toBeInTheDocument();
  });

  it('should call onConfirm when confirm button is clicked', async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();
    
    render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);
    
    const confirmButton = screen.getByText(/confirm|yes|ok/i);
    await user.click(confirmButton);
    
    expect(onConfirm).toHaveBeenCalled();
  });

  it('should call onClose when cancel button is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    
    render(<ConfirmDialog {...defaultProps} onClose={onClose} />);
    
    const cancelButton = screen.getByText(/cancel|no/i);
    await user.click(cancelButton);
    
    expect(onClose).toHaveBeenCalled();
  });

  it('should render custom confirm button text', () => {
    render(<ConfirmDialog {...defaultProps} confirmText="Delete" />);
    
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('should render custom cancel button text', () => {
    render(<ConfirmDialog {...defaultProps} cancelText="Abort" />);
    
    expect(screen.getByText('Abort')).toBeInTheDocument();
  });
});

