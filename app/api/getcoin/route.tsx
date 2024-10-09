import axios from "axios";
import { NextResponse } from "next/server";
import { COIN_LISTS } from "./coinlist";

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

// Other interface definitions...

interface CoinPriceData {
  [key: string]: PriceData;
}

async function fetchWithLogging(url: string) {
  console.log(`Fetching: ${url}`);
  try {
    const response = await axios.get(url);
    console.log(`Success: ${url}`);
    return response;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(`Error fetching ${url}: ${error.message}`);
      console.error(`Status: ${error.response?.status}`);
      console.error(`Data: ${JSON.stringify(error.response?.data)}`);
    } else {
      console.error(`Unknown error fetching ${url}: ${error}`);
    }
    throw error;
  }
}

async function fetchPriceDataInBatches(coins: any[], batchSize: number = 100) {
  let allPriceData: CoinPriceData = {};
  for (let i = 0; i < coins.length; i += batchSize) {
    const batchCoins = coins.slice(i, i + batchSize);
    const batchIds = batchCoins.map(coin => coin.id).join(',');
    const priceUrl = `https://api.jup.ag/price/v2?ids=${batchIds}&showExtraInfo=true`;
    try {
      const priceResponse = await fetchWithLogging(priceUrl);
      Object.assign(allPriceData, priceResponse.data.data);
    } catch (error) {
      console.error(`Error fetching batch price data (${i} to ${i + batchSize}):`, error);
    }
  }
  return allPriceData;
}

async function fetchCoinData(coins: any[]) {
  try {
    const allPriceData = await fetchPriceDataInBatches(coins);

    const coinDataPromises = coins.map(async (coin) => {
      try {
        const [depthResponse, tickerResponse, assetConfigResponse] = await Promise.all([
          fetchWithLogging(`https://api.coinex.com/v2/spot/depth?market=${coin.name.split("USDT")[0]}USDT&limit=50&interval=0.0000000001`),
          fetchWithLogging(`https://api.coinex.com/v2/spot/ticker?market=${coin.name}`),
          fetchWithLogging(`https://api.coinex.com/v2/assets/deposit-withdraw-config?ccy=${coin.name.split("USDT")[0]}`)
        ]);

        const priceData = allPriceData[coin.id];
        const buyPrice = priceData?.extraInfo?.quotedPrice?.buyPrice || null;

        return {
          name: coin.name,
          ticker: tickerResponse.data.data[0],
          assetConfig: assetConfigResponse.data.data.asset,
          chains: assetConfigResponse.data.data.chains[0],
          depth: depthResponse.data.data.depth,
          price: {
            [coin.id]: {
              ...priceData,
              buyPrice: buyPrice
            }
          },
          timestamp: Date.now(),
        };
      } catch (error: any) {
        console.error(`Error fetching data for ${coin.name}:`, error.message);
        return null;
      }
    });

    const results = await Promise.all(coinDataPromises);
    return results.filter(result => result !== null);
  } catch (error: any) {
    console.error("Error in fetchCoinData:", error.message);
    return [];
  }
}

export async function GET(req: any, res: any) {
  try {
    console.log("Starting to fetch coin data");
    const coins = COIN_LISTS;
    const coinData = await fetchCoinData(coins);
    
    // Count the number of successfully fetched coin data
    console.log(`Total coins fetched: ${coinData.length}`);
    
    console.log("Finished fetching coin data");
    return NextResponse.json(coinData);
  } catch (error) {
    console.error("Error fetching data from APIs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
