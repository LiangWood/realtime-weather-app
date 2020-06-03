import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const fetchWeatherForecast = cityName => {
    return axios
        .get(
            `https://opendata.cwb.gov.tw/api/v1/rest/datastore/F-C0032-001?Authorization=CWB-F03D36AD-3066-4740-98F2-1046B982684C&locationName=${cityName}`
        )
        .then(res => {
            const { data } = res;
            const locationData = data.records.location[0];
            const weatherElements = locationData.weatherElement.reduce(
                (neededElements, item) => {
                    if (["Wx", "PoP", "CI"].includes(item.elementName)) {
                        neededElements[item.elementName] =
                            item.time[0].parameter;
                    }
                    return neededElements;
                },
                {}
            );

            return {
                description: weatherElements.Wx.parameterName,
                weatherCode: weatherElements.Wx.parameterValue,
                rainPossibility: weatherElements.PoP.parameterName,
                comfortability: weatherElements.CI.parameterName
            };
        });
};

const fetchCurrentWeather = locationName => {
    return axios
        .get(
            `https://opendata.cwb.gov.tw/api/v1/rest/datastore/O-A0003-001?Authorization=CWB-F03D36AD-3066-4740-98F2-1046B982684C&locationName=${locationName}`
        )
        .then(res => {
            // console.log(res.data);

            const { data } = res;
            // STEP 1：定義 `locationData` 把回傳的資料中會用到的部分取出來
            const locationData = data.records.location[0];

            // STEP 2：將風速（WDSD）、氣溫（TEMP）和濕度（HUMD）的資料取出
            const weatherElements = locationData.weatherElement.reduce(
                (neededElements, item) => {
                    if (["WDSD", "TEMP", "HUMD"].includes(item.elementName)) {
                        neededElements[item.elementName] = item.elementValue;
                    }
                    return neededElements;
                },
                {}
            );

            return {
                observationTime: locationData.time.obsTime,
                locationName: locationData.locationName,
                description: "多雲時晴",
                temperature: weatherElements.TEMP,
                windSpeed: weatherElements.WDSD,
                humid: weatherElements.HUMD
            };
        });
};

const useWeatherApi = ({ locationName, cityName }) => {
    const [weatherElement, setWeatherElement] = useState({
        observationTime: new Date(),
        locationName: "",
        humid: 0,
        temperature: 0,
        windSpeed: 0,
        description: "",
        weatherCode: 0,
        rainPossibility: 0,
        comfortability: "",
        isLoading: true
    });

    const fetchData = useCallback(() => {
        const fetchingData = async () => {
            const [CurrentWeather, weatherForecast] = await Promise.all([
                fetchCurrentWeather(locationName),
                fetchWeatherForecast(cityName)
            ]);

            setWeatherElement({
                ...CurrentWeather,
                ...weatherForecast,
                isLoading: false
            });
        };

        setWeatherElement(preState => ({
            ...preState,
            isLoading: true
        }));

        fetchingData();
    }, [locationName, cityName]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return [weatherElement, fetchData];
};

export default useWeatherApi;
