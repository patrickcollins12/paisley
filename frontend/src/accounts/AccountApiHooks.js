import useSWR from "swr";

import httpClient from "@/lib/httpClient.js";

async function fetcher(url) {
  const response = await httpClient.get(url);
  return response.data;
}
function useAccountData(accountId = null) {
  const { data, error, isLoading } = useSWR('accounts', fetcher);
  const accounts = data?.accounts

  if (accountId && !isLoading && !error) {
    
    return {
      data: (accountId in accounts) ? accounts[accountId] : null,
      error,
      isLoading
    }
  }

  return {
    "data": accounts,
    error,
    isLoading
  };
}

export default useAccountData;