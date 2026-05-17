"use client";

import { useState } from "react";
import { useLocalStorageState } from "@/src/hooks/useLocalStorageState";

const STORAGE_KEY = "discovery-page-size";
const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [12, 20, 40, 60];

const isValidPageSize = (v: unknown): v is number =>
  typeof v === "number" && PAGE_SIZE_OPTIONS.includes(v);

export function useDiscoveryPagination() {
  const [pageSize, setPageSizeStored] = useLocalStorageState<number>(
    STORAGE_KEY,
    DEFAULT_PAGE_SIZE,
    {
      validate: isValidPageSize,
      serialize: (v) => v.toString(),
      deserialize: (raw) => parseInt(raw, 10),
    },
  );
  const [page, setPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  const setPageSize = (size: number) => {
    setPageSizeStored(size);
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const rangeFrom = (page - 1) * pageSize;
  const rangeTo = rangeFrom + pageSize - 1;

  return {
    page,
    setPage,
    pageSize,
    setPageSize,
    totalCount,
    setTotalCount,
    totalPages,
    rangeFrom,
    rangeTo,
  };
}
