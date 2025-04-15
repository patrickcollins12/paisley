import useSWR from "swr";
import httpClient from "@/lib/httpClient.js";

async function fetcher([url, params]) {
  const queryParams = new URLSearchParams();
  if (params.accountid) queryParams.append('accountid', params.accountid);
  if (params.from) queryParams.append('from', params.from);
  if (params.to) queryParams.append('to', params.to);
  if (params.interpolate) queryParams.append('interpolate', 'true');
  
  const newUrl = `${url}?${queryParams.toString()}`;
  const response = await httpClient.get(newUrl);
  return response.data;
}

function useAccountHistoryData({ accountid, from, to, interpolate = false }) {
  const { data, error, isLoading, mutate } = useSWR(
    ['account_history', { accountid, from, to, interpolate }], // Pass the parameters object
    fetcher
  );
  
  return {
    data,
    error,
    isLoading,
    mutate
  };
}

export default useAccountHistoryData;
