export interface AppProps {
  showBorder?: boolean;
  onTilesLoad?: () => void;
  airDat: any;
}
export interface AirQualityData {
  pm25Concentration: any;
  pm10Concentration: any;
}

export interface AirQualityResult {
  pm25Aqi: number;
  pm10Aqi: number;
}
