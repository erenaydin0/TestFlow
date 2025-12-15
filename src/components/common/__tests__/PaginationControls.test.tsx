import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PaginationControls from '../PaginationControls';
import { PaginationInfo } from '@/hooks/usePagination';

describe('PaginationControls', () => {
  const createPaginationInfo = (overrides: Partial<PaginationInfo> = {}): PaginationInfo => ({
    currentPage: 1,
    totalPages: 10,
    totalItems: 100,
    startIndex: 0,
    endIndex: 10,
    hasNextPage: true,
    hasPreviousPage: false,
    itemsPerPage: 10,
    ...overrides,
  });

  const defaultProps = {
    paginationInfo: createPaginationInfo(),
    onFirstPage: vi.fn(),
    onPreviousPage: vi.fn(),
    onNextPage: vi.fn(),
    onLastPage: vi.fn(),
    onPageChange: vi.fn(),
  };

  it('should render pagination controls', () => {
    render(<PaginationControls {...defaultProps} />);
    
    // Component shows max 5 visible pages, so on page 1 it shows pages 1-5
    expect(screen.getByText('1')).toBeInTheDocument();
    // Check that pagination info is displayed
    expect(screen.getByText(/100/)).toBeInTheDocument();
  });

  it('should call onPageChange when page is clicked', async () => {
    const onPageChange = vi.fn();
    const user = userEvent.setup();
    
    render(<PaginationControls {...defaultProps} onPageChange={onPageChange} />);
    
    // Page 2 should be visible when on page 1
    const page2 = screen.getByText('2');
    await user.click(page2);
    
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('should disable previous button on first page', () => {
    const paginationInfo = createPaginationInfo({
      currentPage: 1,
      hasPreviousPage: false,
    });
    
    render(<PaginationControls {...defaultProps} paginationInfo={paginationInfo} />);
    
    // Buttons use tooltip attribute, so we need to find by title
    const buttons = screen.getAllByRole('button');
    const prevButton = buttons.find(btn => btn.getAttribute('title')?.includes('Önceki'));
    expect(prevButton).toBeDefined();
    expect(prevButton).toBeDisabled();
  });

  it('should disable next button on last page', () => {
    const paginationInfo = createPaginationInfo({
      currentPage: 10,
      hasNextPage: false,
      endIndex: 100,
    });
    
    render(<PaginationControls {...defaultProps} paginationInfo={paginationInfo} />);
    
    // Buttons use tooltip attribute, so we need to find by title
    const buttons = screen.getAllByRole('button');
    const nextButton = buttons.find(btn => btn.getAttribute('title')?.includes('Sonraki'));
    expect(nextButton).toBeDefined();
    expect(nextButton).toBeDisabled();
  });

  it('should show page info', () => {
    render(<PaginationControls {...defaultProps} />);
    
    // Should show something like "1 - 10 • 100 toplam öğe"
    const info = screen.getByText(/100/);
    expect(info).toBeInTheDocument();
  });
});

