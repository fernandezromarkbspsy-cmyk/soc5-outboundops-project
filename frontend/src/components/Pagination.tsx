import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Page } from '../types';

export function Pagination({ page, onPageChange }: { page: Page<unknown>; onPageChange: (page: number) => void }) {
  if (page.last_page == null || page.current_page == null) return null;
  const currentPage = page.current_page;
  const lastPage = page.last_page;
  if (page.last_page <= 1) return null;
  return <nav className="pagination" aria-label="Table pagination">
    <p>{page.from ?? 0}-{page.to ?? 0} of {page.total ?? 0}</p>
    <div>
      <button className="icon-button" type="button" title="Previous page" aria-label="Previous page" disabled={currentPage <= 1} onClick={() => onPageChange(currentPage - 1)}><ChevronLeft size={18} /></button>
      <span>Page {currentPage} of {lastPage}</span>
      <button className="icon-button" type="button" title="Next page" aria-label="Next page" disabled={currentPage >= lastPage} onClick={() => onPageChange(currentPage + 1)}><ChevronRight size={18} /></button>
    </div>
  </nav>;
}
