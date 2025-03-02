import useSWR from "swr";
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

function useAccountTransactionVolume(id, from, to) {
  const { data, error, isLoading } = useSWR(['account_transaction_volume', id, from, to], fetcher);

  return {
    data,
    error,
    isLoading
  };
}

export default useAccountTransactionVolume;
