import useData from "@/hooks/useData";
import React, { useState, useEffect } from "react";

function CalProfitEX(
  asks: any,
  withdrawalFee: number,
  budget: number,
  DefiPrice: number
) {
  const defaultBudget = budget;
  let cointotal = 0;
  let ratetotal = 0;
  let isProfit = 0;

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
  isProfit = cointotal * DefiPrice;

  return {
    RatePrice: ratetotal,
    ConvertPrice: cointotal.toFixed(0),
    isProfit: isProfit.toFixed(2),
  };
}

function CalProfitDefi(bids: any, budget: number, priceDefi: number) {
  const defaultBudget = budget;
  let DefiCoin: number = 0;
  let Exrateprice: number = 0;
  let isProfitDF = 0;

  for (let i = 0; i < bids.length; i++) {
    const a = bids[i][0] * bids[i][1];
    DefiCoin += a;

    if (DefiCoin >= budget) {
      Exrateprice = bids[i][0];
      break;
    }
  }

  const cointotal = budget / priceDefi;
  isProfitDF = cointotal * Exrateprice;
  //console.log(isProfitDF, cointotal, Exrateprice, priceDefi);
  return {
    RatePrice: Exrateprice,
    ConvertPrice: cointotal.toFixed(0),
    isProfit: isProfitDF.toFixed(2),
  };
}

const TbCoinCompare: React.FC = () => {
  const { data, isLoading, isError } = useData("/api/getcoin");
  const [budget, setBudget] = useState(0);

  if (isLoading) return <div>Loading...</div>;

  if (isError) return <div>Error loading data</div>;

  return (
    <div className="card card-compact w-full bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title flex space-x-4">
          Coin Compare
          <div className="join join-vertical lg:join-horizontal">
            <button
              className="btn join-item btn-sm"
              onClick={() => setBudget(100)}
            >
              100
            </button>
            <button
              className="btn join-item btn-sm"
              onClick={() => setBudget(200)}
            >
              200
            </button>
            <button
              className="btn join-item btn-sm"
              onClick={() => setBudget(300)}
            >
              300
            </button>
            <button
              className="btn join-item btn-sm"
              onClick={() => setBudget(400)}
            >
              400
            </button>
            <button
              className="btn join-item btn-sm"
              onClick={() => setBudget(500)}
            >
              500
            </button>
            <button
              className="btn join-item btn-sm"
              onClick={() => setBudget(1000)}
            >
              1000
            </button>
          </div>
          <div>{budget + " "}USDT</div>
        </h2>

        <div className="overflow-x-auto">
          <table className="table table-xs">
            <thead>
              <tr>
                <th>Coin</th>
                <th>Price Defi</th>
                <th>Price EX</th>
                <th>Buy EX</th>
                <th>Buy Defi</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item: any, index: any) => {
                const df_price = Object.values(item.price)[0] as {
                  price: number;
                };
                const EX_to_Defi = CalProfitEX(
                  item.depth.asks,
                  item.chains.withdrawal_fee,
                  budget,
                  df_price.price
                );
                const Defi_to_EX = CalProfitDefi(
                  item.depth.bids,
                  budget,
                  df_price.price
                );

                const perEX = Number(EX_to_Defi.isProfit) - budget;
                const perDF = Number(Defi_to_EX.isProfit) - budget;
                return (
                  <tr key={index}>
                    <td>{item.name}</td>
                    <td>{df_price.price}</td>
                    <td>{EX_to_Defi?.RatePrice}</td>
                    <td className={perEX > 5 ? "bg-lime-500" : "bg-red-500"}>
                      {EX_to_Defi?.isProfit}
                    </td>
                    <td className={perDF > 5 ? "bg-lime-500" : "bg-red-500"}>
                      {Defi_to_EX.isProfit}
                    </td>
                    <td>
                      <div className="join">
                        <button
                          className="btn join-item btn-xs btn-success"
                          disabled={!item.assetConfig.withdraw_enabled}
                          // onClick={() => testclick(params2)}
                        >
                          Buy
                        </button>
                        <button
                          className="btn join-item btn-xs btn-error"
                          disabled={!item.assetConfig.deposit_enabled}
                          // onClick={() => handleButtonClick(coinaddress)}
                        >
                          Sell
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TbCoinCompare;
