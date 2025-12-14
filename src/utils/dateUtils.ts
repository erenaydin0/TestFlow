/**
 * Parse date from various formats (Date, string, null, undefined)
 * @param date Date value to parse
 * @returns Parsed Date object or null if invalid
 */
function parseDate(date: Date | string | null | undefined): Date | null {
    if (!date) {
        return null;
    }

    const parsedDate = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(parsedDate.getTime())) {
        return null;
    }

    return parsedDate;
}

export function formatDuration(ms: number): string {
    if (ms < 1000) {
        return `${ms}ms`;
    }

    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) {
        return `${seconds}s`;
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
}

export function formatDate(date: Date, locale: string = 'tr'): string {
    return new Intl.DateTimeFormat(locale === 'tr' ? 'tr-TR' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
}

// Get schedule description from cron expression
export function getScheduleDescription(schedule: string, t?: (key: string, params?: Record<string, any>) => string): string {
    // If no translation function provided, return the schedule as is
    if (!t) {
        return schedule;
    }

    const scheduleMap: { [key: string]: string } = {
        '0 9 * * *': t('schedule.dailyAt') + ' 09:00',
        '0 2 * * 1': t('schedule.mondayAt') + ' 02:00',
        '0 0 * * 0': t('schedule.sundayAt') + ' 00:00',
        '0 */6 * * *': t('schedule.everyHours', { hours: 6 }),
        '0 0 1 * *': t('schedule.monthlyOn', { day: 1 }),
        '0 * * * *': t('schedule.hourly'),
        '0 0 * * *': t('schedule.dailyAtMidnight'),
        '0 12 * * *': t('schedule.dailyAtNoon')
    };

    if (scheduleMap[schedule]) {
        return scheduleMap[schedule];
    }

    // Parse cron expression
    const parts = schedule.split(' ');
    if (parts.length >= 5) {
        const [min, hour, day, month, weekday] = parts;

        // Hourly - specific hours
        if (hour.includes(',') && !hour.includes('*') && !hour.includes('/')) {
            const hours = hour.split(',').map(h => `${h.padStart(2, '0')}:${min.padStart(2, '0')}`).join(', ');
            return t('schedule.dailyAtTime', { time: hours });
        }

        // Hourly - specific intervals
        if (hour.includes('/')) {
            const interval = hour.split('/')[1];
            return t('schedule.everyHours', { hours: interval });
        }

        // Minutely
        if (min.includes('/') && hour === '*') {
            const interval = min.split('/')[1];
            return t('schedule.everyMinutes', { minutes: interval });
        }

        // Daily
        if (hour !== '*' && !hour.includes('/') && !hour.includes(',') && day === '*' && weekday === '*') {
            return t('schedule.dailyAtSpecificTime', { time: `${hour.padStart(2, '0')}:${min.padStart(2, '0')}` });
        }

        // Weekly
        if (weekday !== '*') {
            const days = [
                t('schedule.days.sunday'),
                t('schedule.days.monday'),
                t('schedule.days.tuesday'),
                t('schedule.days.wednesday'),
                t('schedule.days.thursday'),
                t('schedule.days.friday'),
                t('schedule.days.saturday')
            ];
            const dayNames = weekday.split(',').map(d => days[parseInt(d)]).join(', ');
            return t('schedule.weeklyOn', { days: dayNames, time: `${hour.padStart(2, '0')}:${min.padStart(2, '0')}` });
        }

        // Monthly
        if (day !== '*' && !day.includes(',')) {
            return t('schedule.monthlyOnDay', { day, time: `${hour.padStart(2, '0')}:${min.padStart(2, '0')}` });
        }

        // Monthly - multiple days
        if (day.includes(',')) {
            const days = day.split(',').join(', ');
            return t('schedule.monthlyOnDays', { days, time: `${hour.padStart(2, '0')}:${min.padStart(2, '0')}` });
        }
    }

    return schedule;
}

export function formatRelativeTime(date: Date | string | null | undefined, t?: (key: string, params?: Record<string, any>) => string, locale?: string): string {
    const parsedDate = parseDate(date);

    if (!parsedDate) {
        return t ? t('common.unknown') : 'Bilinmiyor';
    }

    const now = new Date();
    const diffInMs = now.getTime() - parsedDate.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) {
        return t ? t('common.now') : 'Şimdi';
    } else if (diffInMinutes < 60) {
        return t ? t('common.minutesAgo', { count: diffInMinutes }) : `${diffInMinutes} dakika önce`;
    } else if (diffInHours < 24) {
        return t ? t('common.hoursAgo', { count: diffInHours }) : `${diffInHours} saat önce`;
    } else if (diffInDays < 7) {
        return t ? t('common.daysAgo', { count: diffInDays }) : `${diffInDays} gün önce`;
    } else {
        return formatDate(parsedDate, locale);
    }
}

// Format date for tooltip with locale support
export function formatDateForTooltip(date: Date | string | null | undefined, locale: string = 'tr'): string {
    const dateObj = parseDate(date);

    if (!dateObj) return '';

    const isTurkish = locale === 'tr';

    return dateObj.toLocaleString(isTurkish ? 'tr-TR' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        weekday: 'long'
    });
}
