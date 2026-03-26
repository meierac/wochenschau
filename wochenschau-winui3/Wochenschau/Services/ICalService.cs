using System.Net.Http;
using System.Text;
using Wochenschau.Helpers;
using Wochenschau.Models;

namespace Wochenschau.Services;

/// <summary>
/// Fetches and parses iCal (.ics) subscriptions into <see cref="CalendarItem"/> objects.
/// Implements a lightweight VCALENDAR/VEVENT parser without external libraries.
/// </summary>
public class ICalService
{
    private static readonly HttpClient _http = new()
    {
        Timeout = TimeSpan.FromSeconds(30),
    };

    // ── Public API ────────────────────────────────────────────────────────

    /// <summary>
    /// Fetches the given iCal URL and returns parsed calendar items,
    /// tagged with the supplied subscription metadata.
    /// </summary>
    public async Task<List<CalendarItem>> FetchAndParseAsync(
        ICalSubscription sub,
        CancellationToken ct = default)
    {
        string icsText = await FetchIcsAsync(sub.Url, ct);
        return ParseIcs(icsText, sub);
    }

    // ── Fetch ─────────────────────────────────────────────────────────────

    private static async Task<string> FetchIcsAsync(string url, CancellationToken ct)
    {
        using var response = await _http.GetAsync(url, ct);
        response.EnsureSuccessStatusCode();
        // iCal files are typically UTF-8
        var bytes = await response.Content.ReadAsByteArrayAsync(ct);
        return Encoding.UTF8.GetString(bytes);
    }

    // ── Parse ─────────────────────────────────────────────────────────────

    /// <summary>
    /// Minimal VCALENDAR parser: extracts VEVENT blocks and maps them.
    /// Handles line folding (RFC 5545 §3.1).
    /// </summary>
    public static List<CalendarItem> ParseIcs(string icsText, ICalSubscription sub)
    {
        var items = new List<CalendarItem>();

        // Unfold lines (line folding: CRLF + whitespace = continuation)
        icsText = icsText.Replace("\r\n ", "").Replace("\r\n\t", "")
                         .Replace("\n ", "").Replace("\n\t", "");

        var lines = icsText.Split(new[] { "\r\n", "\n" }, StringSplitOptions.None);

        bool inVEvent = false;
        Dictionary<string, string> props = [];

        foreach (var rawLine in lines)
        {
            var line = rawLine.Trim();

            if (line.Equals("BEGIN:VEVENT", StringComparison.OrdinalIgnoreCase))
            {
                inVEvent = true;
                props = [];
                continue;
            }

            if (line.Equals("END:VEVENT", StringComparison.OrdinalIgnoreCase))
            {
                inVEvent = false;
                var item = MapVEvent(props, sub);
                if (item != null)
                    items.Add(item);
                continue;
            }

            if (!inVEvent) continue;

            // Split on first ':' – but property name can contain ';' parameters
            int colonIdx = line.IndexOf(':');
            if (colonIdx < 0) continue;

            var propNameFull = line[..colonIdx];
            var propValue = line[(colonIdx + 1)..];

            // Use only the base name (before any ';TZID=...' parameters)
            var propName = propNameFull.Contains(';')
                ? propNameFull[..propNameFull.IndexOf(';')]
                : propNameFull;

            // Last value wins (handles DTSTART;TZID=… vs DTSTART)
            props[propName.ToUpperInvariant()] = propValue;
        }

        return items;
    }

    // ── Mapping ───────────────────────────────────────────────────────────

    private static CalendarItem? MapVEvent(Dictionary<string, string> p, ICalSubscription sub)
    {
        if (!p.TryGetValue("UID", out var uid)) return null;
        if (!p.TryGetValue("DTSTART", out var dtStart)) return null;

        p.TryGetValue("DTEND", out var dtEnd);
        p.TryGetValue("SUMMARY", out var summary);
        p.TryGetValue("DESCRIPTION", out var description);

        // Parse dates
        var (startDate, startTime, isAllDay) = ParseDt(dtStart);
        if (startDate is null) return null;

        var (endDate, endTime, _) = dtEnd is not null ? ParseDt(dtEnd) : (startDate, startTime, isAllDay);

        var startDateOnly = WeekHelper.ParseYyyyMmDd(startDate)!.Value;
        int week = WeekHelper.GetIsoWeek(startDateOnly);
        int year = startDateOnly.Year;
        if (week == 1 && startDateOnly.Month == 12) year++;
        if (week >= 52 && startDateOnly.Month == 1) year--;

        return new CalendarItem
        {
            Id           = $"ical_{SanitizeId(uid)}",
            Summary      = UnescapeIcal(summary ?? "(kein Titel)"),
            Description  = description is not null ? UnescapeIcal(description) : null,
            StartDate    = startDate,
            EndDate      = endDate ?? startDate,
            StartTime    = startTime ?? string.Empty,
            EndTime      = endTime ?? string.Empty,
            Day          = WeekHelper.GetDayIndex(startDateOnly),
            Week         = week,
            Year         = year,
            IsAllDay     = isAllDay,
            Source       = "ical",
            SourceId     = sub.Id,
            Uid          = uid,
            Color        = sub.Color,
            CreatedAt    = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
            LastModified = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
        };
    }

    // ── Date / time parsing ───────────────────────────────────────────────

    /// <summary>
    /// Parses an iCal date/time value.
    /// Returns (YYYYMMDD, HH:mm|null, isAllDay).
    /// </summary>
    private static (string? date, string? time, bool isAllDay) ParseDt(string value)
    {
        // Strip TZID or VALUE=DATE prefix that may have leaked through
        if (value.Contains(':'))
            value = value[(value.LastIndexOf(':') + 1)..];

        value = value.TrimEnd('Z');

        if (value.Length == 8)
        {
            // DATE only: YYYYMMDD
            return (value, null, true);
        }

        if (value.Length >= 15 && value[8] == 'T')
        {
            // DATETIME: YYYYMMDDTHHmmss
            var date = value[..8];
            var hh = value[9..11];
            var mm = value[11..13];
            return (date, $"{hh}:{mm}", false);
        }

        return (null, null, false);
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private static string SanitizeId(string uid)
        => new string(uid.Where(c => char.IsLetterOrDigit(c) || c == '-' || c == '_').ToArray());

    private static string UnescapeIcal(string s)
        => s.Replace("\\n", "\n").Replace("\\,", ",").Replace("\\;", ";").Replace("\\\\", "\\");
}
