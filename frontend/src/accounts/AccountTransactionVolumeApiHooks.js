import useSWR from "swr";
import { useMemo } from 'react';
import httpClient from "@/lib/httpClient.js";

async function fetcher([url, id, from, to]) {
  const params = new URLSearchParams();
  params.append('accountid', id);
  if (from) params.append('from', from);
  if (to) params.append('to', to);
  const newUrl = `${url}?${params.toString()}`
  // console.log(`newUrl: ${newUrl}`)
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

// import useSWR from "swr";
// import { useMemo } from 'react';
// import httpClient from "@/lib/httpClient.js";

// async function fetcher([url, id, from, to]) {
//   url = `${url}?accountid=${id}`
//   url += from ? `&from=${from}` : ''
//   url += to ? `&to=${to}` : ''
//   const response = await httpClient.get(url);
//   return response.data;
// }

// function useAccountTransactionVolume(id, from, to) {
//   const { data, error, isLoading } = useSWR(['account_transaction_volume', id, from, to], fetcher);
  
//   // const history = useMemo(() => {
//   //   if (data && !isLoading && !error) {
//   //     return {
//   //       balances: data.map(item => item.balance),
//   //       dates: data.map(item => item.datetime),
//   //     };
//   //   }
//   //   return null;
//   // }, [data, isLoading, error]);

//   return {
//     data,
//     error,
//     isLoading
//   };

// }

// export default useAccountTransactionVolume;