import axios from "axios";
import { NextResponse } from "next/server";
import { COIN_LISTS } from "./coinlist";
// import sha256 from "crypto-js/sha256";
// import { enc } from "crypto-js";

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
      ticker: tickerResponse.data.data[0],
      assetConfig: assetConfigResponse.data.data.asset,
      chains: assetConfigResponse.data.data.chains[0],
      depth: depthResponse.data.data.depth,
      price: priceResponse.data.data,
      timestamp: priceResponse.data.timeTaken,
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
    const coinData = results
      .filter((result) => result.status === "fulfilled")
      .map((result) => result.value);

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
