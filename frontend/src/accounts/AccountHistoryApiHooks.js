import useSWR from "swr";
import { useMemo } from 'react';

import httpClient from "@/lib/httpClient.js";

async function fetcher([url, id, from, to]) {
  url = `${url}?accountid=${id}`
  url += from ? `&from=${from}` : ''
  url += to ? `&to=${to}` : ''
  const response = await httpClient.get(url);
  return response.data;
}

function useAccountHistoryData(id, from, to) {
  const { data, error, isLoading } = useSWR(['account_history', id, from, to], fetcher);
  
  const history = useMemo(() => {
    if (data && !isLoading && !error) {
      return {
        balances: data.map(item => item.balance),
        dates: data.map(item => item.datetime),
      };
    }
    return null;
  }, [data, isLoading, error]);

  return {
    data: history,
    error,
    isLoading
  };

}

export default useAccountHistoryData;