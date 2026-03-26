namespace Wochenschau.Models;

/// <summary>
/// An iCal calendar subscription (remote URL the app periodically fetches).
/// </summary>
public class ICalSubscription
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Url { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public bool Enabled { get; set; } = true;
    public long? LastFetched { get; set; }
    public string? Color { get; set; }

    /// <summary>Auto-refresh interval in minutes (0 = manual only).</summary>
    public int SyncInterval { get; set; } = 60;
}
