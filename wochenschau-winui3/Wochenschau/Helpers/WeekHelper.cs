using System.Globalization;

namespace Wochenschau.Helpers;

/// <summary>
/// Date / ISO-week utility methods – mirrors date.ts from the Svelte app.
/// </summary>
public static class WeekHelper
{
    private static readonly string[] WeekdayNamesDE =
        ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];

    private static readonly string[] WeekdayNamesShortDE =
        ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

    // ── ISO week helpers ──────────────────────────────────────────────────

    /// <summary>Returns the ISO 8601 week number for the given date.</summary>
    public static int GetIsoWeek(DateOnly date)
    {
        var cal = CultureInfo.InvariantCulture.Calendar;
        return cal.GetWeekOfYear(date.ToDateTime(TimeOnly.MinValue),
            CalendarWeekRule.FirstFourDayWeek, DayOfWeek.Monday);
    }

    /// <summary>Returns the Monday that starts the specified ISO week.</summary>
    public static DateOnly GetMondayOfWeek(int year, int week)
    {
        // Jan 4 is always in week 1 (ISO 8601)
        var jan4 = new DateTime(year, 1, 4);
        int dayOfWeek = (int)jan4.DayOfWeek; // 0=Sunday
        // Convert to Mon=0..Sun=6
        int mondayOffset = dayOfWeek == 0 ? 6 : dayOfWeek - 1;
        var weekOneMonday = jan4.AddDays(-mondayOffset);
        return DateOnly.FromDateTime(weekOneMonday.AddDays((week - 1) * 7));
    }

    /// <summary>Returns all 7 days (Mon–Sun) of the given ISO week.</summary>
    public static IReadOnlyList<DateOnly> GetDaysOfWeek(int year, int week)
    {
        var monday = GetMondayOfWeek(year, week);
        return Enumerable.Range(0, 7).Select(i => monday.AddDays(i)).ToList();
    }

    /// <summary>Day-of-week index: Monday = 0, Sunday = 6.</summary>
    public static int GetDayIndex(DateOnly date)
    {
        var dow = date.DayOfWeek;
        return dow == DayOfWeek.Sunday ? 6 : (int)dow - 1;
    }

    /// <summary>Full German weekday name (Monday = "Montag").</summary>
    public static string GetWeekdayNameDE(int dayIndex) => WeekdayNamesDE[dayIndex];

    /// <summary>Short German weekday name (Monday = "Mo").</summary>
    public static string GetWeekdayShortDE(int dayIndex) => WeekdayNamesShortDE[dayIndex];

    /// <summary>Returns (week, year) for today.</summary>
    public static (int week, int year) GetCurrentWeekAndYear()
    {
        var today = DateOnly.FromDateTime(DateTime.Today);
        int week = GetIsoWeek(today);
        int year = today.Year;
        // Handle week 52/53 overlapping December → January
        if (week == 1 && today.Month == 12) year++;
        if (week >= 52 && today.Month == 1) year--;
        return (week, year);
    }

    /// <summary>Formats a date as YYYYMMDD.</summary>
    public static string ToYyyyMmDd(DateOnly d) => d.ToString("yyyyMMdd");

    /// <summary>Parses a YYYYMMDD string to DateOnly.</summary>
    public static DateOnly? ParseYyyyMmDd(string? s)
    {
        if (string.IsNullOrWhiteSpace(s)) return null;
        if (DateOnly.TryParseExact(s, "yyyyMMdd", out var d)) return d;
        return null;
    }
}
