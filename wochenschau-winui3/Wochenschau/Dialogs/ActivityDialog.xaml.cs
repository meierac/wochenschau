using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using Wochenschau.Helpers;
using Wochenschau.Models;

namespace Wochenschau.Dialogs;

/// <summary>
/// ContentDialog for adding or editing a <see cref="CalendarItem"/>.
/// When editing, pass the existing item; when adding, pass null.
/// After ShowAsync() returns Primary, read <see cref="Result"/>.
/// SecondaryButton = Delete (only shown when editing).
/// </summary>
public sealed partial class ActivityDialog : ContentDialog
{
    public CalendarItem? Result { get; private set; }

    public bool IsSaveEnabled { get; private set; }

    private readonly CalendarItem? _existing;

    public ActivityDialog(XamlRoot xamlRoot, CalendarItem? existing)
    {
        _existing = existing;
        XamlRoot = xamlRoot;
        InitializeComponent();

        // Hide "Löschen" when creating a new activity
        SecondaryButtonText = existing is null ? string.Empty : "Löschen";

        // Pre-fill form if editing
        if (existing is not null)
        {
            SummaryBox.Text = existing.Summary;
            DescriptionBox.Text = existing.Description ?? string.Empty;
            DayPicker.SelectedIndex = existing.Day;
            AllDayToggle.IsOn = existing.IsAllDay;
            StartTimeBox.Text = existing.StartTime;
            EndTimeBox.Text = existing.EndTime;
            ColorBox.Text = existing.Color ?? string.Empty;
        }
        else
        {
            DayPicker.SelectedIndex = 0;
        }

        TimeGrid.Visibility = (existing?.IsAllDay == true) ? Visibility.Collapsed : Visibility.Visible;

        PrimaryButtonClick += OnSave;
        ValidateForm(null, null!);
    }

    private void OnSave(ContentDialog sender, ContentDialogButtonClickEventArgs args)
    {
        if (!TryBuildResult(out var item))
        {
            args.Cancel = true;
            return;
        }
        Result = item;
    }

    private bool TryBuildResult(out CalendarItem? item)
    {
        item = null;
        var summary = SummaryBox.Text.Trim();
        if (string.IsNullOrWhiteSpace(summary)) return false;

        int day = DayPicker.SelectedIndex < 0 ? 0 : DayPicker.SelectedIndex;
        bool allDay = AllDayToggle.IsOn;

        string startTime = StartTimeBox.Text.Trim();
        string endTime = EndTimeBox.Text.Trim();

        if (!allDay)
        {
            if (!IsValidTime(startTime) || !IsValidTime(endTime)) return false;
        }

        item = new CalendarItem
        {
            Id          = _existing?.Id ?? Guid.NewGuid().ToString(),
            Summary     = summary,
            Description = string.IsNullOrWhiteSpace(DescriptionBox.Text) ? null : DescriptionBox.Text.Trim(),
            Day         = day,
            IsAllDay    = allDay,
            StartTime   = allDay ? string.Empty : startTime,
            EndTime     = allDay ? string.Empty : endTime,
            Source      = _existing?.Source ?? "manual",
            SourceId    = _existing?.SourceId,
            Color       = string.IsNullOrWhiteSpace(ColorBox.Text) ? null : ColorBox.Text.Trim(),
            CreatedAt   = _existing?.CreatedAt ?? DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
            LastModified = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
        };
        return true;
    }

    private void ValidateForm(object? sender, object e)
    {
        bool valid = !string.IsNullOrWhiteSpace(SummaryBox?.Text);
        if (AllDayToggle?.IsOn == false)
        {
            valid = valid
                && IsValidTime(StartTimeBox?.Text ?? string.Empty)
                && IsValidTime(EndTimeBox?.Text ?? string.Empty);
        }
        IsSaveEnabled = valid;
        Bindings.Update();
    }

    private static bool IsValidTime(string s)
    {
        if (string.IsNullOrWhiteSpace(s)) return false;
        var parts = s.Split(':');
        if (parts.Length != 2) return false;
        if (!int.TryParse(parts[0], out int h) || !int.TryParse(parts[1], out int m)) return false;
        return h is >= 0 and <= 23 && m is >= 0 and <= 59;
    }

    private void AllDayToggle_Toggled(object sender, RoutedEventArgs e)
    {
        if (TimeGrid is not null)
            TimeGrid.Visibility = AllDayToggle.IsOn ? Visibility.Collapsed : Visibility.Visible;
        ValidateForm(null, null!);
    }
}
