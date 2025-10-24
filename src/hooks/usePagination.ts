'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';

export interface UsePaginationOptions {
  itemsPerPage?: number;
  totalItems: number;
  data: any[];
  onPageChange?: (page: number) => void;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  itemsPerPage: number;
}

export interface UsePaginationReturn {
  // State
  currentPage: number;
  setCurrentPage: (page: number) => void;
  
  // Computed values
  totalPages: number;
  startIndex: number;
  endIndex: number;
  currentPageItems: any[];
  paginationInfo: PaginationInfo;
  
  // Navigation functions
  goToPage: (page: number) => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
  goToPreviousPage: () => void;
  goToNextPage: () => void;
  
  // Utility functions
  resetToFirstPage: () => void;
}

const usePagination = ({
  itemsPerPage = 10,
  totalItems,
  data,
  onPageChange
}: UsePaginationOptions): UsePaginationReturn => {
  const [currentPage, setCurrentPage] = useState(1);

  // Calculate pagination values
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  
  // Get current page items
  const currentPageItems = useMemo(() => {
    return data.slice(startIndex, endIndex);
  }, [data, startIndex, endIndex]);

  // Pagination info object
  const paginationInfo = useMemo((): PaginationInfo => ({
    currentPage,
    totalPages,
    totalItems,
    startIndex,
    endIndex,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
    itemsPerPage
  }), [currentPage, totalPages, totalItems, startIndex, endIndex, itemsPerPage]);

  // Navigation functions
  const goToPage = useCallback((page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    if (validPage !== currentPage) {
      setCurrentPage(validPage);
      onPageChange?.(validPage);
    }
  }, [currentPage, totalPages, onPageChange]);

  const goToFirstPage = useCallback(() => {
    goToPage(1);
  }, [goToPage]);

  const goToLastPage = useCallback(() => {
    goToPage(totalPages);
  }, [goToPage, totalPages]);

  const goToPreviousPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [goToPage, currentPage]);

  const goToNextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [goToPage, currentPage]);

  const resetToFirstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  // Reset to first page when totalItems changes significantly
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  return {
    // State
    currentPage,
    setCurrentPage,
    
    // Computed values
    totalPages,
    startIndex,
    endIndex,
    currentPageItems,
    paginationInfo,
    
    // Navigation functions
    goToPage,
    goToFirstPage,
    goToLastPage,
    goToPreviousPage,
    goToNextPage,
    
    // Utility functions
    resetToFirstPage
  };
};

export default usePagination;
