using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using System.Collections.ObjectModel;
using Wochenschau.Helpers;
using Wochenschau.Models;
using Wochenschau.Services;

namespace Wochenschau.ViewModels;

/// <summary>
/// ViewModel for the weekly calendar view.
/// Holds all activities for the currently displayed week and exposes
/// per-day collections for binding to the XAML grid.
/// </summary>
public partial class WeekViewModel : ObservableObject
{
    private readonly DatabaseService _db;
    private readonly ICalService _ical;

    // ── Observable state ──────────────────────────────────────────────────

    [ObservableProperty]
    private int _currentWeek;

    [ObservableProperty]
    private int _currentYear;

    [ObservableProperty]
    private bool _isRefreshing;

    [ObservableProperty]
    private string _statusMessage = string.Empty;

    /// <summary>Activities for the current week, grouped by day (0=Mon..6=Sun).</summary>
    public ObservableCollection<DayColumn> DayColumns { get; } = [];

    public WeekViewModel(DatabaseService db, ICalService ical)
    {
        _db = db;
        _ical = ical;

        var (week, year) = WeekHelper.GetCurrentWeekAndYear();
        _currentWeek = week;
        _currentYear = year;
    }

    // ── Commands ──────────────────────────────────────────────────────────

    [RelayCommand]
    public async Task LoadWeekAsync()
    {
        var items = await _db.GetItemsByWeekAsync(CurrentWeek, CurrentYear);
        var days = WeekHelper.GetDaysOfWeek(CurrentYear, CurrentWeek);

        DayColumns.Clear();
        for (int i = 0; i < 7; i++)
        {
            var day = days[i];
            var column = new DayColumn
            {
                DayIndex = i,
                Date = day,
                Header = $"{WeekHelper.GetWeekdayShortDE(i)} {day.Day:D2}.{day.Month:D2}",
            };
            foreach (var item in items.Where(x => x.Day == i))
                column.Items.Add(item);
            DayColumns.Add(column);
        }
    }

    [RelayCommand]
    public async Task PreviousWeekAsync()
    {
        (CurrentWeek, CurrentYear) = DecrementWeek(CurrentWeek, CurrentYear);
        await LoadWeekAsync();
    }

    [RelayCommand]
    public async Task NextWeekAsync()
    {
        (CurrentWeek, CurrentYear) = IncrementWeek(CurrentWeek, CurrentYear);
        await LoadWeekAsync();
    }

    [RelayCommand]
    public async Task GoToTodayAsync()
    {
        var (week, year) = WeekHelper.GetCurrentWeekAndYear();
        CurrentWeek = week;
        CurrentYear = year;
        await LoadWeekAsync();
    }

    [RelayCommand]
    public async Task AddActivityAsync(CalendarItem item)
    {
        await _db.UpsertItemAsync(item);
        await LoadWeekAsync();
    }

    [RelayCommand]
    public async Task UpdateActivityAsync(CalendarItem item)
    {
        item.LastModified = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        await _db.UpsertItemAsync(item);
        await LoadWeekAsync();
    }

    [RelayCommand]
    public async Task DeleteActivityAsync(string id)
    {
        await _db.DeleteItemAsync(id);
        await LoadWeekAsync();
    }

    [RelayCommand]
    public async Task RefreshSubscriptionsAsync()
    {
        IsRefreshing = true;
        StatusMessage = "Kalender werden aktualisiert…";
        try
        {
            var subs = await _db.GetSubscriptionsAsync();
            foreach (var sub in subs.Where(s => s.Enabled))
            {
                try
                {
                    StatusMessage = $"Lade {sub.Name}…";
                    var items = await _ical.FetchAndParseAsync(sub);
                    // Remove old items from this subscription, then add fresh ones
                    await _db.DeleteItemsBySourceAsync(sub.Id);
                    foreach (var item in items)
                        await _db.UpsertItemAsync(item);
                    sub.LastFetched = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
                    await _db.UpsertSubscriptionAsync(sub);
                }
                catch (Exception ex)
                {
                    StatusMessage = $"Fehler bei {sub.Name}: {ex.Message}";
                    await Task.Delay(1500);
                }
            }
            StatusMessage = "Aktualisiert ✓";
            await LoadWeekAsync();
        }
        finally
        {
            IsRefreshing = false;
            await Task.Delay(2000);
            StatusMessage = string.Empty;
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private static (int week, int year) IncrementWeek(int week, int year)
    {
        week++;
        int maxWeek = GetMaxWeek(year);
        if (week > maxWeek) { week = 1; year++; }
        return (week, year);
    }

    private static (int week, int year) DecrementWeek(int week, int year)
    {
        week--;
        if (week < 1) { year--; week = GetMaxWeek(year); }
        return (week, year);
    }

    private static int GetMaxWeek(int year)
    {
        // Dec 28 is always in the last ISO week of the year
        return WeekHelper.GetIsoWeek(new DateOnly(year, 12, 28));
    }
}

/// <summary>Represents one day column in the weekly grid.</summary>
public class DayColumn
{
    public int DayIndex { get; set; }
    public DateOnly Date { get; set; }
    public string Header { get; set; } = string.Empty;
    public ObservableCollection<CalendarItem> Items { get; } = [];
}
