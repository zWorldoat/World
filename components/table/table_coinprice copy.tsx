import useData from "@/hooks/useData";
import axios from "axios";
import React, { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function CalProfitEX(asks, withdrawalFee, budget, DefiPrice) {
  const defaultBudget = budget;
  let cointotal = 0;
  let ratetotal = 0;

  for (let i = 0; i < asks.length; i++) {
    const a = asks[i][0] * asks[i][1];
    budget -= a;

    if (budget <= 0) {
      ratetotal = asks[i][0];
      cointotal = defaultBudget / ratetotal;
      cointotal -= withdrawalFee;
      break;
    }
  }

  const isProfit = cointotal * DefiPrice;

  return {
    RatePrice: ratetotal,
    ConvertPrice: cointotal.toFixed(0),
    isProfit: isProfit.toFixed(2),
  };
}

async function setOrder(coinName, isUSDT) {
  const response = await axios.get(`/api/order/${coinName + "USDT"}/${isUSDT}`);
  console.log(response.data.message);

  if (response.data.message === "OK") {
    toast.success("Order: " + response.data.message, {
      position: "bottom-center",
    });
    const responsewd = await axios.get(`/api/openWithdraw?ccy=${coinName}`);
    if (responsewd.data.message === "OK") {
      toast.success("Withdraw: " + responsewd.data.message, {
        position: "bottom-center",
      });
    } else {
      toast.error("Withdraw: " + responsewd.data.message, {
        position: "bottom-center",
      });
    }
  } else {
    toast.error("Order: " + response.data.message, {
      position: "bottom-center",
    });
  }
}

function CalProfitDefi(bids, budget, priceDefi) {
  const defaultBudget = budget;
  let DefiCoin = 0;
  let Exrateprice = 0;

  for (let i = 0; i < bids.length; i++) {
    const a = bids[i][0] * bids[i][1];
    DefiCoin += a;

    if (DefiCoin >= budget) {
      Exrateprice = bids[i][0];
      break;
    }
  }

  const cointotal = budget / priceDefi;
  const isProfitDF = cointotal * Exrateprice;

  return {
    RatePrice: Exrateprice,
    ConvertPrice: cointotal.toFixed(0),
    isProfit: isProfitDF.toFixed(2),
  };
}

const TbCoinCompare = () => {
  const { data, isLoading, isError } = useData("/api/getcoin");
  const [budget, setBudget] = useState(0);

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error loading data</div>;

  // Filter for coins with a price greater than 25
  const filteredData = data.filter(
    (item) => item.price && Object.values(item.price)[0].price > 0
  );

  // Split data into two groups: one with 50 or fewer items, and one with the rest
  const under50 = filteredData.slice(0, 50);
  const over50 = filteredData.slice(50);

  return (
    <div className="card card-compact w-full bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title flex space-x-4">
          Coin Compare
          <div className="join join-vertical lg:join-horizontal">
            {[50, 100, 200, 300, 400, 500, 600, 1000].map((amount) => (
              <button
                key={amount}
                className="btn join-item btn-sm"
                onClick={() => setBudget(amount)}
                style={{
                  backgroundColor: "blue",
                  color: "white",
                  border: "1.5px solid black",
                }}
              >
                {amount}
              </button>
            ))}
            <div style={{ backgroundColor: "Black", color: "white" }}>
              {budget + " "}USDT
            </div>
          </div>
        </h2>

        {/* Flex container for side-by-side tables */}
        <div className="flex space-x-4 overflow-x-auto">
          {/* Table for 50 coins or fewer */}
          <table className="table table-xs">
            <thead>
              <tr>
                <th
                  style={{
                    backgroundColor: "blue",
                    color: "white",
                    border: "1.5px solid black",
                    width: "3px",
                  }}
                >
                  Coin
                </th>
                <th
                  style={{
                    backgroundColor: "blue",
                    color: "white",
                    border: "1.5px solid black",
                    width: "3px",
                  }}
                >
                  Price EX
                </th>
                <th
                  style={{
                    backgroundColor: "blue",
                    color: "white",
                    border: "1.5px solid black",
                    width: "3px",
                  }}
                >
                  Price Defi
                </th>

                <th
                  style={{
                    backgroundColor: "blue",
                    color: "white",
                    border: "1.5px solid black",
                    width: "3px",
                  }}
                >
                  Buy EX
                </th>
                <th
                  style={{
                    backgroundColor: "blue",
                    color: "white",
                    border: "1.5px solid black",
                    width: "3px",
                  }}
                >
                  Buy Defi
                </th>
              </tr>
            </thead>
            <tbody>
              {under50.map((item, index) => {
                let df_price = { id: "0", price: 0 };
                let EX_to_Defi = { isProfit: 0 }; // Default values
                let Defi_to_EX = { isProfit: 0 }; // Default values

                try {
                  df_price = Object.values(item.price)[0];
                } catch (error) {
                  console.error("Error fetching price:", error);
                }

                if (item.depth && item.depth.asks) {
                  EX_to_Defi = CalProfitEX(
                    item.depth.asks,
                    item.chains.withdrawal_fee,
                    budget,
                    df_price.price
                  );
                }

                if (item.depth && item.depth.bids) {
                  Defi_to_EX = CalProfitDefi(
                    item.depth.bids,
                    budget,
                    df_price.price
                  );
                }

                return (
                  <tr key={index}>
                    <td>{item.name}</td>
                    <td>{EX_to_Defi?.RatePrice}</td>
                    <td>{df_price.price}</td>

                    <td>{EX_to_Defi?.isProfit}</td>
                    <td>{Defi_to_EX.isProfit}</td>
                    <td>
                      <div className="join">
                        <button
                          className="btn join-item btn-xs btn-success"
                          disabled={!item.assetConfig.withdraw_enabled}
                          onClick={() => setOrder(item.name, budget)}
                        >
                          Buy
                        </button>
                        <button
                          className="btn join-item btn-xs btn-error"
                          disabled={!item.assetConfig.deposit_enabled}
                          onClick={() =>
                            window.open(
                              `https://jup.ag/swap/USDT-${df_price.id}`,
                              "_blank"
                            )
                          }
                        >
                          Send
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Table for more than 50 coins */}
          {over50.length > 0 && (
            <table className="table table-xs">
              <thead>
                <tr>
                  <th
                    style={{
                      backgroundColor: "blue",
                      color: "white",
                      border: "1.5px solid black",
                      width: "3px",
                    }}
                  >
                    Coin
                  </th>
                  <th
                    style={{
                      backgroundColor: "blue",
                      color: "white",
                      border: "1.5px solid black",
                      width: "3px",
                    }}
                  >
                    Price EX
                  </th>
                  <th
                    style={{
                      backgroundColor: "blue",
                      color: "white",
                      border: "1.5px solid black",
                      width: "3px",
                    }}
                  >
                    Price Defi
                  </th>

                  <th
                    style={{
                      backgroundColor: "blue",
                      color: "white",
                      border: "1.5px solid black",
                      width: "3px",
                    }}
                  >
                    Buy EX
                  </th>
                  <th
                    style={{
                      backgroundColor: "blue",
                      color: "white",
                      border: "1.5px solid black",
                      width: "3px",
                    }}
                  >
                    Buy Defi
                  </th>
                </tr>
              </thead>
              <tbody>
                {over50.map((item, index) => {
                  let df_price = { id: "0", price: 0 };
                  let EX_to_Defi = { isProfit: 0 }; // Default values
                  let Defi_to_EX = { isProfit: 0 }; // Default values

                  try {
                    df_price = Object.values(item.price)[0];
                  } catch (error) {
                    console.error("Error fetching price:", error);
                  }

                  if (item.depth && item.depth.asks) {
                    EX_to_Defi = CalProfitEX(
                      item.depth.asks,
                      item.chains.withdrawal_fee,
                      budget,
                      df_price.price
                    );
                  }

                  if (item.depth && item.depth.bids) {
                    Defi_to_EX = CalProfitDefi(
                      item.depth.bids,
                      budget,
                      df_price.price
                    );
                  }
                  const perEX = Number(EX_to_Defi.isProfit) - budget;

                  const perDF = Number(Defi_to_EX.isProfit) - budget;
                  return (
                    <tr key={index}>
                      <td>{item.name}</td>
                    <td >{EX_to_Defi?.RatePrice}</td>

                    <td >{df_price.price}</td>

                    <td className={perEX >= 2 ? "bg-lime-700" : "bg-violet-900"}>

                      {EX_to_Defi?.isProfit}

                    </td>

                    <td  className={perDF >= 2 ? "bg-lime-700" : "bg-violet-900"}>

                      {Defi_to_EX.isProfit}

                    </td>
                      {/* <td>{EX_to_Defi?.isProfit}</td>
                      <td>{Defi_to_EX.isProfit}</td> */}
                      <td>
                        <div className="join">
                          <button
                            className="btn join-item btn-xs btn-success"
                            disabled={!item.assetConfig.withdraw_enabled}
                            onClick={() => setOrder(item.name, budget)}
                          >
                            Buy
                          </button>
                          <button
                            className="btn join-item btn-xs btn-error"
                            disabled={!item.assetConfig.deposit_enabled}
                            onClick={() =>
                              window.open(
                                `https://jup.ag/swap/USDT-${df_price.id}`,
                                "_blank"
                              )
                            }
                          >
                            Send
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default TbCoinCompare;
