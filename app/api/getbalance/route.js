import axios from "axios";
import { NextResponse } from "next/server";
import sha256 from "crypto-js/sha256";
import { enc } from "crypto-js";

// Function to create the authorization header
function createAuthorization(method, request_path, body_json, timestamp) {
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
    "X-COINEX-KEY": process.env.ACCESS_ID,
    "X-COINEX-SIGN": authorization,
    "X-COINEX-TIMESTAMP": timestamp,
  };

  try {
    const res = await axios2.get("/v2/assets/spot/balance", { headers });
    console.log("account info:\n", JSON.stringify(res.data, null, 2));
    return res.data;
  } catch (error) {
    console.error("Error fetching data from APIs:", error);
    throw error; // Rethrow the error to be handled by the caller
  }
}

export async function GET(req, res) {
  try {
    // Fetch data for spot balance
    const results = await getSpotBalance();

    // Send response with the fetched data
    return NextResponse.json(results);
  } catch (error) {
    console.error("Error fetching data from APIs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
