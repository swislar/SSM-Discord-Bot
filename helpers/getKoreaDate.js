export const getKoreaDate = () => {
    const timezone = "Asia/Seoul";

    const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        hour12: false,
    });
    const parts = formatter.formatToParts(new Date());
    const map = {};
    for (const { type, value } of parts) {
        map[type] = value;
    }
    const hour = map.hour === "24" ? 0 : parseInt(map.hour, 10);
    return new Date(
        parseInt(map.year, 10),
        parseInt(map.month, 10) - 1,
        parseInt(map.day, 10),
        hour,
        parseInt(map.minute, 10),
        parseInt(map.second, 10)
    );
};
