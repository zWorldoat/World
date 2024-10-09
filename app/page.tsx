"use client";
import React from "react";
import TbCoinCompare from "@/components/table/table_coinprice";
import FrameJupiter from "@/components/table/jupframe";
// import FrameSolscan from "@/components/table/solscan";
// import FrameSolscan_copy from "@/components/table/solscan copy";

export default function Home() {
  return (
    <main className="flex p-12 space-x-6">
    <div className="h-screen flex items-center justify-center w-full">
        <TbCoinCompare />
    </div>



      {/* <div className="w-1/3 ">
        {" "}
        <FrameJupiter />
        {/* <FrameSolscan />
        <FrameSolscan_copy /> */}
      {/* </div> */} 
    </main>
  );
}
