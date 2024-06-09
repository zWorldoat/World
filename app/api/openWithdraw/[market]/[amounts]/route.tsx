import axios from "axios";
import { NextResponse } from "next/server";
import crypto from "crypto"; // Import crypto module
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

// Create an axios instance
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
    throw error; // Propagate the error to the caller
  }
}

async function withdrawUntilOK(data: {
  data: {
    amount: Number;
    base_fee: Number;
    ccy: string;
    client_id: string;
    created_at: Number;
    discount_fee: Number;
    filled_amount: Number;
    filled_value: Number;
    last_fill_amount: number;
    last_fill_price: Number;
    maker_fee_rate: Number;
    market: string;
    market_type: string;
    order_id: Number;
    price: Number;
    quote_fee: Number;
    side: string;
    taker_fee_rate: Number;
    type: string;
    unfilled_amount: Number;
    updated_at: Number;
  };
}) {
  try {
    while (true) {
      const timestamp = Date.now().toString();
      const datafilter = data.data;
      const coinName = datafilter.market;
      const coinName_NoUSDT = coinName.substring(0, coinName.length - 4);
      const coin_config = await axios.get(
        `https://api.coinex.com/v2/assets/deposit-withdraw-config?ccy=${coinName_NoUSDT}`
      );
      console.log(
        "Response data:\n",
        JSON.stringify(coin_config.data, null, 2)
      );
      const coinfig_asset = coin_config.data.data.asset;
      const coinfig_chain = coin_config.data.data.chains[0];
      const amountNew = Number(datafilter.filled_amount);
      // const tax_tolalance =
      //   (Number(coinfig_chain.withdrawal_fee) + Number(datafilter.base_fee)) *
      //   0.01;
      const tax =
        Number(coinfig_chain.withdrawal_fee) + Number(datafilter.base_fee);
      const amountTotal = amountNew - tax;
      console.log("TAX : " + tax);
      console.log("AMOUNT : " + amountTotal);

      const withdrawalData = {
        ccy: coinName_NoUSDT,
        chain: coinfig_chain.chain,
        to_address: process.env.ACCESS_DEFI_ID,
        extra: {
          chain_id: "0",
        },
        amount: amountTotal.toFixed(6),
      };
      console.log("AMOUNT : " + withdrawalData);

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
        JSON.stringify(withdrawalData, null, 2)
      );
      console.log(
        "Withdrawal Response:\n",
        JSON.stringify(withdrawalResponse.data, null, 2)
      );

      if (withdrawalResponse.data.message === "OK") {
        return withdrawalResponse.data;
      } else if (
        withdrawalResponse.data.message ===
        "Exceeding the withdrawal decimal limit"
      ) {
        return withdrawalResponse.data;
      }
    }
  } catch (error: any) {
    console.error("Withdrawal Error:", error.response?.data || error.message);
    throw error; // Propagate the error to the caller
  }
}

export async function GET(
  req: any,
  { params }: { params: { market: string; amounts: number } }
) {
  try {
    const order = await putMarketOrder(params.market, params.amounts);
    const results = await withdrawUntilOK(order);
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
