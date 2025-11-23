import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PaginationControls from '../PaginationControls';

describe('PaginationControls', () => {
  const defaultProps = {
    currentPage: 1,
    totalPages: 10,
    onPageChange: vi.fn(),
    totalItems: 100,
    itemsPerPage: 10,
  };

  it('should render pagination controls', () => {
    render(<PaginationControls {...defaultProps} />);
    
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('should call onPageChange when page is clicked', async () => {
    const onPageChange = vi.fn();
    const user = userEvent.setup();
    
    render(<PaginationControls {...defaultProps} onPageChange={onPageChange} />);
    
    const page2 = screen.getByText('2');
    await user.click(page2);
    
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('should disable previous button on first page', () => {
    render(<PaginationControls {...defaultProps} currentPage={1} />);
    
    const prevButton = screen.getByLabelText(/previous/i) || screen.getByText(/previous/i);
    expect(prevButton).toBeDisabled();
  });

  it('should disable next button on last page', () => {
    render(<PaginationControls {...defaultProps} currentPage={10} />);
    
    const nextButton = screen.getByLabelText(/next/i) || screen.getByText(/next/i);
    expect(nextButton).toBeDisabled();
  });

  it('should show page info', () => {
    render(<PaginationControls {...defaultProps} />);
    
    // Should show something like "1-10 of 100"
    const info = screen.getByText(/100/);
    expect(info).toBeInTheDocument();
  });
});

