import axios from "axios";
import { NextResponse } from "next/server";
import sha256 from "crypto-js/sha256";
import { enc } from "crypto-js";

function createAuthorization(
  method: any,
  request_path: any,
  body_json: any,
  timestamp: any
) {
  const text =
    method + request_path + body_json + timestamp + process.env.SECRET_KEY;
  const hash = sha256(text).toString(enc.Hex).toUpperCase();
  return hash;
}

const axios2 = axios.create({
  baseURL: "https://api.coinex.com/",
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.71 Safari/537.36",
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

async function getSpotBalance() {
  const timestamp = Date.now().toString();
  const authorization = createAuthorization(
    "GET",
    "/v2/assets/withdraw?page=1&limit=10",
    "",
    timestamp
  );

  const headers = {
    "X-COINEX-KEY": process.env.ACCESS_EX_ID,
    "X-COINEX-SIGN": authorization,
    "X-COINEX-TIMESTAMP": timestamp,
  };

  try {
    const res = await axios2.get("/v2/assets/withdraw?page=1&limit=10", {
      headers,
    });
    console.log("account info:\n", JSON.stringify(res.data, null, 2));
    return res.data;
  } catch (error) {
    console.error("Error fetching data from APIs:", error);
    throw error;
  }
}

export async function GET(req: any, res: any) {
  try {
    const results = await getSpotBalance();

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error fetching data from APIs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
