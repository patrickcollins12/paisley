import useSWR from "swr";
import { useMemo } from "react";

import httpClient from "@/lib/httpClient.js";

async function fetcher([url, accountid]) {
  const newurl = accountid ? `${url}/${accountid}` : url
  const response = await httpClient.get(newurl);
  // const response = await httpClient.get(`${url}/${accountid}`);
  // console.log(`url: ${newurl}, response: ${JSON.stringify(response.data)}`)
  return response.data;
}

const delayedFetcher = async (...args) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {

      // timeout tester
      fetcher(...args).then(resolve).catch(reject);

      // failure tester
      // reject(new Error("Deliberate error for testing"));

    }, 2000);
  });
};

function useAccountData(accountid) {
  // const { data, error, isLoading } = useSWR(["accounts", accountid],delayedFetcher);
  const { data, error, isLoading } = useSWR(["accounts", accountid],fetcher);

  // Return an array for all accounts, or a single object if accountid is provided
  const result = useMemo(() => {
    if (!data || isLoading || error) return undefined;
    return data?.account;
  }, [data, isLoading, error]);

  // console.log("SWR State:", { data, error, isLoading }); // Debugging log
  return {
    data: result,
    error,
    isLoading,
  };
}

async function update(id, data) {
  const url = `accounts/${id}`;
  const response = await httpClient.patch(url, data);
  // await mutate(['/accounts']);
  return response;
}

async function create(postData) {
  try {
    const response = await httpClient.post('accounts', postData);
    return { data: response.data, error: null, isLoading: false };
  } catch (err) {
    const errorMsg = err.response?.data?.message || err.message;
    return { data: null, error: errorMsg, isLoading: false };
  }
}

async function remove(id) {
  const url = `accounts/${id}`;
  const response = await httpClient.delete(url);

  // this is a bit shit because the query key has to be updated in multiple places
  await mutate(['/accounts']);
  return response;
}

export function useUpdateAccounts() {
  return {
    create,
    update,
    remove
  }
}

export default useAccountData;