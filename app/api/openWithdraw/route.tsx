import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
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

async function withdrawUntilOK(market: string) {
  console.log("func");
  try {
    const coin_balance = await axios.get(
      `http://localhost:3000/api/getbalance?ccy=${market.toUpperCase()}`
    );

    const availabletotal = coin_balance.data.available;
    console.log(availabletotal);
    const coin_config = await axiosInstance.get(
      `/v2/assets/deposit-withdraw-config?ccy=${market}`
    );

    console.log("Response data:\n", JSON.stringify(coin_config.data, null, 2));
    const coinfig_asset = coin_config.data.data.asset;
    const coinfig_chain = coin_config.data.data.chains[0];
    const tax = Number(coinfig_chain.withdrawal_fee);
    console.log(process.env.ACCESS_EX_ID, process.env.SECRET_KEY);

    const amountTotal = availabletotal - tax;

    const withdrawalData = {
      ccy: market,
      chain: coinfig_chain.chain,
      to_address: process.env.ACCESS_DEFI_ID,
      extra: {
        chain_id: "0",
      },
      amount: amountTotal.toFixed(6),
    };
    console.log("Withdrawal Data : ", JSON.stringify(withdrawalData, null, 2));
    const timestamp = Date.now().toString();
    const withdrawalResponse = await axiosInstance.post(
      "/v2/assets/withdraw",
      withdrawalData,
      {
        headers: {
          "X-COINEX-KEY": process.env.ACCESS_EX_ID,
          "X-COINEX-SIGN": createAuthorization(
            "POST",
            "/v2/assets/withdraw",
            JSON.stringify(withdrawalData),
            timestamp,
            process.env.SECRET_KEY
          ),
          "X-COINEX-TIMESTAMP": timestamp,
        },
      }
    );

    console.log(
      "Withdrawal Response:\n",
      JSON.stringify(withdrawalResponse.data, null, 2)
    );

    if (withdrawalResponse.data.message === "OK") {
      return withdrawalResponse.data;
    } else if (withdrawalResponse.data.message === "Asset Insufficient") {
      return withdrawalResponse.data;
    }
  } catch (error: any) {
    console.error("Withdrawal Error:", error.response?.data || error.message);
    throw error;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ccy = searchParams.get("ccy") as string;
  console.log(ccy);
  if (!ccy || typeof ccy !== "string") {
    return NextResponse.json(
      { error: "Currency code (ccy) is required and must be a string" },
      { status: 400 }
    );
  }
  try {
    console.log("ABC");
    const results = await withdrawUntilOK(ccy);
    return NextResponse.json(results);
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
