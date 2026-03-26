using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using Microsoft.UI.Xaml.Data;
using Microsoft.UI.Xaml.Input;
using Wochenschau.Dialogs;
using Wochenschau.Helpers;
using Wochenschau.Models;
using Wochenschau.Services;
using Wochenschau.ViewModels;

namespace Wochenschau.Views;

/// <summary>
/// Shows the weekly calendar grid with per-day activity columns.
/// </summary>
public sealed partial class WeekPage : Page
{
    public WeekViewModel ViewModel { get; }

    public WeekPage()
    {
        ViewModel = new WeekViewModel(App.Database, new ICalService());
        InitializeComponent();
        Loaded += OnLoaded;
    }

    private async void OnLoaded(object sender, RoutedEventArgs e)
    {
        await ViewModel.LoadWeekCommand.ExecuteAsync(null);
    }

    // ── Add activity ──────────────────────────────────────────────────────

    private async void AddActivityButton_Click(object sender, RoutedEventArgs e)
    {
        var dialog = new ActivityDialog(XamlRoot, null)
        {
            Title = "Aktivität hinzufügen"
        };
        var result = await dialog.ShowAsync();
        if (result == ContentDialogResult.Primary && dialog.Result != null)
        {
            var item = dialog.Result;
            // Set week/year from currently viewed week and compute the date
            item.Week = ViewModel.CurrentWeek;
            item.Year = ViewModel.CurrentYear;
            var days = WeekHelper.GetDaysOfWeek(item.Year, item.Week);
            var date = days[item.Day];
            item.StartDate = WeekHelper.ToYyyyMmDd(date);
            item.EndDate = WeekHelper.ToYyyyMmDd(date);
            await ViewModel.AddActivityCommand.ExecuteAsync(item);
        }
    }

    // ── Edit / delete activity ────────────────────────────────────────────

    private async void ActivityCard_PointerPressed(object sender, PointerRoutedEventArgs e)
    {
        if (sender is FrameworkElement fe && fe.Tag is CalendarItem item)
        {
            var dialog = new ActivityDialog(XamlRoot, item)
            {
                Title = "Aktivität bearbeiten"
            };
            var result = await dialog.ShowAsync();

            if (result == ContentDialogResult.Primary && dialog.Result != null)
            {
                var updated = dialog.Result;
                updated.Id = item.Id;
                updated.Week = item.Week;
                updated.Year = item.Year;
                // Recompute date if day changed
                var days = WeekHelper.GetDaysOfWeek(item.Year, item.Week);
                var date = days[updated.Day];
                updated.StartDate = WeekHelper.ToYyyyMmDd(date);
                updated.EndDate = WeekHelper.ToYyyyMmDd(date);
                await ViewModel.UpdateActivityCommand.ExecuteAsync(updated);
            }
            else if (result == ContentDialogResult.Secondary)
            {
                // Secondary button = Delete
                await ViewModel.DeleteActivityCommand.ExecuteAsync(item.Id);
            }
        }
    }
}

// ── Value Converters ──────────────────────────────────────────────────────────

public class BoolNegationConverter : IValueConverter
{
    public object Convert(object value, Type targetType, object parameter, string language)
        => value is bool b && !b;
    public object ConvertBack(object value, Type targetType, object parameter, string language)
        => value is bool b && !b;
}

public class BoolToVisibilityConverter : IValueConverter
{
    public object Convert(object value, Type targetType, object parameter, string language)
        => value is bool b && b ? Visibility.Visible : Visibility.Collapsed;
    public object ConvertBack(object value, Type targetType, object parameter, string language)
        => value is Visibility v && v == Visibility.Visible;
}

public class StringToVisibilityConverter : IValueConverter
{
    public object Convert(object value, Type targetType, object parameter, string language)
        => value is string s && !string.IsNullOrWhiteSpace(s) ? Visibility.Visible : Visibility.Collapsed;
    public object ConvertBack(object value, Type targetType, object parameter, string language)
        => throw new NotImplementedException();
}
