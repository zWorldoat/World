import axios from "axios";
import { NextResponse } from "next/server";
import { COIN_LISTS } from "./coinlist";
// import sha256 from "crypto-js/sha256";
// import { enc } from "crypto-js";

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

interface CoinData {
  name: string;
  ticker: TickerData;
  assetConfig: AssetConfigData;
  chains: ChainData;
  depth: DepthData;
  price: CoinPriceData;
  timestamp: number;
}

interface Coin {
  name: string;
  id: string;
}

// Function to fetch data for a coin
async function fetchCoinData(coin: any) {
  try {
    const tickerResponse = await axios.get(
      `https://api.coinex.com/v2/spot/ticker?market=${coin.name}USDT`
    );
    const assetConfigResponse = await axios.get(
      `https://api.coinex.com/v2/assets/deposit-withdraw-config?ccy=${coin.name}`
    );
    const depthResponse = await axios.get(
      `https://api.coinex.com/v2/spot/depth?market=${coin.name}USDT&limit=50&interval=0.0000000001`
    );
    const priceResponse = await axios.get(
      `https://price.jup.ag/v6/price?ids=${coin.id}&vsToken=USDT`
    );

    return {
      name: coin.name,
      ticker: tickerResponse.data.data[0] as TickerData,
      assetConfig: assetConfigResponse.data.data.asset as AssetConfigData,
      chains: assetConfigResponse.data.data.chains[0] as ChainData,
      depth: depthResponse.data.data.depth as DepthData,
      price: priceResponse.data.data as CoinPriceData,
      timestamp: priceResponse.data.timeTaken as number,
    };
  } catch (error: any) {
    console.error(`Error fetching data for ${coin.name}:`, error.message);
    return null;
  }
}

export async function GET(req: any, res: any) {
  try {
    // Your logic for handling GET requests
    const coins = COIN_LISTS;

    // Fetch data for each coin concurrently
    const coinDataPromises = coins.map(fetchCoinData);

    // Wait for all promises to settle
    const results = await Promise.allSettled(coinDataPromises);

    // Filter out successful results and extract data
    const coinData = results.flatMap((result) =>
      result.status === "fulfilled" ? [result.value] : []
    );

    // Send response with the fetched data
    return NextResponse.json(coinData);
  } catch (error) {
    console.error("Error fetching data from APIs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
