"use client";
import React from "react";
import TbCoinCompare from "@/components/table/table_coinprice";
import FrameJupiter from "@/components/table/jupframe";
import FrameSolscan from "@/components/table/solscan";

export default function Home() {
  return (
    <main className="flex  p-5 space-x-4">
      <div className="w-2/3 h-screen ">
        <TbCoinCompare />
      </div>
      <div className="w-1/3 ">
        {" "}
        <FrameJupiter />
        <FrameSolscan />
      </div>
    </main>
  );
}
