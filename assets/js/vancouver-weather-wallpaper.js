(function () {
  const CITY = {
    name: "Vancouver",
    latitude: 49.2827,
    longitude: -123.1207,
    timezone: "America/Vancouver",
  };

  const chip = document.getElementById("weather-chip");
  const fx = document.getElementById("weather-fx");

  if (!chip || !fx) return;

  const groups = {
    clear: new Set([0]),
    cloudy: new Set([1, 2, 3]),
    fog: new Set([45, 48]),
    rain: new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82]),
    snow: new Set([71, 73, 75, 77, 85, 86]),
    storm: new Set([95, 96, 99]),
  };

  const weatherText = {
    clear: "Clear",
    cloudy: "Cloudy",
    fog: "Fog",
    rain: "Rain",
    snow: "Snow",
    storm: "Thunderstorm",
    unknown: "Atmospheric",
  };

  function classify(code) {
    if (groups.clear.has(code)) return "clear";
    if (groups.cloudy.has(code)) return "cloudy";
    if (groups.fog.has(code)) return "fog";
    if (groups.rain.has(code)) return "rain";
    if (groups.snow.has(code)) return "snow";
    if (groups.storm.has(code)) return "storm";
    return "unknown";
  }

  function clearFx() {
    fx.innerHTML = "";
    fx.classList.remove("active");
  }

  function addParticle(type, count) {
    for (let i = 0; i < count; i += 1) {
      const el = document.createElement("span");
      el.className = `wx-particle ${type}`;
      el.style.left = `${Math.random() * 100}%`;
      el.style.top = `${Math.random() * 100}%`;
      el.style.animationDuration = `${1.4 + Math.random() * 3.2}s`;
      el.style.animationDelay = `${Math.random() * -4}s`;
      fx.appendChild(el);
    }
  }

  function renderFx(kind) {
    clearFx();
    switch (kind) {
      case "rain":
      case "storm":
        addParticle("wx-rain", kind === "storm" ? 90 : 65);
        if (kind === "storm") addParticle("wx-spark", 14);
        break;
      case "snow":
        addParticle("wx-snow", 56);
        break;
      case "fog":
        addParticle("wx-fog", 18);
        break;
      case "cloudy":
        addParticle("wx-fog", 8);
        break;
      case "clear":
        addParticle("wx-spark", 10);
        break;
      default:
        addParticle("wx-spark", 6);
    }
    fx.classList.add("active");
  }

  function applyTheme(kind) {
    const classes = [
      "weather-clear",
      "weather-cloudy",
      "weather-rain",
      "weather-snow",
      "weather-fog",
      "weather-storm",
    ];
    document.body.classList.remove(...classes);
    if (kind !== "unknown") document.body.classList.add(`weather-${kind}`);
  }

  async function fetchWeather() {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${CITY.latitude}` +
      `&longitude=${CITY.longitude}` +
      `&current=temperature_2m,weather_code,wind_speed_10m` +
      `&timezone=${encodeURIComponent(CITY.timezone)}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`weather request failed: ${res.status}`);
    const data = await res.json();
    return data.current || null;
  }

  async function updateWeather() {
    try {
      const current = await fetchWeather();
      if (!current) throw new Error("missing weather payload");
      const code = Number(current.weather_code);
      const temp = Math.round(Number(current.temperature_2m));
      const wind = Math.round(Number(current.wind_speed_10m));
      const kind = classify(code);

      chip.innerHTML = `<strong>${CITY.name}</strong> ${weatherText[kind]} · ${temp}°C · Wind ${wind} km/h`;
      applyTheme(kind);
      renderFx(kind);
    } catch (err) {
      chip.innerHTML = `<strong>${CITY.name}</strong> Weather unavailable`;
      clearFx();
    }
  }

  let pointerX = 0;
  let pointerY = 0;
  window.addEventListener("pointermove", (event) => {
    const x = (event.clientX / window.innerWidth - 0.5) * 10;
    const y = (event.clientY / window.innerHeight - 0.5) * 10;
    pointerX += (x - pointerX) * 0.12;
    pointerY += (y - pointerY) * 0.12;
    fx.style.transform = `translate3d(${pointerX}px, ${pointerY}px, 0)`;
  });

  updateWeather();
  setInterval(updateWeather, 10 * 60 * 1000);
})();
