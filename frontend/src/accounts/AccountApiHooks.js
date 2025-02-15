import useSWR from "swr";

import httpClient from "@/lib/httpClient.js";

async function fetcher(url) {
  const response = await httpClient.get(url);
  return response.data;
}
function useAccountData(accountId = null) {
  const { data, error, isLoading } = useSWR('account_balance', fetcher);

  if (accountId && !isLoading && !error) {
    // console.log(JSON.stringify(data, null, "\t"))
    return {
      data: (accountId in data) ? data[accountId] : null,
      error,
      isLoading
    }
  }

  return {
    data,
    error,
    isLoading
  };
}

export default useAccountData;