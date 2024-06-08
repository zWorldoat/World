import axios from "axios";
import { NextResponse } from "next/server";
import crypto from "crypto"; // Import crypto module

// Function to create the authorization header
function createAuthorization(
  method,
  request_path,
  body_json,
  timestamp,
  secret_id
) {
  const text = method + request_path + body_json + timestamp + secret_id;
  const hash = crypto
    .createHash("sha256")
    .update(text)
    .digest("hex")
    .toUpperCase();
  return hash;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

async function putMarketOrder(params) {
  try {
    const timestamp = Date.now().toString();
    const data = {
      market: params.market,
      market_type: "SPOT",
      side: "buy",
      type: "market",
      amount: params.amount,
      ccy: "USDT",
      client_id: "apirequest",
      is_hide: true,
    };

    const orderResponse = await axiosInstance.post("/v2/spot/order", data, {
      headers: {
        "X-COINEX-KEY": params.accessid,
        "X-COINEX-SIGN": createAuthorization(
          "POST",
          "/v2/spot/order",
          JSON.stringify(data),
          timestamp,
          params.secretid
        ),
        "X-COINEX-TIMESTAMP": timestamp,
      },
    });

    console.log(
      "Response data:\n",
      JSON.stringify(orderResponse.data, null, 2)
    );

    if (orderResponse.data.message === "OK") {
      const totalAmount =
        orderResponse.data.data.filled_amount -
        orderResponse.data.data.base_fee -
        params.tax;
      console.log("Processing Withdraw", params.ccy, params.chain, totalAmount);

      const withdrawalData = {
        ccy: params.ccy,
        chain: params.chain,
        to_address: params.walletdife,
        extra: {
          chain_id: "0",
        },
        amount: totalAmount,
      };
      const myaccess = {
        accessid: params.accessid,
        secretid: params.secretid,
      };

      const withdrawalResponse = await withdrawUntilOK(
        withdrawalData,
        myaccess
      );

      return withdrawalResponse;
    } else {
      console.log("Message is not OK. Handling the case...");
      return { error: "Order message is not OK" };
    }
  } catch (error) {
    console.error("Error:", error);
    throw error; // Propagate the error to the caller
  }
}

async function withdrawUntilOK(withdrawalData, myaccess) {
  try {
    while (true) {
      const timestamp = Date.now().toString();

      const withdrawalResponse = await axiosInstance.post(
        "/v2/assets/withdraw",
        withdrawalData,
        {
          headers: {
            "X-COINEX-KEY": myaccess.accessid,
            "X-COINEX-SIGN": createAuthorization(
              "POST",
              "/v2/assets/withdraw",
              JSON.stringify(withdrawalData),
              timestamp,
              myaccess.secretid
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
      // Wait for a certain period before sending the next withdrawal request
      await delay(3000); // Delay for 5 seconds (5000 milliseconds)
    }
  } catch (error) {
    console.error("Withdrawal Error:", error);
    throw error; // Propagate the error to the caller
  }
}

export async function GET(req, { params }) {
  try {
    const results = await putMarketOrder(params);
    return NextResponse.json(results);
  } catch (error) {
    console.error("Error fetching data from APIs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
