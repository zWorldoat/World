import axios from "axios";
import { NextResponse } from "next/server";
import crypto from "crypto";
const dotenv = require("dotenv");
dotenv.config();

function createAuthorization(
  method: string,
  request_path: string,
  body_json: any,
  timestamp: any,
  secret_id: any
) {
  const text = method + request_path + body_json + timestamp + secret_id;
  const hash = crypto
    .createHash("sha256")
    .update(text)
    .digest("hex")
    .toUpperCase();
  return hash;
}

const axiosInstance = axios.create({
  baseURL: "https://api.coinex.com/",
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.71 Safari/537.36",
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

async function putMarketOrder(market: string, amount: number) {
  try {
    const timestamp = Date.now().toString();
    const data = {
      market: market,
      market_type: "SPOT",
      side: "buy",
      type: "market",
      amount: amount,
      ccy: "USDT",
      client_id: "apirequest",
      is_hide: true,
    };

    const orderResponse = await axiosInstance.post("/v2/spot/order", data, {
      headers: {
        "X-COINEX-KEY": process.env.ACCESS_EX_ID,
        "X-COINEX-SIGN": createAuthorization(
          "POST",
          "/v2/spot/order",
          JSON.stringify(data),
          timestamp,
          process.env.SECRET_KEY
        ),
        "X-COINEX-TIMESTAMP": timestamp,
      },
    });

    console.log(
      "Response data:\n",
      JSON.stringify(orderResponse.data, null, 2)
    );
    return orderResponse.data;
  } catch (error: any) {
    console.error("Error:", error.response?.data || error.message);
    throw error;
  }
}

export async function GET(
  req: any,
  { params }: { params: { market: string; amounts: number } }
) {
  try {
    const order = await putMarketOrder(params.market, params.amounts);
    return NextResponse.json(order);
  } catch (error: any) {
    console.error(
      "Error fetching data from APIs:",
      error.response?.data || error.message
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
