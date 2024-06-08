"use client";

import Image from "next/image";
import Header from "@/components/Header/header";
import TbCoinCompare from "@/components/table/table_coinprice";
import useData from "@/hooks/useData";

export default function Home() {
  return (
    <main className="flex  p-5 space-x-4">
      <div className="w-2/3 h-screen ">
        <TbCoinCompare />
      </div>
      <div className="w-1/3 space-y-4">
        <div className="w-full h-1/2 ">dase</div>
        <div className="w-full h-1/2 ">asdas</div>
      </div>
    </main>
  );
}
