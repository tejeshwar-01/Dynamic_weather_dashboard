const apiKey = "5f5211694c780b61059284be4d084b2a";
const effectsContainer = document.getElementById("weather-effects");
const searchBtn = document.getElementById("searchBtn");
const cityInput = document.getElementById("cityInput");
const sunEl = document.getElementById("sun");
const moonEl = document.getElementById("moon");
const defaultCity = "Delhi";

let lightningInterval;

// Event Listeners
searchBtn.addEventListener("click", getWeatherByCity);
cityInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        getWeatherByCity();
    }
});

/**
 * Fetches weather data for the city in the input field.
 */
async function getWeatherByCity() {
  const city = cityInput.value.trim();
  if (!city) return;
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${apiKey}`;
  await fetchWeather(url);
}

/**
 * Helper to fetch weather for a specific city name (used for fallback).
 */
function fetchWeatherByCityName(cityName) {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cityName)}&units=metric&appid=${apiKey}`;
    fetchWeather(url);
}

/**
 * Attempts to get weather by the user's current location, falls back to default city.
 */
function getWeatherByLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
        fetchWeather(url);
      },
      // Geolocation failed or denied: fallback to default city
      () => fetchWeatherByCityName(defaultCity) 
    );
  } else {
    // Browser doesn't support Geolocation: fallback to default city
    fetchWeatherByCityName(defaultCity);
  }
}

/**
 * Clears all existing weather effects and the lightning interval.
 */
function clearEffects() { 
  effectsContainer.innerHTML = ""; 
  if(lightningInterval) { clearInterval(lightningInterval); lightningInterval=null; }
  // Hide sun/moon elements
  sunEl.style.display = "none";
  moonEl.style.display = "none";
}

// --- Weather Effects Functions ---

function createRain() { 
    clearEffects(); 
    for(let i=0;i<80;i++){ 
        const drop=document.createElement("div"); 
        drop.className="raindrop"; 
        drop.style.left=Math.random()*100+"vw"; 
        drop.style.top=Math.random()*-100+"vh"; 
        drop.style.height=8+Math.random()*12+"px"; 
        drop.style.animationDuration=(0.5+Math.random()*0.7)+"s"; 
        effectsContainer.appendChild(drop); 
    } 
}
function createSnow() { 
    clearEffects(); 
    for(let i=0;i<50;i++){ 
        const flake=document.createElement("div"); 
        flake.className="snowflake"; 
        flake.style.left=Math.random()*100+"vw"; 
        flake.style.top=Math.random()*-50+"vh"; 
        const size=3+Math.random()*6; 
        flake.style.width=flake.style.height=size+"px"; 
        flake.style.animationDuration=5+Math.random()*5+"s"; 
        effectsContainer.appendChild(flake); 
    } 
}
function createClouds() { 
    clearEffects(); 
    for(let i=0;i<4;i++){ 
        const cloud=document.createElement("div"); 
        cloud.className="cloud"; 
        cloud.style.left=(-200-Math.random()*200)+"px"; 
        cloud.style.top=(5+Math.random()*40)+"vh"; 
        const dur=25+Math.random()*30; 
        cloud.style.animationDuration=dur+"s"; 
        cloud.style.opacity=(0.5+Math.random()*0.5).toString(); 
        const w=100+Math.random()*140; 
        const h=40+Math.random()*40; 
        cloud.style.width=w+"px"; 
        cloud.style.height=h+"px"; 
        cloud.style.borderRadius=Math.max(20,h/2)+"px"; 
        effectsContainer.appendChild(cloud); 
    } 
}
function createLightning() { 
    const bolt=document.createElement("div"); 
    bolt.className="lightning"; 
    bolt.style.left=Math.random()*100+"vw"; 
    effectsContainer.appendChild(bolt); 
    setTimeout(()=>bolt.remove(),300); 
}
function showSun(){ 
    clearEffects(); 
    sunEl.style.left = "5%"; // Move sun into view
    sunEl.style.display = "block"; 
}
function showMoon(){ 
    clearEffects(); 
    moonEl.style.left = "5%"; // Move moon into view
    moonEl.style.display = "block"; 
}

// --- Fetch & Update UI ---

/**
 * Fetches weather data from the provided URL and updates the UI.
 */
async function fetchWeather(url){
  try{
    const cityNameEl=document.getElementById("cityName");
    if(cityNameEl) cityNameEl.innerText="Loading...";
    const res=await fetch(url);
    const data=await res.json();
    
    // Handle API error/bad response
    if(!res.ok || !data.main){ 
        alert(data.message||"Unable to fetch weather"); 
        cityNameEl.innerText="--"; 
        document.body.className = "clear"; // Reset background 
        clearEffects();
        return; 
    }

    // Update Weather Card Data
    document.getElementById("cityName").innerText=`${data.name}, ${data.sys.country}`;
    document.getElementById("date").innerText=new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    document.getElementById("temperature").innerText=`${Math.round(data.main.temp)} °C`;
    document.getElementById("description").innerText=data.weather[0].description;
    document.getElementById("humidity").innerText=data.main.humidity;
    document.getElementById("wind").innerText=(data.wind.speed*3.6).toFixed(1); // Convert m/s to km/h
    const iconCode = data.weather[0].icon;
    document.getElementById("icon").src=`https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    document.getElementById("icon").title=data.weather[0].description;


    // Determine Day or Night
    const nowSec=Math.floor(Date.now()/1000);
    const sunrise=data.sys.sunrise; 
    const sunset=data.sys.sunset;
    // Check if the current time is BEFORE sunrise OR AFTER sunset
    const isNight=nowSec<sunrise||nowSec>sunset;

    const weatherMain=data.weather[0].main.toLowerCase();
    clearEffects(); // Clear all effects before applying new ones

    // Apply Effects and Background Classes
    if(weatherMain.includes("thunderstorm")){
      document.body.className = isNight ? "rainy night" : "rainy clear";
      createRain();
      // Set up a random interval for lightning flashes
      lightningInterval = setInterval(createLightning, 3000 + Math.random() * 2000); 
    }
    else if(weatherMain.includes("rain") || weatherMain.includes("drizzle")){
      document.body.className = isNight ? "rainy night" : "rainy clear";
      createRain();
    }
    else if(weatherMain.includes("snow")){
      document.body.className = isNight ? "snowy night" : "snowy clear";
      createSnow();
    }
    else if(weatherMain.includes("cloud")){
      document.body.className = isNight ? "cloudy night" : "cloudy clear";
      createClouds();
    }
    else if(weatherMain.includes("clear")){
      if(isNight){ 
            document.body.className="night"; 
            showMoon(); 
        }
      else{ 
            document.body.className="clear"; 
            showSun(); 
        }
    }
    // For weather types like Mist, Fog, Haze, etc., treat as cloudy
    else if(["mist","fog","haze","smoke","dust","ash","sand"].includes(weatherMain)){
      document.body.className = isNight ? "cloudy night" : "cloudy clear";
      createClouds();
    }
    else { 
        // Fallback for any other main weather type
        document.body.className = isNight ? "night" : "clear"; 
        clearEffects(); 
    }

  } catch(err){ 
      console.error("Error fetching or processing weather data:", err); 
      alert("Weather fetch error. Check console for details."); 
      document.getElementById("cityName").innerText="--"; 
      document.body.className = "clear"; // Reset background 
      clearEffects();
  }
}

// On load: Get weather by location or default to Delhi
window.addEventListener("DOMContentLoaded",()=>{ 
    getWeatherByLocation(); 
});