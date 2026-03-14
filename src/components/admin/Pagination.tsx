// client/src/components/admin/Pagination.tsx

import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
  isLoading?: boolean;
  clickedButton?: 'prev' | 'next' | number;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
  isLoading = false,
  clickedButton,
}) => {
  const baseButtonStyles = "relative inline-flex items-center border text-sm font-medium rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700";
  const activePageStyles = "z-10 bg-[#9F8BCF]/15 dark:bg-gradient-to-r from-[#6242a5]/10 to-[#9f8bcf]/10 border-[#9F8BCF] dark:border-[#9f8bcf]] text-[#6242A5] dark:text-[#FFFFFF]/50";
  const mobileButtonStyles = `${baseButtonStyles} px-3 py-2`;
  const desktopNavButtonStyles = `${baseButtonStyles} px-2 py-2`;
  const pageNumberStyles = `${baseButtonStyles} px-4 py-2`;
  const ellipsisStyles = "relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-md";

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-4 sm:py-3 bg-transparent">
      <div className="flex-1 flex justify-between sm:hidden gap-2 w-full">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || isLoading}
          className={mobileButtonStyles}
        >
          {isLoading && clickedButton === 'prev' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || isLoading}
          className={mobileButtonStyles}
        >
          {isLoading && clickedButton === 'next' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Next
        </Button>
      </div>

      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Showing <span className="font-medium">{startItem}</span> to{' '}
            <span className="font-medium">{endItem}</span> of{' '}
            <span className="font-medium">{totalItems}</span> results
          </p>
        </div>

        <div>
          <nav className="relative z-0 inline-flex gap-2 rounded-md shadow-sm">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1 || isLoading}
              className={desktopNavButtonStyles}
            >
              {isLoading && clickedButton === 'prev' ? <Loader2 className="h-5 w-5 animate-spin" /> : <ChevronLeft className="h-5 w-5" />}
            </Button>

            {getVisiblePages().map((page, index) => (
              <React.Fragment key={index}>
                {page === '...' ? (
                  <span className={ellipsisStyles}>
                    ...
                  </span>
                ) : (
                  <Button
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange(page as number)}
                    disabled={isLoading}
                    className={`${pageNumberStyles} ${currentPage === page ? activePageStyles : ''}`}
                  >
                    {isLoading && clickedButton === page ? <Loader2 className="h-4 w-4 animate-spin" /> : page}
                  </Button>
                )}
              </React.Fragment>
            ))}

            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages || isLoading}
              className={desktopNavButtonStyles}
            >
              {isLoading && clickedButton === 'next' ? <Loader2 className="h-5 w-5 animate-spin" /> : <ChevronRight className="h-5 w-5" />}
            </Button>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Pagination;

