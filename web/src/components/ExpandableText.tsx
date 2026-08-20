"use client";

import React, { useState, useRef, useEffect, ReactNode } from "react";
import { CaretDown } from "@phosphor-icons/react";

interface ExpandableTextProps {
  children: ReactNode;
  maxLines?: number;
  expandLabel?: string;
  collapseLabel?: string;
  className?: string;
}

export function ExpandableText({
  children,
  maxLines = 4,
  expandLabel = "ดูเพิ่มเติม",
  collapseLabel = "ย่อ",
  className = "",
}: ExpandableTextProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const check = () => {
      setIsOverflowing(el.scrollHeight > el.clientHeight + 2);
    };

    check();

    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, [children]);

  const clampClass = isExpanded ? "" : `line-clamp-${maxLines}`;

  return (
    <div className={className}>
      <div
        ref={contentRef}
        className={`transition-all duration-300 ease-in-out ${clampClass}`}
        style={
          !isExpanded && maxLines > 6
            ? {
                display: "-webkit-box",
                WebkitLineClamp: maxLines,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }
            : undefined
        }
      >
        {children}
      </div>

      {(isOverflowing || isExpanded) && (
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-cyan-400 hover:text-blue-700 dark:hover:text-cyan-300 cursor-pointer transition-colors group"
        >
          <span>{isExpanded ? collapseLabel : expandLabel}</span>
          <CaretDown
            size={13}
            weight="bold"
            className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
          />
        </button>
      )}
    </div>
  );
}

interface ExpandableListProps<T> {
  items: T[];
  initialCount?: number;
  renderItem: (item: T, index: number) => ReactNode;
  expandLabel?: (hiddenCount: number) => string;
  collapseLabel?: string;
  className?: string;
  listClassName?: string;
}

export function ExpandableList<T>({
  items,
  initialCount = 3,
  renderItem,
  expandLabel = (n) => `ดูเพิ่มเติม (+${n} รายการ)`,
  collapseLabel = "ย่อ",
  className = "",
  listClassName = "space-y-3",
}: ExpandableListProps<T>) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasMore = items.length > initialCount;
  const visibleItems = isExpanded ? items : items.slice(0, initialCount);

  return (
    <div className={className}>
      <ul className={listClassName}>
        {visibleItems.map((item, idx) => (
          <React.Fragment key={idx}>{renderItem(item, idx)}</React.Fragment>
        ))}
      </ul>

      {hasMore && (
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-cyan-400 hover:text-blue-700 dark:hover:text-cyan-300 cursor-pointer transition-colors"
        >
          <span>
            {isExpanded ? collapseLabel : expandLabel(items.length - initialCount)}
          </span>
          <CaretDown
            size={13}
            weight="bold"
            className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
          />
        </button>
      )}
    </div>
  );
}
