(function () {
  const cities = {
    seoul: {
      label: "Seoul",
      lat: 37.5665,
      lon: 126.9780,
      tz: "Asia/Seoul",
      wallpapers: {
        morning: "url(\"assets/images/city_seoul_morning.jpg\")",
        day: "url(\"assets/images/city_seoul_day.jpg\")",
        evening: "url(\"assets/images/city_seoul_evening.jpg\")",
        night: "url(\"assets/images/city_seoul_night.jpg\")",
      },
    },
    vancouver: {
      label: "Vancouver",
      lat: 49.2827,
      lon: -123.1207,
      tz: "America/Vancouver",
      wallpapers: {
        morning: "url(\"assets/images/city_vancouver_morning.jpg\")",
        day: "url(\"assets/images/city_vancouver_day.jpg\")",
        evening: "url(\"assets/images/city_vancouver_evening.jpg\")",
        night: "url(\"assets/images/city_vancouver_night.jpg\")",
      },
    },
    los_angeles: {
      label: "Los Angeles",
      lat: 34.0522,
      lon: -118.2437,
      tz: "America/Los_Angeles",
      wallpapers: {
        morning: "url(\"assets/images/city_los_angeles_morning.jpg\")",
        day: "url(\"assets/images/city_los_angeles_day.jpg\")",
        evening: "url(\"assets/images/city_los_angeles_evening.jpg\")",
        night: "url(\"assets/images/city_los_angeles_night.jpg\")",
      },
    },
    london: {
      label: "London",
      lat: 51.5072,
      lon: -0.1276,
      tz: "Europe/London",
      wallpapers: {
        morning: "url(\"assets/images/city_london_morning.jpg\")",
        day: "url(\"assets/images/city_london_day.jpg\")",
        evening: "url(\"assets/images/city_london_evening.jpg\")",
        night: "url(\"assets/images/city_london_night.jpg\")",
      },
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

  const cityStorageKey = "doobob_selected_city";
  function readSavedCity() {
    try {
      const saved = window.localStorage.getItem(cityStorageKey);
      return saved && saved in cities ? saved : null;
    } catch (_err) {
      return null;
    }
  }
  function saveCity(cityKey) {
    try {
      window.localStorage.setItem(cityStorageKey, cityKey);
    } catch (_err) {
      // ignore storage failures
    }
  }

  const savedCity = readSavedCity();
  if (savedCity) citySelect.value = savedCity;
  let activeCity = citySelect.value in cities ? citySelect.value : "vancouver";
  if (activeCity !== citySelect.value) citySelect.value = activeCity;
  saveCity(activeCity);
  let latestKind = "unknown";
  let latestTemp = null;
  let latestWind = null;
  let lastSlot = "";
  let lastWallpaper = "";
  let weatherRequestId = 0;
  const preloadedWallpapers = new Set();

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
        addParticle("wx-rain", kind === "storm" ? 62 : 44);
        if (kind === "storm") addParticle("wx-spark", 8);
        break;
      case "snow":
        addParticle("wx-snow", 40);
        break;
      case "fog":
        addParticle("wx-fog", 12);
        break;
      case "cloudy":
        addParticle("wx-fog", 6);
        break;
      case "clear":
        addParticle("wx-spark", 8);
        break;
      default:
        addParticle("wx-spark", 5);
    }
    fx.classList.add("active");
  }

  function getSlot(hour) {
    if (hour >= 5 && hour <= 10) return "morning";
    if (hour >= 11 && hour <= 16) return "day";
    if (hour >= 17 && hour <= 20) return "evening";
    return "night";
  }

  function getTimeParts(city) {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: city.tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const parts = formatter.formatToParts(now);
    const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
    const hour = Number(map.hour || "0");
    return {
      hour,
      dateTime: `${map.year}-${map.month}-${map.day} ${map.hour}:${map.minute}`,
      minuteKey: Number(map.minute || "0"),
    };
  }

  function chooseWallpaper(city, slot) {
    const selected = city.wallpapers && city.wallpapers[slot];
    return selected || "url(\"assets/images/unreal_wallpaper.png\")";
  }

  function extractUrlPath(cssUrl) {
    const match = /^url\(["']?(.*?)["']?\)$/.exec(cssUrl);
    return match ? match[1] : "";
  }

  function preloadWallpaper(cssUrl) {
    const path = extractUrlPath(cssUrl);
    if (!path || preloadedWallpapers.has(path)) return;
    const img = new Image();
    preloadedWallpapers.add(path);
    img.src = path;
  }

  function preloadSelectedWallpaper(cityKey) {
    const city = cities[cityKey];
    if (!city) return;
    const time = getTimeParts(city);
    const slot = getSlot(time.hour);
    const selected = chooseWallpaper(city, slot);
    preloadWallpaper(selected);
    preloadWallpaper("url(\"assets/images/unreal_wallpaper.png\")");
  }

  function scheduleSelectedPreload(cityKey) {
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(() => preloadSelectedWallpaper(cityKey), { timeout: 1600 });
      return;
    }
    window.setTimeout(() => preloadSelectedWallpaper(cityKey), 200);
  }

  function renderChip(city, kind, dateTime) {
    const weatherLabel = weatherText[kind] || weatherText.unknown;
    const tempPart = latestTemp === null ? "--°C" : `${latestTemp}°C`;
    const windPart = latestWind === null ? "-- km/h" : `${latestWind} km/h`;
    chip.innerHTML = `<strong>${city.label}</strong> ${weatherLabel} · ${tempPart} · Wind ${windPart}<br>${dateTime}`;
  }

  function applyTheme(cityKey, kind) {
    const c = cities[cityKey];
    if (!c) return;
    const time = getTimeParts(c);
    const slot = getSlot(time.hour);
    const selected = chooseWallpaper(c, slot);
    if (slot !== lastSlot || selected !== lastWallpaper) {
      document.body.style.setProperty("--weather-bg", selected);
      lastSlot = slot;
      lastWallpaper = selected;
    }
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
    renderChip(c, kind, time.dateTime);
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
    const requestId = ++weatherRequestId;
    try {
      const current = await fetchWeather(city);
      if (requestId !== weatherRequestId || cityKey !== activeCity) return;
      if (!current) throw new Error("missing weather payload");
      const code = Number(current.weather_code);
      const temp = Math.round(Number(current.temperature_2m));
      const wind = Math.round(Number(current.wind_speed_10m));
      const kind = classify(code);
      latestKind = kind;
      latestTemp = temp;
      latestWind = wind;
      applyTheme(cityKey, kind);
      renderFx(kind);
    } catch (_err) {
      if (requestId !== weatherRequestId || cityKey !== activeCity) return;
      latestKind = "unknown";
      latestTemp = null;
      latestWind = null;
      applyTheme(cityKey, "unknown");
      clearFx();
    }
  }

  citySelect.addEventListener("change", () => {
    activeCity = citySelect.value in cities ? citySelect.value : "vancouver";
    saveCity(activeCity);
    // Apply city/time wallpaper immediately; weather info can follow after API returns.
    applyTheme(activeCity, latestKind);
    scheduleSelectedPreload(activeCity);
    updateWeather(activeCity);
  });

  let pointerX = 0;
  let pointerY = 0;
  let targetX = 0;
  let targetY = 0;
  let pointerRaf = 0;
  function renderPointer() {
    pointerX += (targetX - pointerX) * 0.16;
    pointerY += (targetY - pointerY) * 0.16;
    fx.style.transform = `translate3d(${pointerX}px, ${pointerY}px, 0)`;
    if (Math.abs(targetX - pointerX) > 0.12 || Math.abs(targetY - pointerY) > 0.12) {
      pointerRaf = window.requestAnimationFrame(renderPointer);
      return;
    }
    pointerRaf = 0;
  }
  window.addEventListener("pointermove", (event) => {
    targetX = (event.clientX / window.innerWidth - 0.5) * 10;
    targetY = (event.clientY / window.innerHeight - 0.5) * 10;
    if (!pointerRaf) pointerRaf = window.requestAnimationFrame(renderPointer);
  });

  scheduleSelectedPreload(activeCity);
  applyTheme(activeCity, latestKind);
  updateWeather(activeCity);
  setInterval(() => updateWeather(activeCity), 10 * 60 * 1000);
  setInterval(() => applyTheme(activeCity, latestKind), 60 * 1000);
})();
