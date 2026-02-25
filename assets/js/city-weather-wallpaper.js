(function () {
  const cities = {
    seoul: {
      label: "Seoul",
      lat: 37.5665,
      lon: 126.9780,
      tz: "Asia/Seoul",
      bg: "url(\"assets/images/city_seoul.jpg\")",
    },
    vancouver: {
      label: "Vancouver",
      lat: 49.2827,
      lon: -123.1207,
      tz: "America/Vancouver",
      bg: "url(\"assets/images/city_vancouver.jpg\")",
    },
    los_angeles: {
      label: "Los Angeles",
      lat: 34.0522,
      lon: -118.2437,
      tz: "America/Los_Angeles",
      bg: "url(\"assets/images/city_los_angeles.jpg\")",
    },
    london: {
      label: "London",
      lat: 51.5072,
      lon: -0.1276,
      tz: "Europe/London",
      bg: "url(\"assets/images/city_london.jpg\")",
    },
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

  const groups = {
    clear: new Set([0]),
    cloudy: new Set([1, 2, 3]),
    fog: new Set([45, 48]),
    rain: new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82]),
    snow: new Set([71, 73, 75, 77, 85, 86]),
    storm: new Set([95, 96, 99]),
  };

  const citySelect = document.getElementById("city-select");
  const chip = document.getElementById("weather-chip");
  const fx = document.getElementById("weather-fx");
  if (!citySelect || !chip || !fx) return;

  let activeCity = citySelect.value in cities ? citySelect.value : "vancouver";

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
        if (kind === "storm") addParticle("wx-spark", 12);
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

  function applyTheme(cityKey, kind) {
    const c = cities[cityKey];
    if (!c) return;
    document.body.style.setProperty("--weather-bg", c.bg);
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

  async function fetchWeather(city) {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}` +
      `&longitude=${city.lon}` +
      `&current=temperature_2m,weather_code,wind_speed_10m` +
      `&timezone=${encodeURIComponent(city.tz)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`weather request failed: ${res.status}`);
    const data = await res.json();
    return data.current || null;
  }

  async function updateWeather(cityKey) {
    const city = cities[cityKey];
    if (!city) return;
    try {
      const current = await fetchWeather(city);
      if (!current) throw new Error("missing weather payload");
      const code = Number(current.weather_code);
      const temp = Math.round(Number(current.temperature_2m));
      const wind = Math.round(Number(current.wind_speed_10m));
      const kind = classify(code);

      chip.innerHTML = `<strong>${city.label}</strong> ${weatherText[kind]} · ${temp}°C · Wind ${wind} km/h`;
      applyTheme(cityKey, kind);
      renderFx(kind);
    } catch (_err) {
      chip.innerHTML = `<strong>${city.label}</strong> Weather unavailable`;
      applyTheme(cityKey, "unknown");
      clearFx();
    }
  }

  citySelect.addEventListener("change", () => {
    activeCity = citySelect.value in cities ? citySelect.value : "vancouver";
    updateWeather(activeCity);
  });

  let pointerX = 0;
  let pointerY = 0;
  window.addEventListener("pointermove", (event) => {
    const x = (event.clientX / window.innerWidth - 0.5) * 10;
    const y = (event.clientY / window.innerHeight - 0.5) * 10;
    pointerX += (x - pointerX) * 0.12;
    pointerY += (y - pointerY) * 0.12;
    fx.style.transform = `translate3d(${pointerX}px, ${pointerY}px, 0)`;
  });

  applyTheme(activeCity, "unknown");
  updateWeather(activeCity);
  setInterval(() => updateWeather(activeCity), 10 * 60 * 1000);
})();
