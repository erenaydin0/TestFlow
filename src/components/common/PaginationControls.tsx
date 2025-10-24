'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button, IconButton } from '@/components';
import { PaginationInfo } from '@/hooks/usePagination';

export interface PaginationControlsProps {
  paginationInfo: PaginationInfo;
  onFirstPage: () => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onLastPage: () => void;
  onPageChange: (page: number) => void;
  itemName?: string;
  className?: string;
  style?: React.CSSProperties;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
  paginationInfo,
  onFirstPage,
  onPreviousPage,
  onNextPage,
  onLastPage,
  onPageChange,
  itemName = 'öğe',
  className,
  style
}) => {
  const {
    currentPage,
    totalPages,
    totalItems,
    startIndex,
    endIndex,
    hasNextPage,
    hasPreviousPage
  } = paginationInfo;

  // Don't render if there's only one page
  if (totalPages <= 1) {
    return null;
  }

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div 
      className={className}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '1.5rem',
        padding: '0.75rem 0',
        borderTop: '1px solid var(--border-primary)',
        ...style
      }}
    >
      {/* Pagination Info */}
      <div style={{ 
        color: 'var(--text-secondary)', 
        fontSize: '0.875rem' 
      }}>
        {totalItems > 0 ? (
          <>
            <span>{startIndex + 1} - {endIndex}</span>
            <span style={{ margin: '0 0.25rem' }}>•</span>
            <span>{totalItems} toplam {itemName}</span>
          </>
        ) : (
          `${itemName} bulunamadı`
        )}
      </div>

      {/* Pagination Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <IconButton
          icon={ChevronsLeft}
          onClick={onFirstPage}
          disabled={!hasPreviousPage}
          variant="outline"
          size="sm"
          tooltip="İlk sayfa"
          style={{ width: '2rem', height: '2rem' }}
        />

        <IconButton
          icon={ChevronLeft}
          onClick={onPreviousPage}
          disabled={!hasPreviousPage}
          variant="outline"
          size="sm"
          tooltip="Önceki sayfa"
          style={{ width: '2rem', height: '2rem' }}
        />

        {/* Page Numbers */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          {pageNumbers.map(pageNum => (
            <Button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              variant={pageNum === currentPage ? 'primary' : 'outline'}
              size="sm"
              style={{ 
                width: '2rem', 
                height: '2rem',
                minWidth: '2rem',
                padding: '0'
              }}
            >
              {pageNum}
            </Button>
          ))}
        </div>

        <IconButton
          icon={ChevronRight}
          onClick={onNextPage}
          disabled={!hasNextPage}
          variant="outline"
          size="sm"
          tooltip="Sonraki sayfa"
          style={{ width: '2rem', height: '2rem' }}
        />

        <IconButton
          icon={ChevronsRight}
          onClick={onLastPage}
          disabled={!hasNextPage}
          variant="outline"
          size="sm"
          tooltip="Son sayfa"
          style={{ width: '2rem', height: '2rem' }}
        />
      </div>
    </div>
  );
};

export default PaginationControls;
