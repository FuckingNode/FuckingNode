import { difference, format, parse } from "@std/datetime";

const DATE_FMT = "dd-MM-yyyy HH:mm:ss";

/**
 * Gets the current date (at the moment the function is called) and returns it as a string.
 *
 * @returns {string}
 */
export function GetDateNow(): string {
    return format(new Date(), DATE_FMT);
}

/**
 * Takes a date string and turns it into a JS `Date()` so code can interact with it.
 *
 * @param {string} date The date string you want to make standard.
 * @returns {Date}
 */
export function ParseDate(date: string): Date {
    return parse(date, DATE_FMT);
}

/**
 * Gets the amount of time passed between `date` and the current date.
 *
 * @param {Date} date Date to count from. It should be earlier from now, e.g. if now it's 13:30 and passed `date` is 13:20, elapsed time is of 10 minutes.
 * @returns {string}
 */
export function GetElapsedTime(date: Date): string {
    const { milliseconds, seconds, minutes } = difference(date, new Date());

    if (milliseconds! < 1000) return "less than a second";

    return `${minutes}m ${seconds!.toString().padStart(2, "0")}s`;
}
