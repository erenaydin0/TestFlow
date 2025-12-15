import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfirmDialog from '../ConfirmDialog';

// Mock useI18n
vi.mock('@/hooks/useI18n', () => ({
  useI18n: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'confirmDialog.confirm': 'confirmDialog.confirm',
        'confirmDialog.cancel': 'confirmDialog.cancel',
        'unsavedChanges.dontSave': 'unsavedChanges.dontSave',
        'unsavedChanges.save': 'unsavedChanges.save',
        'unsavedChanges.saving': 'unsavedChanges.saving',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock useModal
vi.mock('@/hooks/useModal', () => ({
  useModal: () => ({
    isVisible: true,
    getOverlayStyle: () => ({}),
    getModalStyle: () => ({}),
  }),
}));

describe('ConfirmDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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
    
    // Use getByRole to find the confirm button
    const buttons = screen.getAllByRole('button');
    // The confirm button is the last one (after cancel button)
    const confirmButton = buttons[buttons.length - 1];
    await user.click(confirmButton);
    
    expect(onConfirm).toHaveBeenCalled();
  });

  it('should call onClose when cancel button is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    
    render(<ConfirmDialog {...defaultProps} onClose={onClose} />);
    
    // Use getByRole to find the cancel button (first button)
    const buttons = screen.getAllByRole('button');
    const cancelButton = buttons[0];
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

