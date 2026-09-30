// Elements
const utcTimeEl = document.getElementById("timeUTC");
const localTimeEl = document.getElementById("timeLocal");

function formatTimeUnit(unit) {
    return unit.toString().padStart(2, '0');
}

function updateClocks() {
    const now = new Date();

    const hour = formatTimeUnit(now.getHours());
    const minute = formatTimeUnit(now.getMinutes());
    const secs = formatTimeUnit(now.getSeconds());

    const utcHour = formatTimeUnit(now.getUTCHours());
    const utcMin = formatTimeUnit(now.getUTCMinutes());
    const utcSecs = formatTimeUnit(now.getUTCSeconds());

    localTimeEl.textContent = `${hour}:${minute}:${secs}`;
    utcTimeEl.textContent = `${utcHour}:${utcMin}:${utcSecs}`;
}

updateClocks();
setInterval(updateClocks, 500);
