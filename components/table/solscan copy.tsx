// import React, { useState, useEffect } from "react";

// const FrameJupiter: React.FC = () => {
//   const [idsCoin, setIdsCoin] = useState<string | null>(null);

//   useEffect(() => {
//     // Check if window is defined (ensure this code runs only on the client side)
//     if (typeof window !== "undefined") {
//       setIdsCoin(localStorage.getItem("idsCoin"));

//       const handleStorageChange = () => {
//         setIdsCoin(localStorage.getItem("idsCoin"));
//       };

//       window.addEventListener("storage", handleStorageChange);

//       return () => {
//         window.removeEventListener("storage", handleStorageChange);
//       };
//     }
//   }, []);

//   useEffect(() => {
//     if (typeof window !== "undefined") {
//       const interval = setInterval(() => {
//         const newData = window.localStorage.getItem("idsCoin");
//         if (newData !== idsCoin) {
//           setIdsCoin(newData);
//         }
//       }, 5000);

//       return () => clearInterval(interval);
//     }
//   }, [idsCoin]);

//   return (
//     <div className="card card-compact w-full bg-base-100 shadow-xl">
//       <div className="card-body">
//         <div className="overflow-x-auto">
//           <iframe
//             className="scale-100"
//             src={`https://jup.ag/swap/${idsCoin || "default"}-USDT`}
//             width="100%"
//             height="1000px"
//           ></iframe>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default FrameJupiter;
