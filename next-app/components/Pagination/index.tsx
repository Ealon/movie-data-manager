import {
  Pagination as PaginationComponent,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import type { ComponentProps } from "react";

/**
 * 获取分页范围
 * @param {number} currentPage - 当前页码
 * @param {number} totalPages - 总页数
 * @param {number} maxDisplay - 最大显示的页码数量（不包括省略号）
 * @returns {(number | string)[]} - 分页数组，可能包含页码和省略号
 */
function getPaginationRange(currentPage: number, totalPages: number, maxDisplay: number = 5): (number | string)[] {
  if (totalPages === 0) {
    return [1];
  }
  // 确保当前页码在有效范围内
  const _currentPage = Math.max(1, Math.min(currentPage, totalPages));

  let startPage: number, endPage: number;

  // 计算页码范围
  if (totalPages <= maxDisplay) {
    // 如果总页数小于最大显示数量，显示所有页码
    startPage = 1;
    endPage = totalPages;
  } else {
    // 计算起始和结束页码
    const halfMax = Math.floor(maxDisplay / 2);
    startPage = _currentPage - halfMax;
    endPage = _currentPage + halfMax;

    // 处理边界情况
    if (startPage < 1) {
      startPage = 1;
      endPage = maxDisplay;
    } else if (endPage > totalPages) {
      endPage = totalPages;
      startPage = totalPages - maxDisplay + 1;
    }
  }

  // 生成页码范围
  const paginationRange: number[] = [];
  for (let i = startPage; i <= endPage; i++) {
    paginationRange.push(i);
  }

  // 添加省略号逻辑
  const result: (number | string)[] = [];
  if (paginationRange[0] !== 1) {
    result.push(1);
    if (paginationRange[0] > 2) {
      result.push("..");
    }
  }
  result.push(...paginationRange);
  if (paginationRange[paginationRange.length - 1] !== totalPages) {
    if (paginationRange[paginationRange.length - 1] < totalPages - 1) {
      result.push("...");
    }
    result.push(totalPages);
  }

  return result;
}

interface PaginationProps extends ComponentProps<typeof PaginationComponent> {
  pathname: string;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  searchParams?: { [key: string]: string };
}

const generateHref = (
  pathname: string,
  page: number | string,
  pageSize: number | string,
  searchParams: { [key: string]: string },
) => {
  const _page = String(page);
  const _pageSize = String(pageSize);
  const _searchParams = { ...searchParams, page: _page, pageSize: _pageSize };
  const queryString = new URLSearchParams(_searchParams).toString();
  return `${pathname}?${queryString}`;
};

const Pagination = ({
  pathname,
  className,
  totalPages,
  currentPage,
  pageSize,
  searchParams = {},
  ...props
}: PaginationProps) => {
  const paginationRange = getPaginationRange(currentPage, totalPages); // sample output: [1, 2, 3, 4, 5, '...', 10]
  const prevPage = currentPage - 1;
  const nextPage = currentPage + 1;
  const prevPageHref = prevPage > 0 ? generateHref(pathname, prevPage, pageSize, searchParams) : "#";
  const nextPageHref = nextPage <= totalPages ? generateHref(pathname, nextPage, pageSize, searchParams) : "#";

  return (
    <PaginationComponent className={className} {...props}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href={prevPageHref} />
        </PaginationItem>
        {paginationRange.map((item) => {
          if (item === "..." || item === "..") {
            return <PaginationEllipsis className="text-white" key={item} />;
          }
          return (
            <PaginationItem key={item}>
              <PaginationLink
                isActive={item === currentPage}
                href={generateHref(pathname, item, pageSize, searchParams)}
              >
                {item}
              </PaginationLink>
            </PaginationItem>
          );
        })}
        <PaginationItem>
          <PaginationNext href={nextPageHref} />
        </PaginationItem>
      </PaginationContent>
    </PaginationComponent>
  );
};

export default Pagination;
