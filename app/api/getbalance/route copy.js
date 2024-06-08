import axios from "axios";
import { NextResponse } from "next/server";
import sha256 from "crypto-js/sha256";
import { enc } from "crypto-js";

// Function to fetch data for a coin
async function fetchCoinData() {
  const apiUrl = "https://api.coinex.com/v2/time";

  try {
    const response = await axios.get(apiUrl);
    const dummyData = response.data.data;
    if (!dummyData || typeof dummyData.timestamp === "undefined") {
      throw new Error("Timestamp not found in response data");
    }

    const timestamp = dummyData.timestamp.toString();

    const prepared_str =
      "GET" + "/v2/assets/spot/balance" + timestamp + process.env.SECRET_KEY;

    const signed_str = sha256(prepared_str).toString(enc.Hex).toLowerCase();

    const instance = axios.create({
      baseURL: "https://api.coinex.com",
      headers: {
        "X-COINEX-KEY": process.env.ACCESS_ID,
        "X-COINEX-SIGN": signed_str,
        "X-COINEX-TIMESTAMP": timestamp,
      },
    });
    const instanceResponse = await instance.get("/v2/assets/spot/balance");

    console.log(instanceResponse.data);
    return {
      balance: instanceResponse.data,
    };
  } catch (error) {
    return null;
  }
}

export async function GET(req, res) {
  try {
    // Your logic for handling GET requests

    // Fetch data for each coin concurrently
    const results = await fetchCoinData();

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
