document.addEventListener('DOMContentLoaded', () => {
    const apiKey = '4872f50d300161d7d0277819ac8cadb3'; // <-- API key

    const locationEl = document.getElementById('location');
    const currentTempEl = document.getElementById('current-temp');
    const feelsLikeEl = document.getElementById('feels-like');
    const weatherDescriptionEl = document.getElementById('weather-description');
    const currentIconEl = document.getElementById('current-weather-icon');
    const windSpeedEl = document.getElementById('wind-speed');
    const humidityEl = document.getElementById('humidity');
    const uvIndexEl = document.getElementById('uv-index'); 
    const pressureEl = document.getElementById('pressure');
    const sunriseEl = document.getElementById('sunrise');
    const sunsetEl = document.getElementById('sunset');
    const hourlyForecastEl = document.getElementById('hourly-forecast');
    const fiveDayForecastEl = document.getElementById('five-day-forecast');
    const cityInputEl = document.getElementById('city-input');
    const searchBtn = document.getElementById('search-btn');

    const fetchWeatherData = (lat, lon) => {
        // API URLs for free plan
        const currentApiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
        const forecastApiUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;

        // Fetch both current weather and forecast data
        Promise.all([fetch(currentApiUrl), fetch(forecastApiUrl)])
            .then(responses => Promise.all(responses.map(res => res.json())))
            .then(([currentData, forecastData]) => {
                updateCurrentWeather(currentData);
                updateHourlyForecast(forecastData.list);
                updateFiveDayForecast(forecastData.list);
            })
            .catch(error => console.error("Error fetching weather data:", error));
    };

    const fetchCityCoordinates = (city) => {
        const geoApiUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${apiKey}`;
        
        fetch(geoApiUrl)
            .then(response => response.json())
            .then(data => {
                if (data.length > 0) {
                    const { lat, lon, name } = data[0];
                    locationEl.textContent = name;
                    fetchWeatherData(lat, lon);
                } else {
                    alert("City not found!");
                }
            })
            .catch(error => console.error("Error fetching city coordinates:", error));
    };

    const updateCurrentWeather = (data) => {
        currentTempEl.textContent = `${Math.round(data.main.temp)}°C`;
        feelsLikeEl.textContent = `Feels like ${Math.round(data.main.feels_like)}°C`;
        weatherDescriptionEl.textContent = data.weather[0].description;
        currentIconEl.src = `http://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png`;
        windSpeedEl.textContent = `${(data.wind.speed * 3.6).toFixed(1)} km/h`;
        humidityEl.textContent = `${data.main.humidity}%`;
        pressureEl.textContent = `${data.main.pressure} hPa`;
        sunriseEl.textContent = new Date(data.sys.sunrise * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        sunsetEl.textContent = new Date(data.sys.sunset * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true});
        // Note: UV index is not available in the free current weather API.
        uvIndexEl.textContent = 'N/A'; 
    };

    const updateHourlyForecast = (forecastList) => {
        hourlyForecastEl.innerHTML = '';
        forecastList.slice(0, 7).forEach(item => {
            const time = new Date(item.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
            const temp = `${Math.round(item.main.temp)}°C`;
            const icon = item.weather[0].icon;
            
            const hourItem = document.createElement('div');
            hourItem.classList.add('hour-item');
            hourItem.innerHTML = `
                <p>${time}</p>
                <img src="http://openweathermap.org/img/wn/${icon}.png" alt="weather icon">
                <p>${temp}</p>
            `;
            hourlyForecastEl.appendChild(hourItem);
        });
    };
    
    const updateFiveDayForecast = (forecastList) => {
        fiveDayForecastEl.innerHTML = '';
        const dailyData = {};

        forecastList.forEach(item => {
            const date = new Date(item.dt * 1000).toLocaleDateString('en-CA'); // YYYY-MM-DD format
            if (!dailyData[date]) {
                dailyData[date] = {
                    temps: [],
                    icons: [],
                    dt: item.dt
                };
            }
            dailyData[date].temps.push(item.main.temp);
            dailyData[date].icons.push(item.weather[0].icon);
        });
        
        Object.values(dailyData).slice(0, 5).forEach(day => {
            const dayName = new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' });
            const maxTemp = Math.round(Math.max(...day.temps));
            const minTemp = Math.round(Math.min(...day.temps));
            const icon = day.icons[Math.floor(day.icons.length / 2)]; // Get icon from middle of the day

            const dayItem = document.createElement('div');
            dayItem.classList.add('day-item');
            dayItem.innerHTML = `
                <p>${dayName}</p>
                <img src="http://openweathermap.org/img/wn/${icon}@2x.png" alt="weather icon">
                <p class="temp">${maxTemp}° / ${minTemp}°</p>
            `;
            fiveDayForecastEl.appendChild(dayItem);
        });
    };
    
    const getLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    fetchCityName(latitude, longitude);
                    fetchWeatherData(latitude, longitude);
                },
                () => { fetchCityCoordinates('London'); } // Fallback
            );
        } else {
             fetchCityCoordinates('London'); // Fallback
        }
    };
    
    const fetchCityName = (lat, lon) => {
        const geoApiUrl = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${apiKey}`;
        fetch(geoApiUrl)
            .then(res => res.json())
            .then(data => {
                if (data.length > 0) { locationEl.textContent = data[0].name; }
            });
    };

    searchBtn.addEventListener('click', () => {
        const city = cityInputEl.value;
        if (city) { fetchCityCoordinates(city); }
    });

    cityInputEl.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') { searchBtn.click(); }
    });
    
    getLocation(); // Initial load
});