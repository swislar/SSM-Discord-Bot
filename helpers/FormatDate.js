export class FormatDate {
    constructor() {
        this.today = new Date();
        this.currentYear = this.today.getFullYear();
    }

    formatMonthDay(monthDay) {
        const [month, day] = monthDay.split("-").map(Number);
        const monthNames = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
        ];
        return `${monthNames[month - 1]} ${day}`;
    }

    parseDate(monthDay, year = this.currentYear) {
        const [month, day] = monthDay.split("-").map(Number);
        return new Date(year, month - 1, day);
    }

    quarter(monthDate) {
        const startDate = this.parseDate(monthDate);
        const month = startDate.getMonth();
        return Math.floor(month / 3) + 1;
    }

    getDaysRemaining(to) {
        let end = this.parseDate(to);
        if (
            end < this.today &&
            this.today.getMonth() === 0 &&
            end.getMonth() === 11
        ) {
            end = this.parseDate(to, currentYear - 1);
        }
        const diff = Math.ceil((end - this.today) / (1000 * 60 * 60 * 24));
        return diff;
    }

    getDaysUntil(dateStr) {
        let start = this.parseDate(dateStr);
        if (
            start < this.today &&
            this.today.getMonth() === 11 &&
            start.getMonth() === 0
        ) {
            start = this.parseDate(dateStr, this.currentYear + 1);
        }
        const diff = Math.ceil((start - this.today) / (1000 * 60 * 60 * 24));
        return diff;
    }
}
