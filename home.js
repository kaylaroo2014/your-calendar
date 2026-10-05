const recurringEvents =
    JSON.parse(localStorage.getItem("recurringEvents")) || {};
    const personalEvents =
    JSON.parse(localStorage.getItem("personalEvents")) || {};
    const monthlyEvents =
    JSON.parse(localStorage.getItem("monthlyEvents")) || {};
    const yearlyEvents =
    JSON.parse(localStorage.getItem("yearlyEvents")) || {};

console.log("Home can see personal events:", personalEvents);

console.log("Home can see recurring events:", recurringEvents);

console.log("Home can see monthly events:", monthlyEvents);

console.log("Home can see yearly events:", yearlyEvents);

const upcomingEvents = document.getElementById("upcoming-events");

console.log("Upcoming events box:", upcomingEvents);

const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
];

const today = new Date().getDay();
const todayDate = new Date();
todayDate.setHours(0, 0, 0, 0);

const sortedEvents = [];
for (const dateKey in personalEvents) {
const [year, month, day] = dateKey.split("-").map(Number);
const eventDate = new Date(year, month - 1, day);
const difference = eventDate - todayDate;
const daysAway = Math.ceil(difference / (1000 * 60 * 60 * 24));
if (daysAway >= 0 && daysAway <= 7) {
sortedEvents.push({
    text: personalEvents[dateKey].name,
    daysAway: daysAway,
    date: eventDate
});
}
}

for (const day in recurringEvents) {
    recurringEvents[day].forEach(function(eventText) {

        const daysAway = (Number(day) - today + 7) % 7;

        sortedEvents.push({
            day: Number(day),
            text: eventText.name,
            daysAway: daysAway
        });
    });
}

for (const day in monthlyEvents) {
    monthlyEvents[day].forEach(function(eventText) {

        const eventDate = new Date(
    todayDate.getFullYear(),
    todayDate.getMonth(),
    Number(day)
);

if (eventDate < todayDate) {
    eventDate.setMonth(eventDate.getMonth() + 1);
}

const difference = eventDate - todayDate;
const daysAway = Math.round(difference / (1000 * 60 * 60 * 24));

if (daysAway <= 7) {
    sortedEvents.push({
        text: eventText.name,
        daysAway: daysAway,
        date: eventDate
    });
}

    });
}
for (const dateKey in yearlyEvents) {
    yearlyEvents[dateKey].forEach(function(eventText) {

        const [month, day] = dateKey.split("-").map(Number);

        let eventDate = new Date(
    todayDate.getFullYear(),
    month,
    day
);

if (eventDate < todayDate) {
    eventDate.setFullYear(eventDate.getFullYear() + 1);
}

const difference = eventDate - todayDate;
const daysAway = Math.round(difference / (1000 * 60 * 60 * 24));

if (daysAway <= 7) {
    sortedEvents.push({
        text: eventText.name,
        daysAway: daysAway,
        date: eventDate
    });
}

    });
}

sortedEvents.sort(function(a, b) {
    return a.daysAway - b.daysAway;
});

sortedEvents.forEach(function(event) {
    const eventItem = document.createElement("p");
    eventItem.classList.add("upcoming-event");

    const isPersonalEvent = event.date !== undefined;

    const dayLabel =
    event.daysAway === 0
        ? "Today"
        : event.daysAway === 1
        ? "Tomorrow"
        : "In " + event.daysAway + " days";

    eventItem.textContent =
        dayLabel + " — " + event.text;

    upcomingEvents.appendChild(eventItem);
});

const weatherZipInput = document.getElementById("weather-zip");
const saveWeatherZipButton = document.getElementById("save-weather-zip");
const weatherDisplay = document.getElementById("weather-display");
const weatherSetup = document.getElementById("weather-setup");
const weatherError = document.getElementById("weather-error");
const changeWeatherLocationButton =
    document.getElementById("change-weather-location");

const savedWeatherZip = localStorage.getItem("weatherZip");

if (savedWeatherZip) {
    weatherZipInput.value = savedWeatherZip;
    loadWeather(savedWeatherZip);
    weatherSetup.style.display = "none";
}

async function loadWeather(zipCode) {
    try {
const response = await fetch(
    "https://api.zippopotam.us/us/" + zipCode
);

if (!response.ok) {
    throw new Error("ZIP code not found");
}


const locationData = await response.json();

console.log("ZIP location:", locationData);

const place = locationData.places[0];

localStorage.setItem("weatherZip", zipCode);
console.log("Weather ZIP saved:", zipCode);
weatherSetup.style.display = "none";

const city = place["place name"];
const state = place["state abbreviation"];
const latitude = place.latitude;
const longitude = place.longitude;

console.log("City:", city);
console.log("State:", state);
console.log("Latitude:", latitude);
console.log("Longitude:", longitude);
const nwsResponse = await fetch(
    "https://api.weather.gov/points/" + latitude + "," + longitude
);

const nwsData = await nwsResponse.json();

console.log("NWS location data:", nwsData);

const forecastUrl = nwsData.properties.forecast;
const stationsUrl = nwsData.properties.observationStations;

console.log("Observation stations URL:", stationsUrl);

const stationsResponse = await fetch(stationsUrl);

const stationsData = await stationsResponse.json();

console.log("Nearby weather stations:", stationsData);


const stationId =
    stationsData.features[0].properties.stationIdentifier;

console.log("Weather station ID:", stationId);

const observationResponse = await fetch(
    "https://api.weather.gov/stations/" + stationId + "/observations/latest"
);

const observationData = await observationResponse.json();

console.log("Latest observation:", observationData);

const currentTempC =
    observationData.properties.temperature.value;

console.log("Current temp Celsius:", currentTempC);

const currentTempF =
    Math.round((currentTempC * 9 / 5) + 32);

console.log("Current temp Fahrenheit:", currentTempF);

console.log("Forecast URL:", forecastUrl);
const forecastResponse = await fetch(forecastUrl);

const forecastData = await forecastResponse.json();

console.log("Forecast data:", forecastData);
const firstPeriod = forecastData.properties.periods[0];

const tonightPeriod = forecastData.properties.periods.find(function(period) {
    return period.isDaytime === false;
});

console.log("Tonight forecast period:", tonightPeriod);

console.log("First forecast period:", firstPeriod);
const temperature = firstPeriod.temperature;
const conditions = firstPeriod.shortForecast;
const rainChance = firstPeriod.probabilityOfPrecipitation.value;
const lowTemperature = tonightPeriod.temperature;

weatherDisplay.innerHTML = `
    <p class="weather-location">${city}, ${state}</p>

    <p class="weather-main">
        <span class="weather-temp">${currentTempF}°F</span>
        <span class="weather-conditions">${conditions}</span>
    </p>

    <p class="weather-high-low">
        High ${temperature}° • Low ${lowTemperature}°
    </p>

    <p class="weather-rain">
        Rain chance: ${rainChance}%
    </p>
`;
} catch (error) {
        console.error("Weather error:", error);
        weatherError.textContent = "Couldn't load weather. Please try again.";
    }
}
saveWeatherZipButton.addEventListener("click", async function() {
    const zipCode = weatherZipInput.value.trim();

    if (/^\d{5}$/.test(zipCode)) {
        weatherError.textContent = "";

        
        console.log("Weather ZIP saved:", zipCode);
        loadWeather(zipCode);

        } else {
    weatherError.textContent = "Please enter a valid 5-digit ZIP code.";
    }

});

changeWeatherLocationButton.addEventListener("click", function() {
    weatherSetup.style.display = "block";
    weatherZipInput.focus();
    weatherZipInput.select();
});

weatherZipInput.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        saveWeatherZipButton.click();
    }
});

const homeDate = document.getElementById("home-date");

if (homeDate) {
    const today = new Date();

    homeDate.textContent = today.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric"
    });
}