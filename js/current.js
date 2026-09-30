
// VARIABLES
const twcKey = "8de2d8b3a93542c9a2d8b3a935a2c909";
const aerisKey = "wgE96YE3scTQLKjnqiMsv"
const aerisSecret = "SVG2gQFV8y9DjKR0BRY9wPoSLvrMrIqF9Lq2IYaY";
const defaultUnit = "e" // Imperial
const defaultLang = "en-US"; // English
const savedUnit = localStorage.getItem("weatherUnit");
let unit = savedUnit === "m" ? "m" : defaultUnit;
const now = new Date();
const nowUnix = Math.floor(Date.now / 1000);
// Math.floor(Date.now() / 1000);

// Audio Files
const secondTick = new Audio("../assets/audio/current/second.mp3");
const minuteTick = new Audio("../assets/audio/current/minute.mp3");
const hourTick = new Audio("../assets/audio/current/hour.mp3");

// Elements

// Card Items
const temperatureEl = document.getElementById("temperature");
const iconEl = document.getElementById("weatherIcon");
const weatherCondEl = document.getElementById("weatherCond");
const fltemp = document.getElementById("feels-like-temperature");
const dpEl = document.getElementById("dewpoint");
const humidityEl = document.getElementById("humidity");
const windSpdEl = document.getElementById("wind-spd");
const windGstEl = document.getElementById("wind-gst");
const windDirEl = document.getElementById("wind-dir");
const pressureEl = document.getElementById("pressure");
const uvEl = document.getElementById("uv-index");
const sunriseEl = document.getElementById("sunrise");
const sunsetEl = document.getElementById("sunset");
const dayLengthEl = document.getElementById("dayLengthVal")
const tempFeelEl = document.getElementById("tempFeel");

const locationEl = document.getElementById("locationName");
const radarImgEl = document.getElementById("radarImage")
const unitOptions = document.querySelectorAll(".unit-option");

const timeEl = document.getElementById("currentTime");

// Time Slider for the radar card

const timeSliderEl = document.getElementById("timeSlider");
const timeSliderValueEl = document.getElementById("timeSliderVal");


// Alert Section
const alertSectionEl = document.getElementById("alertContainer")
const alertTextEl = document.getElementById("alertText");

// Nearest Observations Card

const nearObsCard = document.querySelector(".nearby-obs-rows");
const nearestCities = document.querySelectorAll(".nearby-city");
const nearestTemps = document.querySelectorAll(".nearby-temp");
const nearestIcons = document.querySelectorAll(".nearby-obs-icon");

// Air Quality card
const airQualityNum = document.getElementById("airQuality")
const airQualityCat = document.getElementById("airQualityCategory");
const airQualityAction = document.getElementById("airQualityAction");
const disclaimer = document.getElementById("disclaimer");

// The star indicator right next to the search input

const homeLocButton = document.getElementById("favLocation");
const homeLocIcon = document.getElementById("favorite-icon");

const airQualityCard = document.getElementById("airQualityCard");

let timeBack = null;

const temperatureFeelScale = [
    { minimumCelsius: -Infinity, label: "Cold", color: "--temperature-cold" },
    { minimumCelsius: 0, label: "Cool", color: "--temperature-cool" },
    { minimumCelsius: 10, label: "Neat", color: "--temperature-netural" },
    { minimumCelsius: 18, label: "Pleasant", color: "--temperature-pleasant" },
    { minimumCelsius: 24, label: "Warm", color: "--temperature-warm" },
    { minimumCelsius: 30, label: "Hot", color: "--temperature-hot" }
];


const locationSearchState = {
    results: [],
    requestId: 0,
    selectedLocation: null
};

const temperatureAnimations = new WeakMap();

let previousClockSecond = null;
let previousClockMinute = null;
let previousClockHour = null;
let clockInitialized = false;

function playClockSound(audio) {
    audio.currentTime = 0;
    audio.play().catch(() => { });
}

function updateTime() {
    const currentTime = new Date();
    const timeStr = currentTime.toLocaleString(defaultLang, { day: "numeric", month: "numeric", "year": "numeric", hour12: true, hour: "numeric", "minute": "numeric", "second": "2-digit" })
    timeEl.textContent = timeStr;

    const currentSecond = currentTime.getSeconds();
    const currentMinute = currentTime.getMinutes();
    const currentHour = currentTime.getHours();

    if (!clockInitialized) {
        playClockSound(secondTick);
        clockInitialized = true;
    } else {
        if (currentHour !== previousClockHour) {
            playClockSound(hourTick);
        } else if (currentMinute !== previousClockMinute) {
            playClockSound(minuteTick);
        } else if (currentSecond !== previousClockSecond) {
            playClockSound(secondTick);
        }
    }

    previousClockSecond = currentSecond;
    previousClockMinute = currentMinute;
    previousClockHour = currentHour;
}
updateTime()
setInterval(updateTime, 500);

function animateTemperature(element, targetTemperature, unitLabel) {
    if (!element || !Number.isFinite(targetTemperature)) {
        return;
    }

    const duration = 700;
    const startTime = performance.now();
    const currentValue = Number.parseFloat(element.textContent);
    const startingTemperature = Number.isFinite(currentValue) ? currentValue : 0;

    if (temperatureAnimations.has(element)) {
        cancelAnimationFrame(temperatureAnimations.get(element));
    }

    element.classList.remove("temperature-value-switching");
    void element.offsetWidth;
    element.classList.add("temperature-value-switching");

    function updateTemperature(currentTime) {
        const progress = Math.min((currentTime - startTime) / duration, 1);
        const easedProgress = 1 - Math.pow(1 - progress, 5);
        const currentTemperature = startingTemperature + (targetTemperature - startingTemperature) * easedProgress;
        const displayTemperature = Math.round(currentTemperature);

        element.textContent = `${displayTemperature}${unitLabel}`;

        if (progress < 1) {
            temperatureAnimations.set(element, requestAnimationFrame(updateTemperature));
        } else {
            temperatureAnimations.delete(element);
        }
    }

    temperatureAnimations.set(element, requestAnimationFrame(updateTemperature));
}

function temperatureFeel(value, sourceUnit = unit) {
    if (!tempFeelEl || !Number.isFinite(value)) {
        return;
    }

    const temperatureCelsius = sourceUnit === "e" ? (value - 32) * 5 / 9 : value;
    const feel = [...temperatureFeelScale]
        .reverse()
        .find(({ minimumCelsius }) => temperatureCelsius >= minimumCelsius);

    if (!feel) {
        return;
    }

    tempFeelEl.textContent = feel.label;
    tempFeelEl.style.color = `var(${feel.color})`;
}

function cardinalDirection(degrees) {
    if (!Number.isFinite(degrees)) {
        return "--";
    }

    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    return directions[Math.round(degrees / 45) % directions.length];
}

function displayObservation(element, value, suffix = "", decimals = 0) {
    if (element && Number.isFinite(value)) {
        element.textContent = `${value.toFixed(decimals)}${suffix}`;
    }
}

function getRadarUnixTimestamp(radarFrame) {
    if (radarFrame === "latest") {
        return Math.floor(Date.now() / 1000);
    }

    const frameMatch = String(radarFrame).match(/^-(\d+(?:\.\d+)?)(hour|hr|min)$/);

    if (!frameMatch) {
        return Math.floor(Date.now() / 1000);
    }

    const amount = Number(frameMatch[1]);
    const minutesAgo = frameMatch[2] === "min" ? amount : amount * 60;
    const frameTime = new Date(Date.now() - minutesAgo * 60 * 1000);

    return Math.floor(frameTime.getTime() / 1000);
}

function formatLocalTime(localTime) {
    const timeMatch = String(localTime).match(/T(\d{2}):(\d{2}).*([+-])(\d{2})(\d{2})$/);

    if (!timeMatch) {
        return "--";
    }

    const [, hour, minute, offsetSign, offsetHour, offsetMinute] = timeMatch;
    const formattedTime = new Intl.DateTimeFormat(defaultLang, {
        hour: "numeric",
        minute: "numeric",
        timeZone: "UTC"
    }).format(new Date(Date.UTC(2000, 0, 1, Number(hour), Number(minute))));
    const offset = `${offsetSign}${Number(offsetHour)}${Number(offsetMinute) ? `:${offsetMinute}` : ""}`;

    return `${formattedTime} GMT${offset}`;
}


async function currentConditionsData(latitude, longitude, selectedCountry, selectedCountryCode) {

    // use async promise to fetch data from both api.weather.com and open-meteo.


    const lastLat = localStorage.getItem("lat_last");
    const lastLon = localStorage.getItem("lon_last");
    const lastCity = localStorage.getItem("city");
    const lastCountry = localStorage.getItem("country");
    const lastCountryCode = localStorage.getItem("countryCode");

    const hasSavedLocation = lastLat !== null && lastLon !== null;

    const requestLat = hasSavedLocation ? lastLat : latitude;
    const requestLon = hasSavedLocation ? lastLon : longitude;

    if (requestLat == null || requestLon == null) {
        console.error("No weather location available.");
        return;
    } else {
        locationEl.textContent = `${lastCity}`;
    }

    const radarCountry = selectedCountry ?? lastCountry;
    const radarCountryCode = selectedCountryCode ?? lastCountryCode;
    loadRadar(requestLat, requestLon, radarCountry, radarCountryCode);

    const twcApi =
        `https://api.weather.com/v3/aggcommon/v3-wx-forecast-daily-7day;` +
        `v3-wx-observations-current?geocode=${requestLat},${requestLon}` +
        `&format=json&language=${defaultLang}&units=${unit}&apiKey=${twcKey}`;

    function matchUnits() {
        return unit === "e" ? "°F" : "°C";
    }
    const response = await fetch(twcApi)
    const data = await response.json()
    console.log(`✅ Data returned successfully`, data);

    forecast7day = data["v3-wx-forecast-daily-7day"]
    currentobservations = data["v3-wx-observations-current"];

    // Weather Variables

    const observationTime = new Date(currentobservations.validTimeLocal);
    const obsTimeFormatted = observationTime.toLocaleString(defaultLang, { day: "2-digit", month: "2-digit", "year": "numeric", "hour": "numeric", minute: "numeric", timeZoneName: "short" });
    console.log(obsTimeFormatted)
    temperature = currentobservations.temperature; // Returns a numeric value.
    iconCode = currentobservations.iconCode;
    weather = currentobservations.wxPhraseMedium ? currentobservations.wxPhraseMedium : currentobservations.wxPhraseLong; // Returns a text string, e.g. "Thunder in Vicinity." There is also wxPhraseShort and wxPhraseLong." README.md has a good documentation :)

    weatherCondEl.textContent = weather;

    const iconMap = mapIcons();
    const iconSource = iconMap[String(iconCode)] ?? iconMap["44"];

    if (iconEl && iconSource) {
        iconEl.src = iconSource;
    }

    animateTemperature(temperatureEl, temperature, matchUnits());
    const temperatureUnit = matchUnits();
    temperatureFeel(currentobservations.temperatureFeelsLike, unit);
    animateTemperature(fltemp, currentobservations.temperatureFeelsLike, temperatureUnit);
    displayObservation(humidityEl, currentobservations.relativeHumidity, "%");
    animateTemperature(dpEl, currentobservations.temperatureDewPoint, temperatureUnit);
    displayObservation(windSpdEl, currentobservations.windSpeed, unit === "e" ? " mph" : " km/h");
    displayObservation(windGstEl, currentobservations.windGust, unit === "e" ? " mph" : " km/h");

    const sunrise = formatLocalTime(currentobservations.sunriseTimeLocal);
    const sunset = formatLocalTime(currentobservations.sunsetTimeLocal);
    console.log(sunrise, sunset);

    const dayLengthMs = (currentobservations.sunsetTimeUtc - currentobservations.sunriseTimeUtc) * 1000;

    // Calculate hours and minutes
    const totalMinutes = Math.floor(dayLengthMs / 1000 / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;


    sunriseEl.textContent = sunrise;
    sunsetEl.textContent = sunset;
    dayLengthEl.textContent = `${hours >= 1 ? `${hours} hr ` : ''}${minutes} min`;


    uvValue = (currentobservations.uvIndex).toFixed(0);
    console.log(uvValue)
    if (windDirEl) {
        const windDirection = currentobservations.windDirection;
        windDirEl.textContent = Number.isFinite(windDirection)
            ? `${cardinalDirection(windDirection)} (${Math.round(windDirection)}°)`
            : "--";
    }
    displayObservation(pressureEl, currentobservations.pressureAltimeter, unit === "e" ? " in" : " mb", 2);
    uvEl.textContent = uvValue;

}
currentConditionsData();

async function GrabAlertData(latitude = null, longitude = null) {
    const savedLat = localStorage.getItem("lat_last");
    const savedLon = localStorage.getItem("lon_last");
    const requestLat = savedLat ?? latitude;
    const requestLon = savedLon ?? longitude;

    if (requestLat == null || requestLon == null) {
        console.error("No alert location available.");
        return null;
    }

    const alertUrl = `https://api.weather.com/v3/alerts/headlines?geocode=${requestLat},${requestLon}&format=json&language=${defaultLang}&apiKey=${twcKey}`;
    const response = await fetch(alertUrl);

    if (response.status === 204) {
        console.warn("No Alerts are active for this location. API (The Weather Channel) returned Error 204.");
        return;
    } else if (response.status === 404) {
        throw new Error("The alert data could not be retrieved. This is either a location error or the wrong API data being fetched. Contact jesselikeswx@outlook.com");
    } else if (!response.ok) {
        throw new Error(`Alert request failed with status ${response.status}`);
        return;
    }

    const data = await response.json();
    console.log(data);
    const alertCity = locationSearchState.selectedLocation?.name ??
        localStorage.getItem("city") ??
        "your area";

    const alertTimeZones = {
        AKDT: "America/Anchorage",
        AKST: "America/Anchorage",
        CDT: "America/Chicago",
        CST: "America/Chicago",
        EDT: "America/New_York",
        EST: "America/New_York",
        MDT: "America/Denver",
        MST: "America/Denver",
        PDT: "America/Los_Angeles",
        PST: "America/Los_Angeles",
        HST: "Pacific/Honolulu"
    };

    if (data.alerts && data.alerts.length > 0) {

        data.alerts.forEach((alert, index) => {
            const localTimeZone = alert.effectiveTimeLocalTimeZone;
            const timeZone = alertTimeZones[localTimeZone] ??
                (localTimeZone?.includes("/") ? localTimeZone : null);
            const issueTimeOptions = { timeZoneName: "short" };

            if (timeZone) {
                issueTimeOptions.timeZone = timeZone;
            }

            const issueTime = new Date(alert.issueTimeLocal).toLocaleString("en-US", issueTimeOptions);
            const expireDate = new Date(alert.expireTimeLocal);
            const expireTime = expireDate.toLocaleString("en-US", { timeStyle: "short" });


            const totalMinutes = Math.max(0, (expireDate.getTime() - now.getTime()) / 60000);

            const days = Math.floor(totalMinutes / 60 / 24);
            const hours = Math.floor((totalMinutes / 60) % 24);

            const minutes = Math.floor(totalMinutes % 60);

            console.log(hours);
            console.log(`Alert #${index + 1}: ${alert.eventDescription || 'Weather Alert'}`);
            console.log(`Issued Time: ${issueTime}`);

            const alertName = alert.eventDescription;

            alertSectionEl.style.display = "block"

            alertSectionEl.innerHTML = `
                        <div class="alert alert-danger">
                <div class="alert-row">

                    <i class="fa-solid fa-triangle-exclamation"></i>
                    <p class="alert-text" id="alertHeadlineText">${alertName} for ${alertCity} until
                        ${expireTime} <span>(${days > 0 ? `\ ${days} days ` : ''} ${hours > 0 ? `\ ${hours} hrs ` : ''}${minutes.toFixed(0)} mins left from now)</span></p>
                   <img onClick="closeAlert()" class="close-icon" src="../assets/icons/close.svg">

                </div>

                <p class="alert-link" id="alertLink">Click <a href="#">here </a>for more information.</p>

                </div>
            </div>`


        });

    } else {
        console.log("No active weather alerts found.");
    }

    return data; // Placed at the very end so all logs execute

}
GrabAlertData();

function closeAlert() {
    alertSectionEl.style.display = "none";
}

// Part of this code was sourced from: https://github.com/MistWeatherMedia/weatherscan-v2/blob/main/main/js/location.js.
// No License was given from MistWeatherMedia/weatherscan-v2
// This section also also mostly AI lol... except for the savedLat/savedLon section
async function getNearestObs() {
    const savedLat = localStorage.getItem("lat_last");
    const savedLon = localStorage.getItem("lon_last");
    const requestLat = savedLat;
    const requestLon = savedLon;

    if (requestLat == null || requestLon == null) {
        console.error("No location available for nearby observations.");
        return [];
    }

    const nearObsUrl = `https://api.weather.com/v3/location/near?geocode=${requestLat},${requestLon}&product=observation&format=json&apiKey=${twcKey}`;
    const response = await fetch(nearObsUrl);

    if (!response.ok) {
        throw new Error(`Nearby observations request failed with status ${response.status}`);
    }

    const data = await response.json();

    // Icon Map

    const iconMap = mapIcons()

    const latitudes = Array.isArray(data.latitude) ? data.latitude : data.location?.latitude;
    const longitudes = Array.isArray(data.longitude) ? data.longitude : data.location?.longitude;

    if (!Array.isArray(latitudes) || !Array.isArray(longitudes)) {
        console.error("Nearby observations response did not include latitude and longitude arrays.", data);
        return [];
    }


    const minimumDistanceMiles = 2.5;
    const maxNearbyCities = 10;
    const distanceMiles = Array.isArray(data.distanceMi)
        ? data.distanceMi.map((distance) => Number(distance))
        : Array.isArray(data.location?.distanceMi)
            ? data.location.distanceMi.map((distance) => Number(distance))
            : [];

    const coordinatePairs = latitudes
        .slice(0, 10)
        .map((latitude, index) => {
            return {
                latitude,
                longitude: longitudes[index],
                distanceMi: Number(distanceMiles[index] ?? Infinity)
            };
        });

    const uniqueCoordinatePairs = [];

    for (const pair of coordinatePairs) {
        const pairDistance = Number(pair.distanceMi);

        if (Number.isFinite(pairDistance) && pairDistance < minimumDistanceMiles) {
            continue;
        }

        const isTooCloseToSelectedCity = uniqueCoordinatePairs.some((existingPair) => {
            const existingDistance = Number(existingPair.distanceMi);
            return Number.isFinite(existingDistance) &&
                Number.isFinite(pairDistance) &&
                Math.abs(existingDistance - pairDistance) < minimumDistanceMiles;
        });

        if (isTooCloseToSelectedCity) {
            continue;
        }

        uniqueCoordinatePairs.push(pair);

        if (uniqueCoordinatePairs.length >= maxNearbyCities) {
            break;
        }
    }

    const cityNames = await Promise.all(uniqueCoordinatePairs.map(async ({ latitude, longitude }) => {
        const pointUrl = `https://api.weather.com/v3/location/point?geocode=${latitude},${longitude}&language=${defaultLang}&format=json&apiKey=${twcKey}`;

        try {
            const pointResponse = await fetch(pointUrl);

            if (!pointResponse.ok) {
                return null;
            }

            const pointData = await pointResponse.json();
            return pointData.location?.city ?? null;
        } catch (error) {
            console.error("Unable to load nearby city name.", error);
            return null;
        }
    }));

    if (uniqueCoordinatePairs.length === 0) {
        const rows = document.querySelectorAll(".nearby-observations-row");
        rows.forEach((row) => {
            row.querySelector(".nearby-city").textContent = "-";
            row.querySelector(".nearby-temp").textContent = "-";
            row.querySelector(".nearby-obs-icon").src = iconMap["44"];
        });
        return [];
    }

    const nearestCoordinates = uniqueCoordinatePairs
        .map(({ latitude, longitude }) => `${latitude},${longitude}`)
        .join(";");


    const twcCurrentObsApi = `https://api.weather.com/v3/aggcommon/v2obs?geocodes=${nearestCoordinates}&language=${defaultLang}&units=${unit}&format=json&apiKey=${twcKey}`;

    const response_obs = await fetch(twcCurrentObsApi);
    if (!response_obs.ok) {
        throw new Error(`Current observations request failed with status ${response_obs.status}`);
    }

    const data_obs = await response_obs.json();

    const rows = document.querySelectorAll(".nearby-observations-row");

    rows.forEach((row) => {
        row.querySelector(".nearby-city").textContent = "-";
        row.querySelector(".nearby-temp").textContent = "-";
        row.querySelector(".nearby-obs-icon").src = iconMap["44"];
    });

    const observations = Array.isArray(data_obs) ? data_obs : [];

    observations.forEach((item, index) => {
        if (!item?.v2obs?.observation) {
            return;
        }

        const observation = item.v2obs.observation;
        const row = rows[index];

        if (!row) {
            return;
        }


        row.querySelector(".nearby-city").textContent =
            cityNames[index] ?? observation.obs_name ?? "Unknown station";

        row.querySelector(".nearby-temp").textContent =
            `${observation.temp}°${unit === "e" ? "F" : "C"}`;

        row.querySelector(".nearby-obs-icon").src = iconMap[String(observation.wx_icon)] ?? iconMap["44"];
    });


}
getNearestObs().catch((error) => {
    console.error("Unable to load nearby observations.", error);
});

function setUnit(nextUnit) {
    if (!['e', 'm'].includes(nextUnit) || nextUnit === unit) {
        return;
    }

    unit = nextUnit;
    unitOptions.forEach((option) => {
        const isActive = option.dataset.unit === unit;
        option.classList.toggle("is-active", isActive);
        option.setAttribute("aria-pressed", String(isActive));
    });

    localStorage.setItem("weatherUnit", unit);
    currentConditionsData();
    getNearestObs();
    loadRadar();
    GrabAlertData();
}

unitOptions.forEach((option) => {
    const isActive = option.dataset.unit === unit;
    option.classList.toggle("is-active", isActive);
    option.setAttribute("aria-pressed", String(isActive));
});

unitOptions.forEach((option) => {
    option.addEventListener("click", () => setUnit(option.dataset.unit));
});

function loadRadar(latitude, longitude, selectedCountry = "", selectedCountryCode = "") {
    if (latitude == null || longitude == null || !radarImgEl || !timeSliderEl) {
        return;
    }

    const radarTimeFrames = [
        "-1hour", "-55min", "-50min", "-45min", "-40min", "-35min",
        "-30min", "-25min", "-20min", "-15min", "-10min", "-5min", "latest"
    ];

    const radarGlobalFrames = [
        "-3hr", "-150min", "-2hr", "-90min", "-1hr", "-30min", "latest"
    ];

    const radarGlobalLabels = [
        "3 hours ago", "2 hr 30 mins ago", "2 hours ago", "1 hr 30 mins ago", "1 hr ago", "30 minutes ago", "Latest"
    ]
    const radarTimeLabels = [
        "1 hour ago", "55 minutes ago", "50 minutes ago", "45 minutes ago",
        "40 minutes ago", "35 minutes ago", "30 minutes ago", "25 minutes ago",
        "20 minutes ago", "15 minutes ago", "10 minutes ago", "5 minutes ago", "Latest"
    ];

    const globalRadarCountries = ["China", "Russia", "Indonesia", "Papua New Guinea", "Vanuatu", "Niue", "American Samoa", "Tuvalu", "Iran", "Mongolia"];

    const normalizedCountry = String(selectedCountry ?? "").trim().toLowerCase();
    const normalizedCountryCode = String(selectedCountryCode ?? "").trim().toLowerCase();
    const radarLayer = globalRadarCountries.some((country) =>
        country.toLowerCase() === normalizedCountry
    ) || normalizedCountryCode === "cn" ? "radar-global" : "radar";

    const radarFrames = radarLayer === "radar-global" ? radarGlobalFrames : radarTimeFrames;
    const radarLabels = radarLayer === "radar-global" ? radarGlobalLabels : radarTimeLabels;

    function radarTimeFrame() {
        const frameIndex = Math.max(
            0,
            Math.min(Number(timeSliderEl.value), radarFrames.length - 1)
        );
        const radarFrame = radarFrames[frameIndex];

        timeBack = getRadarUnixTimestamp(radarFrame) * 1000;
        timeBackFmt = new Date(timeBack).toLocaleString(defaultLang, { hour: "2-digit", minute: "2-digit" });
        const radarUrl = `https://maps.aerisapi.com/${aerisKey}_${aerisSecret}/flat-dk,water-depth,${radarLayer},alerts-severe-outlines,interstates,counties,admin-cities-dk/1024x1024/${latitude},${longitude},9/${radarFrame}.png`;

        radarImgEl.src = radarUrl;
        if (timeSliderValueEl) {
            timeSliderValueEl.textContent = `${radarLabels[frameIndex]} • ${timeBackFmt}`;
        }
    }

    radarFrames.forEach((radarFrame) => {
        const radarUrl = `https://maps.aerisapi.com/${aerisKey}_${aerisSecret}/flat-dk,water-depth,${radarLayer},alerts-severe-outlines,interstates,counties,admin-cities-dk/1024x1024/${latitude},${longitude},9/${radarFrame}.png`;
        const preloadImage = new Image();
        preloadImage.src = radarUrl;
    });

    timeSliderEl.max = String(radarFrames.length - 1);
    timeSliderEl.oninput = radarTimeFrame;
    radarTimeFrame();
}


async function populateSearchResults(query) {
    const coordinates = parseCoordinates(query);
    if (coordinates) {
        locationSearchState.requestId++;
        locationSearchState.results = [coordinates];
        renderSearchResults([coordinates]);
        return;
    }

    const searchAPI = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`;
    const requestId = ++locationSearchState.requestId;

    const whiteListedCountries = ["North Korea",]

    try {
        const response = await fetch(searchAPI);

        if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
        }

        const responseData = await response.json();
        const results = Array.isArray(responseData.results) ? responseData.results : [];

        if (requestId !== locationSearchState.requestId) {
            return;
        }

        locationSearchState.results = results;
        renderSearchResults(results);
    } catch (error) {
        if (requestId !== locationSearchState.requestId) {
            return;
        }

        locationSearchState.results = [];
        renderSearchResults([], "Unable to find locations right now.");
        console.error("Search API Error", error);
    }
}

function parseCoordinates(query) {
    const coordinateMatch = query.match(/^\s*[([{]?\s*([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*[,;\s]\s*([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*[)\]}]?\s*$/);

    if (!coordinateMatch) {
        return null;
    }

    const latitude = Number(coordinateMatch[1]);
    const longitude = Number(coordinateMatch[2]);

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        return null;
    }

    return {
        latitude,
        longitude,
        name: `Coordinates: {${latitude}, ${longitude}}`,
        isCoordinates: true
    };
}

function renderSearchResults(results, message = "") {
    const dropdown = document.querySelector(".dropdowns");
    const dropdownList = dropdown?.querySelector("ul");

    if (!dropdown || !dropdownList) {
        return;
    }

    dropdownList.replaceChildren();

    if (message || results.length === 0) {
        const emptyItem = document.createElement("li");
        emptyItem.textContent = message || "No locations found.";
        emptyItem.classList.add("is-empty");
        dropdownList.append(emptyItem);
        dropdown.hidden = false;
        return;
    }

    results.forEach((location, index) => {
        const resultItem = document.createElement("li");
        const region = [location.admin1, location.country].filter(Boolean).join(", ");

        resultItem.textContent = location.isCoordinates
            ? location.name
            : region ? `${location.name}, ${region}` : location.name;
        resultItem.tabIndex = 0;
        resultItem.dataset.resultIndex = index;
        resultItem.setAttribute("role", "option");
        dropdownList.append(resultItem);
    });

    dropdown.hidden = false;
}

async function selectLocation(location) {
    const { latitude, longitude, name, admin1, country, country_code: countryCode } = location;
    const locationLabel = location.isCoordinates
        ? name
        : [name, admin1, country].filter(Boolean).join(", ");
    locationSearchState.selectedLocation = { ...location, latitude, longitude, name, admin1, country };
    console.log(country);


    const searchInput = document.getElementById("locationInput");
    const dropdown = document.querySelector(".dropdowns");

    if (searchInput) {
        searchInput.value = locationLabel;
    }

    if (dropdown) {
        dropdown.hidden = true;
    }

    locationEl.textContent = locationLabel;

    console.log("Selected coordinates:", { latitude, longitude, name });
    localStorage.setItem("lat_last", latitude);
    localStorage.setItem("lon_last", longitude);
    localStorage.setItem("city", locationLabel);
    localStorage.setItem("country", country ?? "");
    localStorage.setItem("countryCode", countryCode ?? "");

    await Promise.all([
        currentConditionsData(latitude, longitude, country, countryCode),
        getNearestObs(),
        airQualityIndex(),
        GrabAlertData(latitude, longitude)
    ]);

    return { latitude, longitude, name, admin1, name };
}

function handleSearch(event) {
    const query = event.target.value.trim();
    const dropdown = document.querySelector(".dropdowns");

    if (!query) {
        locationSearchState.requestId++;
        locationSearchState.results = [];
        locationSearchState.selectedLocation = null;
        dropdown.hidden = true;
        return;
    }

    populateSearchResults(query);
}

document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("locationInput");
    const dropdown = document.querySelector(".dropdowns");

    if (!searchInput || !dropdown) {
        return;
    }

    dropdown.hidden = true;
    searchInput.addEventListener("input", handleSearch);
    searchInput.addEventListener("keydown", async (event) => {
        if (event.key !== "Enter") {
            return;
        }

        event.preventDefault();
        const query = searchInput.value.trim();

        if (!query) {
            return;
        }

        if (locationSearchState.results.length === 0) {
            await populateSearchResults(query);
        }

        const firstResult = locationSearchState.results[0];

        if (firstResult) {
            selectLocation(firstResult);
        }
    });

    dropdown.addEventListener("click", (event) => {
        const resultItem = event.target.closest("li[data-result-index]");



        if (resultItem) {
            selectLocation(locationSearchState.results[resultItem.dataset.resultIndex]);
        }
    });

    dropdown.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") {
            return;
        }

        const resultItem = event.target.closest("li[data-result-index]");

        if (resultItem) {
            event.preventDefault();
            selectLocation(locationSearchState.results[resultItem.dataset.resultIndex]);
        }
    });
});

async function airQualityIndex(
    latitude = localStorage.getItem("lat_last"),
    longitude = localStorage.getItem("lon_last")
) {
    const geocode = encodeURIComponent(`${latitude},${longitude}`);
    const aqUrl = `https://api.weather.com/v3/wx/globalAirQuality?geocode=${geocode}&format=json&language=en-US&scale=EPA&apiKey=8de2d8b3a93542c9a2d8b3a935a2c909`;
    const response = await fetch(aqUrl);
    const data = await response.json();
    console.log(data);

    if (!response.ok) {
        throw new Error(`ERROR: Air Quality Data could not be fetched, ${response}`);
        return;
    }

    const airquality = data.globalairquality;

    /* A requirement from the API states that the disclaimer field must be displayed
    to end users. */

    const disclaimer = airquality.disclaimer;
    const expireTime = new Date(airquality.expireTimeGmt);
    const expireTimeUnix = Math.floor(expireTime.getTime() / 1000);
    // const isExpired = nowUnix > expireTimeUnix;
    const actionMessage = airquality.messages.General.text;

    // Math.floor(Date.now() / 1000);
    // Basic defs

    const airQualityCategory = airquality.airQualityCategory // Example: "Moderate"
    const airQualityValue = airquality.airQualityIndex; // Example: "55", numeric string
    // const primaryPollutant = airquality.primaryPollutant // Example: "PM2.5"
    const airQualityColor = airquality.airQualityCategoryIndexColor;

    airQualityNum.textContent = airQualityValue;
    airQualityCat.textContent = airQualityCategory;
    airQualityCat.style.color = `#` + airQualityColor;
    airQualityAction.textContent = actionMessage;


}
airQualityIndex();


function mapIcons() {
    // Depending on the weather condition, and API source, map the icons according to their weather condition or weather code (TWC):

    // AI did this section.. but I would have done it if I had saved my coded icons (e.g. 26.svg) from my repository 2 years ago... but that's gone now, sadly :(

    const twcCodeIcons = {
        "0": "../assets/icons/meteocons/animated/tornado.svg",
        // Meteocons has no tropical-storm icon, so hurricane is the closest match.
        "1": "../assets/icons/meteocons/animated/hurricane.svg",
        "2": "../assets/icons/meteocons/animated/hurricane.svg",
        "3": "../assets/icons/meteocons/animated/thunderstorms-extreme.svg",
        "4": "../assets/icons/meteocons/animated/thunderstorms.svg",
        "5": "../assets/icons/meteocons/animated/sleet.svg",
        "6": "../assets/icons/meteocons/animated/sleet.svg",
        "7": "../assets/icons/meteocons/animated/sleet.svg",
        "8": "../assets/icons/meteocons/animated/drizzle.svg",
        "9": "../assets/icons/meteocons/animated/drizzle.svg",
        "10": "../assets/icons/meteocons/animated/rain.svg",
        "11": "../assets/icons/meteocons/animated/rain.svg",
        "12": "../assets/icons/meteocons/animated/rain.svg",
        "13": "../assets/icons/meteocons/animated/snow.svg",
        "14": "../assets/icons/meteocons/animated/snow.svg",
        "15": "../assets/icons/meteocons/animated/snow.svg",
        "16": "../assets/icons/meteocons/animated/snow.svg",
        "17": "../assets/icons/meteocons/animated/hail.svg",
        "18": "../assets/icons/meteocons/animated/sleet.svg",
        "19": "../assets/icons/meteocons/animated/dust.svg",
        "20": "../assets/icons/meteocons/animated/fog.svg",
        "21": "../assets/icons/meteocons/animated/haze.svg",
        "22": "../assets/icons/meteocons/animated/smoke.svg",
        "23": "../assets/icons/meteocons/animated/wind.svg",
        "24": "../assets/icons/meteocons/animated/wind.svg",
        "25": "../assets/icons/meteocons/animated/snowflake.svg",
        "26": "../assets/icons/meteocons/animated/cloudy.svg",
        "27": "../assets/icons/meteocons/animated/overcast-night.svg",
        "28": "../assets/icons/meteocons/animated/overcast-day.svg",
        "29": "../assets/icons/meteocons/animated/partly-cloudy-night.svg",
        "30": "../assets/icons/meteocons/animated/partly-cloudy-day.svg",
        "31": "../assets/icons/meteocons/animated/clear-night.svg",
        "32": "../assets/icons/meteocons/animated/clear-day.svg",
        "33": "../assets/icons/meteocons/animated/mostly-clear-night.svg",
        "34": "../assets/icons/meteocons/animated/mostly-clear-day.svg",
        "35": "../assets/icons/meteocons/animated/hail.svg",
        "36": "../assets/icons/meteocons/animated/sun-hot.svg",
        "37": "../assets/icons/meteocons/animated/thunderstorms-day.svg",
        "38": "../assets/icons/meteocons/animated/thunderstorms-day.svg",
        "39": "../assets/icons/meteocons/animated/rain.svg",
        "40": "../assets/icons/meteocons/animated/extreme-rain.svg",
        "41": "../assets/icons/meteocons/animated/snow.svg",
        "42": "../assets/icons/meteocons/animated/extreme-snow.svg",
        "43": "../assets/icons/meteocons/animated/extreme-snow.svg",
        "44": "../assets/icons/meteocons/animated/not-available.svg",
        "45": "../assets/icons/meteocons/animated/rain.svg",
        "46": "../assets/icons/meteocons/animated/snow.svg",
        "47": "../assets/icons/meteocons/animated/thunderstorms-night.svg"
    };

    return twcCodeIcons;
}

// These are some fun notifications for when the user logs on, whether its a new season, the first freeze, etc.
// The user is required to set a home location.
function homeLocation() {
    const lastLocation = localStorage.getItem("city"); // Get the last city searched from the local storage. This is ALWAYS saved/changed whenever a user searches a location.
    localStorage.setItem("homeLocation", lastLocation);
    console.log(localStorage.getItem("homeLocation"));


    if (lastLocation === homeLocation) {
        homeLocButton.className.replace(" active", "")
    }


}
homeLocation();

function funNotifications() {
    const homeLocSaved = localStorage.getItem("savedLocation");
    const lastTemp = localStorage.getItem("lastTemp");

    // To be written: If the current temperature (or the lowest temperature in the past 24 hours) is lower than 32, let there be a notification saying: "First freeze!"
}


// This does not exist on every page.
const closeIcon = document.querySelector("close-icon");