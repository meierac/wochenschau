namespace Wochenschau.Models;

/// <summary>
/// A reusable activity template that can quickly seed a new CalendarItem.
/// </summary>
public class ActivityTemplate
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Name { get; set; } = string.Empty;
    public string StartTime { get; set; } = "08:00";
    public string EndTime { get; set; } = "09:00";
    public string? Description { get; set; }
    public long CreatedAt { get; set; } = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
}
