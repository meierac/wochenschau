namespace Wochenschau.Models;

/// <summary>
/// Represents a single calendar entry (activity/event).
/// Mirrors the CalendarItem type from the original Svelte app.
/// </summary>
public class CalendarItem
{
    public string Id { get; set; } = Guid.NewGuid().ToString();

    /// <summary>Event title.</summary>
    public string Summary { get; set; } = string.Empty;

    /// <summary>Optional event description.</summary>
    public string? Description { get; set; }

    /// <summary>Start date in YYYYMMDD format.</summary>
    public string StartDate { get; set; } = string.Empty;

    /// <summary>End date in YYYYMMDD format.</summary>
    public string EndDate { get; set; } = string.Empty;

    /// <summary>Start time as HH:mm (empty for all-day events).</summary>
    public string StartTime { get; set; } = string.Empty;

    /// <summary>End time as HH:mm (empty for all-day events).</summary>
    public string EndTime { get; set; } = string.Empty;

    /// <summary>Day-of-week index: 0 = Monday … 6 = Sunday.</summary>
    public int Day { get; set; }

    /// <summary>ISO week number.</summary>
    public int Week { get; set; }

    /// <summary>Year.</summary>
    public int Year { get; set; }

    /// <summary>True when the event occupies the whole day.</summary>
    public bool IsAllDay { get; set; }

    /// <summary>Origin of this item: manual, ical, or template.</summary>
    public string Source { get; set; } = "manual";

    /// <summary>ID of the iCal subscription or template this came from.</summary>
    public string? SourceId { get; set; }

    /// <summary>Original iCal UID (for sync tracking).</summary>
    public string? Uid { get; set; }

    /// <summary>Hex color override, e.g. "#4F46E5".</summary>
    public string? Color { get; set; }

    /// <summary>Creation timestamp (Unix ms).</summary>
    public long CreatedAt { get; set; } = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

    /// <summary>Last-modified timestamp (Unix ms).</summary>
    public long LastModified { get; set; } = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

    // ── Computed helpers ──────────────────────────────────────────────────

    /// <summary>Parses StartDate as a <see cref="DateOnly"/>.</summary>
    public DateOnly GetStartDateOnly()
    {
        if (DateOnly.TryParseExact(StartDate, "yyyyMMdd", out var d)) return d;
        return DateOnly.FromDateTime(DateTime.Today);
    }

    /// <summary>Display label like "09:00 – 10:30" or "Ganztags".</summary>
    public string TimeLabel => IsAllDay
        ? "Ganztags"
        : string.IsNullOrEmpty(StartTime) ? string.Empty : $"{StartTime} – {EndTime}";
}
