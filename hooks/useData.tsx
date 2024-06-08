import useSWR, { mutate } from "swr";
import axios from "axios";
import { useEffect } from "react";

const fetcher = (url: string) =>
  axios.get(url).then((response) => response.data);

interface UseDataResult {
  data: any;
  isLoading: boolean;
  isError: any;
}

const useData = (url: string): UseDataResult => {
  const { data, error } = useSWR(url, fetcher, { refreshInterval: 1000 });

  // Optional: manually trigger data refresh every 1000 ms
  useEffect(() => {
    const interval = setInterval(() => {
      mutate(url);
    }, 1000);
    return () => clearInterval(interval);
  }, [url]);

  return {
    data,
    isLoading: !error && !data,
    isError: error,
  };
};

export default useData;
