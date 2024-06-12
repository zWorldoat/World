import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
import sha256 from "crypto-js/sha256";
import { enc } from "crypto-js";

interface Balance {
  available: string;
  ccy: string;
  frozen: string;
}
// Function to create the authorization header
function createAuthorization(
  method: String,
  request_path: string,
  body_json: any,
  timestamp: any
) {
  const text =
    method + request_path + body_json + timestamp + process.env.SECRET_KEY;
  const hash = sha256(text).toString(enc.Hex).toUpperCase();
  return hash;
}

// Create an axios instance
const axios2 = axios.create({
  baseURL: "https://api.coinex.com/",
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.71 Safari/537.36",
    "Content-Type": "application/json", // Corrected placement
  },
  timeout: 10000,
});

// Function to get spot balance
async function getSpotBalance() {
  const timestamp = Date.now().toString();
  const authorization = createAuthorization(
    "GET",
    "/v2/assets/spot/balance",
    "", // Assuming no body for a GET request
    timestamp
  );

  const headers = {
    "X-COINEX-KEY": process.env.ACCESS_EX_ID,
    "X-COINEX-SIGN": authorization,
    "X-COINEX-TIMESTAMP": timestamp,
  };

  try {
    const res = await axios2.get("/v2/assets/spot/balance", {
      headers,
    });
    console.log("account info:\n", JSON.stringify(res.data, null, 2));
    return res.data;
  } catch (error) {
    console.error("Error fetching data from APIs:", error);
    throw error; // Rethrow the error to be handled by the caller
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ccy = searchParams.get("ccy");

  if (!ccy || typeof ccy !== "string") {
    return NextResponse.json(
      { error: "Currency code (ccy) is required and must be a string" },
      { status: 400 }
    );
  }

  try {
    const results = await getSpotBalance();
    const resData = results.data.find((item: Balance) => item.ccy === ccy);

    if (!resData) {
      return NextResponse.json(
        { error: "Currency not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(resData);
  } catch (error) {
    // console.error("Error fetching data from APIs:", error);
    // return NextResponse.json(
    //   { error: "Internal server error" },
    //   { status: 500 }
    // );
  }
}
