import React, { useEffect, useState } from "react";
import DeckGL from "@deck.gl/react/typed";
import { MapView } from "@deck.gl/core/typed";
import { TileLayer } from "@deck.gl/geo-layers/typed";
import { BitmapLayer, PathLayer } from "@deck.gl/layers/typed";
import { ScatterplotLayer, TextLayer } from "@deck.gl/layers/typed";
import { AppProps, AirQualityData, AirQualityResult } from "../types";
import { IoCloseCircleOutline } from "react-icons/io5";

import "../global.scss";

const INITIAL_VIEW_STATE = {
  latitude: 46.0972,
  longitude: 19.6691,
  zoom: 12.4,
  maxZoom: 20,
  maxPitch: 89,
  bearing: 0,
};

const devicePixelRatio =
  (typeof window !== "undefined" && window.devicePixelRatio) || 1;

function getTooltip(info: any): string | null {
  if (
    info.object &&
    info.object.index &&
    typeof info.object.index.x !== "undefined"
  ) {
    const { x, y, z } = info.object.index;
    return `tile: x: ${x}, y: ${y}, z: ${z}`;
  }
  return null;
}

export default function App({
  showBorder = false,
  onTilesLoad,
  airDat,
}: AppProps) {
  const tileLayer = new TileLayer({
    data: [
      "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
      "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
      "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
    ],
    maxRequests: 20,
    pickable: true,
    onViewportLoad: onTilesLoad,
    autoHighlight: showBorder,
    highlightColor: [60, 60, 60, 40],
    minZoom: 0,
    maxZoom: 19,
    tileSize: 256,
    zoomOffset: devicePixelRatio === 1 ? -1 : 0,
    renderSubLayers: (props: any) => {
      const {
        bbox: { west, south, east, north },
      } = props.tile;

      return [
        new BitmapLayer(props, {
          data: undefined,
          image: props.data,
          bounds: [west, south, east, north],
        }),
        showBorder &&
          new PathLayer({
            id: `${props.id}-border`,
            data: [
              [
                [west, north],
                [west, south],
                [east, south],
                [east, north],
                [west, north],
              ],
            ],
            getPath: (d: any) => d,
            getColor: [255, 0, 0],
            widthMinPixels: 4,
          }),
      ];
    },
  });
  const [layers, setLayers] = useState([]);
  const [textLayers, setTextLayers] = useState([]);
  const [bigLayers, setBigLayers] = useState([]);
  const [isShow, setIsShow] = useState(false);
  const [modalData, setModalData] = useState<any>([]);
  useEffect(() => {
    if (airDat) {
      const newLayers = airDat.map((dataItem: any, index: number) => {
        const latitude = dataItem.data1[0]?.latitude
          ? parseFloat(dataItem.data1[0].latitude)
          : 0;
        const longitude = dataItem.data1[0]?.longitude
          ? parseFloat(dataItem.data1[0].longitude)
          : 0;
        const pm25Conc = dataItem.data2[0]?.pm25_conc
          ? parseFloat(dataItem.data2[0].pm25_conc)
          : 0;
        const pm10Conc = dataItem.data2[0]?.pm10_conc
          ? parseFloat(dataItem.data2[0].pm10_conc)
          : 0;

        // Determine color based on air quality
        function interpolateColors(
          color1: any,
          color2: any,
          value: any,
          minValue: any,
          maxValue: any
        ) {
          if (value >= minValue && value <= maxValue) {
            const ratio = (value - minValue) / (maxValue - minValue);
            const result = [
              Math.round(color1[0] + ratio * (color2[0] - color1[0])),
              Math.round(color1[1] + ratio * (color2[1] - color1[1])),
              Math.round(color1[2] + ratio * (color2[2] - color1[2])),
            ];
            return result;
          }
          return null;
        }

        // Define color ranges
        const goodColor = [180, 208, 12]; // Green
        const mediumColor = [201, 94, 0]; // Yellow
        const badColor = [171, 7, 18]; // Red

        // Determine air quality color
        let color;
        if (pm25Conc > 15 || pm10Conc > 50) {
          // Bad air quality
          color = badColor;
        } else if (pm25Conc > 10 || pm10Conc > 25) {
          // Medium air quality
          color =
            interpolateColors(mediumColor, badColor, pm25Conc, 10, 15) ||
            interpolateColors(mediumColor, badColor, pm10Conc, 25, 50);
        } else {
          // Good air quality
          color =
            interpolateColors(goodColor, mediumColor, pm25Conc, 0, 10) ||
            interpolateColors(goodColor, mediumColor, pm10Conc, 0, 25);
        }
        const circleData = [
          {
            position: [longitude, latitude],
            radius: 220,
            color: color,
          },
        ];

        return new ScatterplotLayer({
          id: `circle-layer-${index}`,
          className: "circle-layer",
          data: circleData,
          getPosition: (d: any) => d.position,
          getRadius: (d: any) => d.radius,
          getFillColor: (d) => d.color,
          pickable: true,
          stroked: false,
          strokeColor: [0, 0, 0],
          onHover: ({ object, x, y }) => {
            if (object) {
              document.body.style.cursor = "pointer";
            } else {
              document.body.style.cursor = "auto";
            }
          },
          onClick: () => {
            setIsShow(true);
            setModalData(dataItem);
          },
        });
      });
      setLayers(newLayers);

      const newLayers3 = airDat.map((item: any, index: number) => {
        const latitude = item.data1[0]?.latitude
          ? parseFloat(item.data1[0].latitude)
          : 0;
        const longitude = item.data1[0]?.longitude
          ? parseFloat(item.data1[0].longitude)
          : 0;
        const pm25Conc = item.data2[0]?.pm25_conc
          ? parseFloat(item.data2[0].pm25_conc)
          : 0;
        const pm10Conc = item.data2[0]?.pm10_conc
          ? parseFloat(item.data2[0].pm10_conc)
          : 0;

        // Determine color based on air quality
        function interpolateColors(
          color1: any,
          color2: any,
          value: any,
          minValue: any,
          maxValue: any
        ) {
          if (value >= minValue && value <= maxValue) {
            const ratio = (value - minValue) / (maxValue - minValue);
            const result = [
              Math.round(color1[0] + ratio * (color2[0] - color1[0])),
              Math.round(color1[1] + ratio * (color2[1] - color1[1])),
              Math.round(color1[2] + ratio * (color2[2] - color1[2])),
            ];
            return result;
          }
          return null;
        }
        const goodColorStroke = [180, 208, 12]; // Green
        const mediumColorStroke = [201, 94, 0]; // Yellow
        const badColorStroke = [171, 7, 18]; //

        const goodColor = [210, 227, 109]; // Green
        const mediumColor = [246, 196, 137]; // Yellow
        const badColor = [242, 161, 147]; // Red

        let strokeColor;
        let color;
        if (pm25Conc > 15 || pm10Conc > 50) {
          strokeColor = badColorStroke;
          color = badColor;
        } else if (pm25Conc > 10 || pm10Conc > 25) {
          strokeColor =
            interpolateColors(
              mediumColorStroke,
              badColorStroke,
              pm25Conc,
              10,
              15
            ) ||
            interpolateColors(
              mediumColorStroke,
              badColorStroke,
              pm10Conc,
              25,
              50
            );
          color =
            interpolateColors(mediumColor, badColor, pm25Conc, 10, 15) ||
            interpolateColors(mediumColor, badColor, pm10Conc, 25, 50);
        } else {
          strokeColor =
            interpolateColors(
              goodColorStroke,
              mediumColorStroke,
              pm25Conc,
              0,
              10
            ) ||
            interpolateColors(
              goodColorStroke,
              mediumColorStroke,
              pm10Conc,
              0,
              25
            );
          color =
            interpolateColors(goodColor, mediumColor, pm25Conc, 0, 10) ||
            interpolateColors(goodColor, mediumColor, pm10Conc, 0, 25);
        }
        const circleData4 = [
          {
            position: [longitude, latitude],
            radius: 400,
            color: color,
            strokeColor: strokeColor,
          },
        ];

        return new ScatterplotLayer({
          id: `circle-layer2-${index}`,
          className: "circle-layer",
          data: circleData4,
          getPosition: (d: any) => d.position,
          getRadius: (d: any) => d.radius,
          getFillColor: (d) => d.color,
          getLineWidth: 10,
          getLineColor: (d) => d.strokeColor,
          pickable: true,
          stroked: true,
          strokeColor: [171, 7, 18],
          onHover: ({ object, x, y }) => {
            if (object) {
              document.body.style.cursor = "pointer";
            } else {
              document.body.style.cursor = "auto";
            }
          },
          onClick: () => {
            setIsShow(true);
            setModalData(item);
          },
        });
      });
      setBigLayers(newLayers3);

      const processedCoordinates = new Set();

      const newLayers2 = airDat.map((item: any, index: number) => {
        const latitude = item.data1[0]?.latitude
          ? parseFloat(item.data1[0].latitude)
          : 0;
        const longitude = item.data1[0]?.longitude
          ? parseFloat(item.data1[0].longitude)
          : 0;
        const pm25Conc = item.data2[0]?.pm25_conc
          ? parseFloat(item.data2[0].pm25_conc).toFixed()
          : 0;
        const pm10Conc = item.data2[0]?.pm10_conc
          ? parseFloat(item.data2[0].pm10_conc).toFixed()
          : 0;

        const position = [longitude, latitude];

        // Check if the coordinates are already processed
        if (processedCoordinates.has(position.toString())) {
          return null; // Skip this item
        }

        // Add the coordinates to the set to mark them as processed
        processedCoordinates.add(position.toString());

        const circleData2 = [
          {
            position: [longitude, latitude],
            radius: 300,
            label: pm25Conc, // Add the label text here
          },
        ];
        return new TextLayer({
          id: `text-layer-${index}`,
          data: circleData2,
          getPosition: (d) => d.position,
          getText: (d) => d.label.toString(),
          getSize: 22,
          getColor: [255, 255, 255],
        });
      });
      setTextLayers(newLayers2);
      setTextLayers(newLayers2.filter((layer: any) => layer !== null));
    }
  }, [airDat]);

  const formatDateFromNanos = (timestampNanos: number): string => {
    // Convert nanoseconds to milliseconds
    const timestampMillis = timestampNanos / 1e6;

    const daysOfWeek = [
      "Nedelja",
      "Ponedeljak",
      "Utorak",
      "Sreda",
      "Četvrtak",
      "Petak",
      "Subota",
    ];
    const months = [
      "Januar",
      "Februar",
      "Mart",
      "April",
      "Maj",
      "Jun",
      "Jul",
      "Avgust",
      "Septembar",
      "Oktobar",
      "Novembar",
      "Decembar",
    ];

    const date = new Date(timestampMillis);

    const dayOfWeek = daysOfWeek[date.getDay()];
    const dayOfMonth = date.getDate();
    const month = months[date.getMonth()];
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");

    // Format the date as needed
    return `${dayOfWeek}, ${dayOfMonth}. ${month} ${hours}:${minutes}`;
  };

  const formattedDate = formatDateFromNanos(
    isShow && modalData.data2[0]?.time ? modalData.data2[0]?.time : 0
  );

  return (
    <DeckGL
      layers={[tileLayer, ...bigLayers, ...layers, ...textLayers]}
      views={new MapView({ repeat: true, controller: true })}
      initialViewState={INITIAL_VIEW_STATE}
      getTooltip={getTooltip}
    >
      {isShow && (
        <div className="modal-wrapper">
          <div className="modal">
            {modalData && (
              <>
                <div className="exit-modal" onClick={() => setIsShow(false)}>
                  <IoCloseCircleOutline style={{ cursor: "pointer" }} />
                </div>
                <div className="modal-content">
                  <h1>{modalData.name}</h1>
                  <h2>Subotica</h2>
                  <h3>
                    Očitano: {modalData.data2[0]?.time ? formattedDate : 0}
                  </h3>
                  <div className="modal-content-div">
                    <h4>PM2.5</h4>
                    <p>
                      {modalData.data2[0]?.pm25_conc
                        ? parseFloat(modalData.data2[0].pm25_conc).toFixed(0)
                        : 0}
                    </p>
                    <span>µg/m³</span>
                    <p>
                      {modalData.data2[0]?.pm25_conc
                        ? parseFloat(modalData.data2[0].pm25_conc).toFixed(0)
                        : 0}
                    </p>
                    <span>US AQI</span>
                  </div>
                  <div className="modal-content-div">
                    <h4>PM1</h4>
                    <p>
                      {modalData.data2[0]?.pm1_conc
                        ? parseFloat(modalData.data2[0].pm1_conc).toFixed(0)
                        : 0}
                    </p>
                    <span>µg/m³</span>
                  </div>
                  <div className="modal-content-div">
                    <h4>PM10</h4>
                    <p>
                      {modalData.data2[0]?.pm10_conc
                        ? parseFloat(modalData.data2[0].pm10_conc).toFixed(0)
                        : 0}
                    </p>
                    <span>µg/m³</span>
                  </div>
                  <div className="modal-content-div">
                    <h4>Pritisak</h4>
                    <span>
                      <p>
                        {modalData.data2[0]?.pr
                          ? parseFloat(modalData.data2[0].pr).toFixed()
                          : 0}
                      </p>
                      <p>Pa</p>
                    </span>
                  </div>
                  <div className="modal-content-div">
                    <h4>Temperatura</h4>
                    <span>
                      <p>
                        {modalData.data2[0]?.tp
                          ? parseFloat(modalData.data2[0].tp).toFixed()
                          : 0}
                      </p>
                      <p>°C</p>
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </DeckGL>
  );
}
