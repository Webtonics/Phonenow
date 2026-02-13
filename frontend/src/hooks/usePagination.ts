import { useState } from 'react';

/**
 * Pagination hook - manages pagination state
 *
 * @param initialPage - Starting page number (default: 1)
 * @returns Pagination state and controls
 *
 * @example
 * const { currentPage, totalPages, setTotalPages, nextPage, prevPage, goToPage } = usePagination();
 *
 * // When fetching data:
 * const response = await fetchData({ page: currentPage });
 * setTotalPages(response.meta.last_page);
 */
export function usePagination(initialPage: number = 1) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);

  const nextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const prevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const resetToFirstPage = () => {
    setCurrentPage(1);
  };

  return {
    currentPage,
    totalPages,
    setTotalPages,
    setCurrentPage,
    nextPage,
    prevPage,
    goToPage,
    resetToFirstPage,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  };
}
