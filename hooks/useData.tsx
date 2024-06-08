import useSWR from "swr";
import axios from "axios";

// Define the fetcher function using Axios
const fetcher = (url: string) =>
  axios.get(url).then((response) => response.data);

// Define the return type of useData hook
interface UseDataResult {
  data: any;
  isLoading: boolean;
  isError: any;
}

// Create a custom hook to fetch data with SWR
const useData = (url: string): UseDataResult => {
  const { data, error } = useSWR(url, fetcher, { refreshInterval: 1000 });
  return {
    data,
    isLoading: !error && !data,
    isError: error,
  };
};

export default useData;
