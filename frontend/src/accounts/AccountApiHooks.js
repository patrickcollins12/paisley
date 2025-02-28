import useSWR from "swr";
import { useMemo } from "react";

import httpClient from "@/lib/httpClient.js";

async function fetcher([url,accountid]) {
  const newurl = accountid ? `${url}/${accountid}` : url
  const response = await httpClient.get(newurl);
  // const response = await httpClient.get(`${url}/${accountid}`);
  // console.log(`url: ${newurl}, response: ${JSON.stringify(response.data)}`)
  return response.data;
}

function useAccountData(accountid) {
  const { data, error, isLoading } = useSWR(["accounts", accountid], fetcher);

  // Return an array for all accounts, or a single object if accountid is provided
  const result = useMemo(() => {
    if (!data || isLoading || error) return undefined;
    return data?.account;
  }, [data, isLoading, error]);

  return {
    data: result,
    error,
    isLoading,
  };
}

export default useAccountData;