# CURRENT CONDITIONS PAGE

This page is intended to be read by the developers of WeatherHub, for notices and important stuff on the data being fetched and stuff.

## API USAGE

The following API's were used in the making of this page, their documentation's have been linked as well.

- The Weather Company

**Documentation #1**: https://developer.weather.com/
**Documentation #2**: https://www.ibm.com/docs/en/environmental-intel-suite?topic=reference-weather-data-apis

- Open-Meteo
**Documentation**: https://open-meteo.com/

- National Weather Service
**Documentation**: https://www.weather.gov/documentation/services-web-API


## TWC API

This API is used for current weather data and weather forecasts.

*A lot of data is returned from this API, so I won't include an example response here, but feel free to test out this API*: https://api.weather.com/v3/aggcommon/v3-wx-forecast-daily-7day;v3-wx-observations-current?geocode=30.63241,-87.03969&format=json&language=en-US&units=e&apiKey=yourApiKey

This API Response is for Milton, Florida.

"aggcommon" (*Aggergate Common*) is a parameter in the API where you can select more than one variable that the API offers. They offer an interesting documentation here: https://developer.weather.com/docs/api-aggregation

Additionally, you can grab multiple locations with this as well, for example:
https://api.weather.com/v3/aggcommon/v2fcstdaily3;v2obs;v3-location-point?geocodes=34.44,-83.00;41.40,-38.19&language=en-US&units=e&format=json&apiKey= 

This returns multiple data strings for multiple locations.

## Open-Meteo

This API is used for search/location data. I also plan to intergrate this API for weather forecasts, should the TWC API fail.