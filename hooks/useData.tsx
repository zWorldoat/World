import useSWR, { mutate } from "swr";
import axios from "axios";

const fetcher = (url: string) =>
  axios.get(url).then((response) => response.data);

interface UseDataResult {
  data: any;
  isLoading: boolean;
  isError: any;
}

const useData = (url: string): UseDataResult => {
  const { data, error } = useSWR(url, fetcher, { refreshInterval: 5000 });

  return {
    data,
    isLoading: !error && !data,
    isError: error,
  };
};

export default useData;
