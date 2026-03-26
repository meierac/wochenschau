using Microsoft.Data.Sqlite;
using System.Text.Json;
using Wochenschau.Models;

namespace Wochenschau.Services;

/// <summary>
/// SQLite-backed persistence service.
/// Data is stored in %LOCALAPPDATA%\Wochenschau\wochenschau.db
/// </summary>
public class DatabaseService : IDisposable
{
    private readonly string _dbPath;
    private SqliteConnection? _connection;

    public DatabaseService()
    {
        var folder = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "Wochenschau");
        Directory.CreateDirectory(folder);
        _dbPath = Path.Combine(folder, "wochenschau.db");
    }

    // ── Lifecycle ─────────────────────────────────────────────────────────

    public async Task InitializeAsync()
    {
        _connection = new SqliteConnection($"Data Source={_dbPath}");
        await _connection.OpenAsync();
        await CreateTablesAsync();
    }

    private async Task CreateTablesAsync()
    {
        var cmd = _connection!.CreateCommand();
        cmd.CommandText = """
            CREATE TABLE IF NOT EXISTS CalendarItems (
                Id          TEXT PRIMARY KEY,
                Summary     TEXT NOT NULL,
                Description TEXT,
                StartDate   TEXT NOT NULL,
                EndDate     TEXT NOT NULL,
                StartTime   TEXT,
                EndTime     TEXT,
                Day         INTEGER NOT NULL,
                Week        INTEGER NOT NULL,
                Year        INTEGER NOT NULL,
                IsAllDay    INTEGER NOT NULL DEFAULT 0,
                Source      TEXT NOT NULL DEFAULT 'manual',
                SourceId    TEXT,
                Uid         TEXT,
                Color       TEXT,
                CreatedAt   INTEGER NOT NULL,
                LastModified INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS Templates (
                Id          TEXT PRIMARY KEY,
                Name        TEXT NOT NULL,
                StartTime   TEXT NOT NULL,
                EndTime     TEXT NOT NULL,
                Description TEXT,
                CreatedAt   INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS ICalSubscriptions (
                Id           TEXT PRIMARY KEY,
                Url          TEXT NOT NULL,
                Name         TEXT NOT NULL,
                Enabled      INTEGER NOT NULL DEFAULT 1,
                LastFetched  INTEGER,
                Color        TEXT,
                SyncInterval INTEGER NOT NULL DEFAULT 60
            );
            """;
        await cmd.ExecuteNonQueryAsync();
    }

    // ── CalendarItems ─────────────────────────────────────────────────────

    public async Task<List<CalendarItem>> GetItemsAsync()
    {
        var items = new List<CalendarItem>();
        var cmd = _connection!.CreateCommand();
        cmd.CommandText = "SELECT * FROM CalendarItems ORDER BY StartDate, StartTime";
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
            items.Add(MapItem(reader));
        return items;
    }

    public async Task<List<CalendarItem>> GetItemsByWeekAsync(int week, int year)
    {
        var items = new List<CalendarItem>();
        var cmd = _connection!.CreateCommand();
        cmd.CommandText = "SELECT * FROM CalendarItems WHERE Week = @w AND Year = @y ORDER BY Day, StartTime";
        cmd.Parameters.AddWithValue("@w", week);
        cmd.Parameters.AddWithValue("@y", year);
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
            items.Add(MapItem(reader));
        return items;
    }

    public async Task UpsertItemAsync(CalendarItem item)
    {
        var cmd = _connection!.CreateCommand();
        cmd.CommandText = """
            INSERT INTO CalendarItems
                (Id, Summary, Description, StartDate, EndDate, StartTime, EndTime,
                 Day, Week, Year, IsAllDay, Source, SourceId, Uid, Color, CreatedAt, LastModified)
            VALUES
                (@id, @summary, @desc, @startDate, @endDate, @startTime, @endTime,
                 @day, @week, @year, @isAllDay, @source, @sourceId, @uid, @color, @createdAt, @lastModified)
            ON CONFLICT(Id) DO UPDATE SET
                Summary      = excluded.Summary,
                Description  = excluded.Description,
                StartDate    = excluded.StartDate,
                EndDate      = excluded.EndDate,
                StartTime    = excluded.StartTime,
                EndTime      = excluded.EndTime,
                Day          = excluded.Day,
                Week         = excluded.Week,
                Year         = excluded.Year,
                IsAllDay     = excluded.IsAllDay,
                Source       = excluded.Source,
                SourceId     = excluded.SourceId,
                Uid          = excluded.Uid,
                Color        = excluded.Color,
                LastModified = excluded.LastModified;
            """;
        cmd.Parameters.AddWithValue("@id", item.Id);
        cmd.Parameters.AddWithValue("@summary", item.Summary);
        cmd.Parameters.AddWithValue("@desc", (object?)item.Description ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@startDate", item.StartDate);
        cmd.Parameters.AddWithValue("@endDate", item.EndDate);
        cmd.Parameters.AddWithValue("@startTime", (object?)item.StartTime ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@endTime", (object?)item.EndTime ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@day", item.Day);
        cmd.Parameters.AddWithValue("@week", item.Week);
        cmd.Parameters.AddWithValue("@year", item.Year);
        cmd.Parameters.AddWithValue("@isAllDay", item.IsAllDay ? 1 : 0);
        cmd.Parameters.AddWithValue("@source", item.Source);
        cmd.Parameters.AddWithValue("@sourceId", (object?)item.SourceId ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@uid", (object?)item.Uid ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@color", (object?)item.Color ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@createdAt", item.CreatedAt);
        cmd.Parameters.AddWithValue("@lastModified", item.LastModified);
        await cmd.ExecuteNonQueryAsync();
    }

    public async Task DeleteItemAsync(string id)
    {
        var cmd = _connection!.CreateCommand();
        cmd.CommandText = "DELETE FROM CalendarItems WHERE Id = @id";
        cmd.Parameters.AddWithValue("@id", id);
        await cmd.ExecuteNonQueryAsync();
    }

    public async Task DeleteItemsBySourceAsync(string sourceId)
    {
        var cmd = _connection!.CreateCommand();
        cmd.CommandText = "DELETE FROM CalendarItems WHERE SourceId = @sid";
        cmd.Parameters.AddWithValue("@sid", sourceId);
        await cmd.ExecuteNonQueryAsync();
    }

    private static CalendarItem MapItem(SqliteDataReader r) => new()
    {
        Id          = r.GetString(r.GetOrdinal("Id")),
        Summary     = r.GetString(r.GetOrdinal("Summary")),
        Description = r.IsDBNull(r.GetOrdinal("Description")) ? null : r.GetString(r.GetOrdinal("Description")),
        StartDate   = r.GetString(r.GetOrdinal("StartDate")),
        EndDate     = r.GetString(r.GetOrdinal("EndDate")),
        StartTime   = r.IsDBNull(r.GetOrdinal("StartTime")) ? string.Empty : r.GetString(r.GetOrdinal("StartTime")),
        EndTime     = r.IsDBNull(r.GetOrdinal("EndTime")) ? string.Empty : r.GetString(r.GetOrdinal("EndTime")),
        Day         = r.GetInt32(r.GetOrdinal("Day")),
        Week        = r.GetInt32(r.GetOrdinal("Week")),
        Year        = r.GetInt32(r.GetOrdinal("Year")),
        IsAllDay    = r.GetInt32(r.GetOrdinal("IsAllDay")) == 1,
        Source      = r.GetString(r.GetOrdinal("Source")),
        SourceId    = r.IsDBNull(r.GetOrdinal("SourceId")) ? null : r.GetString(r.GetOrdinal("SourceId")),
        Uid         = r.IsDBNull(r.GetOrdinal("Uid")) ? null : r.GetString(r.GetOrdinal("Uid")),
        Color       = r.IsDBNull(r.GetOrdinal("Color")) ? null : r.GetString(r.GetOrdinal("Color")),
        CreatedAt   = r.GetInt64(r.GetOrdinal("CreatedAt")),
        LastModified = r.GetInt64(r.GetOrdinal("LastModified")),
    };

    // ── Templates ─────────────────────────────────────────────────────────

    public async Task<List<ActivityTemplate>> GetTemplatesAsync()
    {
        var list = new List<ActivityTemplate>();
        var cmd = _connection!.CreateCommand();
        cmd.CommandText = "SELECT * FROM Templates ORDER BY CreatedAt";
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
            list.Add(MapTemplate(reader));
        return list;
    }

    public async Task UpsertTemplateAsync(ActivityTemplate t)
    {
        var cmd = _connection!.CreateCommand();
        cmd.CommandText = """
            INSERT INTO Templates (Id, Name, StartTime, EndTime, Description, CreatedAt)
            VALUES (@id, @name, @st, @et, @desc, @ca)
            ON CONFLICT(Id) DO UPDATE SET
                Name = excluded.Name, StartTime = excluded.StartTime,
                EndTime = excluded.EndTime, Description = excluded.Description;
            """;
        cmd.Parameters.AddWithValue("@id",   t.Id);
        cmd.Parameters.AddWithValue("@name", t.Name);
        cmd.Parameters.AddWithValue("@st",   t.StartTime);
        cmd.Parameters.AddWithValue("@et",   t.EndTime);
        cmd.Parameters.AddWithValue("@desc", (object?)t.Description ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@ca",   t.CreatedAt);
        await cmd.ExecuteNonQueryAsync();
    }

    public async Task DeleteTemplateAsync(string id)
    {
        var cmd = _connection!.CreateCommand();
        cmd.CommandText = "DELETE FROM Templates WHERE Id = @id";
        cmd.Parameters.AddWithValue("@id", id);
        await cmd.ExecuteNonQueryAsync();
    }

    private static ActivityTemplate MapTemplate(SqliteDataReader r) => new()
    {
        Id          = r.GetString(r.GetOrdinal("Id")),
        Name        = r.GetString(r.GetOrdinal("Name")),
        StartTime   = r.GetString(r.GetOrdinal("StartTime")),
        EndTime     = r.GetString(r.GetOrdinal("EndTime")),
        Description = r.IsDBNull(r.GetOrdinal("Description")) ? null : r.GetString(r.GetOrdinal("Description")),
        CreatedAt   = r.GetInt64(r.GetOrdinal("CreatedAt")),
    };

    // ── ICalSubscriptions ─────────────────────────────────────────────────

    public async Task<List<ICalSubscription>> GetSubscriptionsAsync()
    {
        var list = new List<ICalSubscription>();
        var cmd = _connection!.CreateCommand();
        cmd.CommandText = "SELECT * FROM ICalSubscriptions ORDER BY Name";
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
            list.Add(MapSubscription(reader));
        return list;
    }

    public async Task UpsertSubscriptionAsync(ICalSubscription s)
    {
        var cmd = _connection!.CreateCommand();
        cmd.CommandText = """
            INSERT INTO ICalSubscriptions (Id, Url, Name, Enabled, LastFetched, Color, SyncInterval)
            VALUES (@id, @url, @name, @enabled, @lf, @color, @si)
            ON CONFLICT(Id) DO UPDATE SET
                Url = excluded.Url, Name = excluded.Name,
                Enabled = excluded.Enabled, LastFetched = excluded.LastFetched,
                Color = excluded.Color, SyncInterval = excluded.SyncInterval;
            """;
        cmd.Parameters.AddWithValue("@id",      s.Id);
        cmd.Parameters.AddWithValue("@url",     s.Url);
        cmd.Parameters.AddWithValue("@name",    s.Name);
        cmd.Parameters.AddWithValue("@enabled", s.Enabled ? 1 : 0);
        cmd.Parameters.AddWithValue("@lf",      (object?)s.LastFetched ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@color",   (object?)s.Color ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@si",      s.SyncInterval);
        await cmd.ExecuteNonQueryAsync();
    }

    public async Task DeleteSubscriptionAsync(string id)
    {
        var cmd = _connection!.CreateCommand();
        cmd.CommandText = "DELETE FROM ICalSubscriptions WHERE Id = @id";
        cmd.Parameters.AddWithValue("@id", id);
        await cmd.ExecuteNonQueryAsync();
    }

    private static ICalSubscription MapSubscription(SqliteDataReader r) => new()
    {
        Id           = r.GetString(r.GetOrdinal("Id")),
        Url          = r.GetString(r.GetOrdinal("Url")),
        Name         = r.GetString(r.GetOrdinal("Name")),
        Enabled      = r.GetInt32(r.GetOrdinal("Enabled")) == 1,
        LastFetched  = r.IsDBNull(r.GetOrdinal("LastFetched")) ? null : r.GetInt64(r.GetOrdinal("LastFetched")),
        Color        = r.IsDBNull(r.GetOrdinal("Color")) ? null : r.GetString(r.GetOrdinal("Color")),
        SyncInterval = r.GetInt32(r.GetOrdinal("SyncInterval")),
    };

    // ── IDisposable ───────────────────────────────────────────────────────

    public void Dispose()
    {
        _connection?.Dispose();
    }
}
