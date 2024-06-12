import React, { useState, useEffect } from "react";

const FrameJupiter: React.FC = () => {
  const [idsCoin, setIdsCoin] = useState<string | null>(
    localStorage.getItem("idsCoin")
  );

  // Update state when localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      setIdsCoin(localStorage.getItem("idsCoin"));
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // This effect sets up interval for checking localStorage change every 1 second
  useEffect(() => {
    const interval = setInterval(() => {
      const newData = localStorage.getItem("idsCoin");
      if (newData !== idsCoin) {
        setIdsCoin(newData);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [idsCoin]);

  return (
    <div className="card card-compact w-full bg-base-100 shadow-xl">
      <div className="card-body">
        <div className="overflow-x-auto">
          <iframe
            className="scale-100"
            src={`https://jup.ag/swap/${idsCoin}-USDT`}
            width="100%"
            height="700px"
          ></iframe>
        </div>
      </div>
    </div>
  );
};

export default FrameJupiter;
