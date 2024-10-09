import axios from "axios";
import { NextResponse } from "next/server";
import { COIN_LISTS } from "./coinlist";

// Assuming rows array contains the coin IDs
const rows: string[] = COIN_LISTS.map(coin => coin.id);

// Function to split an array into chunks of a given size
function chunkArray(array: string[], chunkSize: number): string[][] {
  const chunks: string[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    const chunk = array.slice(i, i + chunkSize);
    chunks.push(chunk);
  }
  return chunks;
}

const row02: string[] = COIN_LISTS.map(coin => coin.name);

// Function to split an array into chunks of a given size
function chunkName(array: string[], chunkSize: number): string[][] {
  const chunks: string[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    const chunk = array.slice(i, i + chunkSize);
    chunks.push(chunk);
  }
  return chunks;
}

// Log the resulting chunks to the console


interface TickerData {
  close: string;
  high: string;
  last: string;
  low: string;
  market: string;
  open: string;
  period: number;
  value: string;
  volume: string;
  volume_buy: string;
  volume_sell: string;
}

interface AssetConfigData {
  ccy: string;
  deposit_enabled: boolean;
  withdraw_enabled: boolean;
  inter_transfer_enabled: boolean;
  is_st: boolean;
}

interface ChainData {
  chain: string;
  min_deposit_amount: string;
  min_withdraw_amount: string;
  deposit_enabled: boolean;
  withdraw_enabled: boolean;
  deposit_delay_minutes: number;
  safe_confirmations: number;
  irreversible_confirmations: number;
  deflation_rate: string;
  withdrawal_fee: string;
  withdrawal_precision: number;
  memo: string;
  is_memo_required_for_deposit: boolean;
  explorer_asset_url: string;
}

interface DepthData {
  asks: Array<[string, string]>;
  bids: Array<[string, string]>;
  checksum: number;
  last: string;
  updated_at: number;
}

interface PriceData {
  id: string;
  mintSymbol: string;
  vsToken: string;
  vsTokenSymbol: string;
  price: number;
}

interface CoinPriceData {
  [key: string]: PriceData;
}

async function fetchFromApi(endpoint: string) {
  try {
    const response = await axios.get(endpoint);
    console.log(`Response from ${endpoint}:`, response.data); // Log the entire response for debugging
    return response.data.data;
  } catch (error: any) {
    console.error(`Error fetching from ${endpoint}:`, error.message);
    throw error; // Propagate the error
  }
}

async function fetchCoinData(coin: any) {
  try {
    const nameChunks = chunkName([coin], 10); // Only one coin at a time, split it into a chunk

    // Fetch Depth Data
    const depthResponses = await Promise.all(
      nameChunks.map(async (chunk) => {
        const nameString = chunk.map(c => c.name).join(',');
        return fetchFromApi(`https://api.coinex.com/v2/spot/depth?market=${nameString + "USDT"}&limit=50&interval=0.0000000001`);
      })
    );

    const depthResponse = depthResponses.reduce((acc, res) => ({ ...acc, ...res }), {});

    // Fetch Ticker Data
    const tickerResponses = await Promise.all(
      nameChunks.map(async (chunk) => {
        const nameString = chunk.map(c => c.name).join(',');
        return fetchFromApi(`https://api.coinex.com/v2/spot/ticker?market=${nameString + "USDT"}`);
      })
    );

    const tickerResponse = tickerResponses.reduce((acc, res) => ({ ...acc, ...res }), {});

    // Fetch Asset Config Data
    const assetConfigResponses = await Promise.all(
      nameChunks.map(async (chunk) => {
        const nameString = chunk.map(c => c.name).join(',');
        return fetchFromApi(`https://api.coinex.com/v2/assets/deposit-withdraw-config?ccy=${nameString}`);
      })
    );

    const assetConfigResponse = assetConfigResponses.reduce((acc, res) => ({ ...acc, ...res }), {});

    // Ensure that assetConfigResponse has the expected structure
    if (!assetConfigResponse || !assetConfigResponse.data || !assetConfigResponse.data.asset) {
      console.warn(`Asset data is not available for ${coin.name}`);
      return null; // Skip this coin if data is missing
    }

    // Fetch Price Data
    const priceDataChunks = chunkArray([coin], 100); // Only one coin at a time, split it into a chunk
    const priceResponses = await Promise.all(
      priceDataChunks.map(async (chunk) => {
        const idsString = chunk.map(c => c.id).join(',');
        return fetchFromApi(`https://price.jup.ag/v6/price?ids=${idsString}&vsToken=USDT`);
      })
    );

    const priceData = priceResponses.reduce((acc, res) => ({ ...acc, ...res }), {});

    return {
      name: coin.name,
      ticker: tickerResponse[coin.name + "USDT"] as TickerData, // Adjust as per response structure
      assetConfig: assetConfigResponse.data.asset as AssetConfigData,
      chains: assetConfigResponse.data.chains[0] as ChainData,
      depth: depthResponse.data.depth as DepthData,
      price: priceData as CoinPriceData,
      timestamp: Date.now(), // Update to current timestamp
    };
  } catch (error: any) {
    console.error(`Error fetching data for ${coin.name}:`, error.message);
    return null; // Return null to indicate failure
  }
}

export async function GET(req: any, res: any) {
  try {
    const coins = COIN_LISTS;
    const coinDataPromises = coins.map(fetchCoinData);
    const results = await Promise.allSettled(coinDataPromises);
    const coinData = results.flatMap((result) =>
      result.status === "fulfilled" ? [result.value] : []
    );
    return NextResponse.json(coinData);
  } catch (error) {
    console.error("Error fetching data from APIs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
