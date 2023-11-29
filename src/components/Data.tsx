import React, { useEffect, useState } from "react";
import Map from "./Map";

const Data = () => {
  const [airData, setAirData] = useState(null);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://localhost:3001/api/randomData");
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const data = await response.json();
        setAirData(data);
        // console.log(data[0].latitude);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);
  // data
  return (
    <div>
      <Map airDat={airData} />
    </div>
  );
};

export default Data;
