import useSWR from "swr";
import { useMemo } from 'react';
import httpClient from "@/lib/httpClient.js";

async function fetcher([url, id, from, to]) {
  const params = new URLSearchParams();
  params.append('accountid', id);
  if (from) params.append('from', from);
  if (to) params.append('to', to);
  const newUrl = `${url}?${params.toString()}`
  const response = await httpClient.get(newUrl);
  return response.data;
}

function useAccountInterestChanges(id, from, to) {
  const { data, error, isLoading } = useSWR(['account_interest_changes', id, from, to], fetcher);

  return {
    data,
    error,
    isLoading
  };
}

export default useAccountInterestChanges;
