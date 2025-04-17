import useSWR, { mutate } from "swr";
import httpClient from "@/lib/httpClient.js";

const STORE_NAMESPACE = 'saved-searches';
const API_BASE_URL = `store/${STORE_NAMESPACE}`; // Base URL for this hook

// --- Fetcher --- //
async function fetcher(url) {
  const response = await httpClient.get(url);
  return response.data; // Assuming data is the array [{ key: 'name1', value: '...' }, ...]
}

// --- Hook Definition --- //
export function useSavedSearches() {

  // Fetch the list of saved searches
  const { 
    data: savedSearchList, // Rename data for clarity
    error,
    isLoading,
    mutate: mutateList // Expose mutate function for the list
  } = useSWR(API_BASE_URL, fetcher);


// Function to save (create or update) a search
async function saveSearch(key, value) {
  const url = API_BASE_URL;
  // Value should be the actual JS object/array here, backend will stringify
  const payload = { key, value }; 
  try {
    await httpClient.post(url, payload);
    await mutateList(); // Revalidate the list after saving
    return { success: true }; // Return success
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.message;
    console.error('Error saving search:', errorMsg);
    return { success: false, error: errorMsg }; // Return failure
  }
} 

  // Function to delete a search
  async function deleteSearch(key) {
    const url = `${API_BASE_URL}/${encodeURIComponent(key)}`;
    try {
      await httpClient.delete(url);
      await mutateList(); // Revalidate the list after deleting
      return { success: true };
    } catch (err) {
      console.error('Failed to delete search:', err);
      const errorMsg = err.response?.data?.error || err.message;
      return { success: false, error: errorMsg };
    }
  }

  // Function to get a single search (could be separate hook if preferred)
  // This one doesn't use useSWR directly as it's often triggered on demand (e.g., load button)
  async function getSearch(key) {
     const url = `${API_BASE_URL}/${encodeURIComponent(key)}`;
     try {
        const response = await httpClient.get(url);
        if (response.data) {
             return { success: true, data: { value: response.data } }; // Correct structure for the caller
        } else {
            throw new Error('Invalid data format received from API (empty response)');
        }
     } catch (err) {
         console.error('Failed to get search:', err);
         const errorMsg = err.response?.data?.error || err.message;
         return { success: false, error: errorMsg };
     }
  }

  return {
    savedSearchList, // The raw list [{ key: 'name1', value: '...' }, ...]
    isLoading,
    error,
    saveSearch,   // Function to save/update
    deleteSearch, // Function to delete
    getSearch,    // Function to fetch a single item on demand
    mutateList    // Function to manually trigger list revalidation
  };
} 