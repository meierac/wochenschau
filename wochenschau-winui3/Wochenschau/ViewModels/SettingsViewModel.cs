using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using System.Collections.ObjectModel;
using Wochenschau.Models;
using Wochenschau.Services;

namespace Wochenschau.ViewModels;

/// <summary>
/// ViewModel for the Settings page.
/// Manages iCal subscriptions and activity templates.
/// </summary>
public partial class SettingsViewModel : ObservableObject
{
    private readonly DatabaseService _db;

    public ObservableCollection<ICalSubscription> Subscriptions { get; } = [];
    public ObservableCollection<ActivityTemplate> Templates { get; } = [];

    public SettingsViewModel(DatabaseService db)
    {
        _db = db;
    }

    // ── Load ──────────────────────────────────────────────────────────────

    [RelayCommand]
    public async Task LoadAsync()
    {
        var subs = await _db.GetSubscriptionsAsync();
        Subscriptions.Clear();
        foreach (var s in subs) Subscriptions.Add(s);

        var templates = await _db.GetTemplatesAsync();
        Templates.Clear();
        foreach (var t in templates) Templates.Add(t);
    }

    // ── Subscriptions ─────────────────────────────────────────────────────

    [RelayCommand]
    public async Task AddSubscriptionAsync(ICalSubscription sub)
    {
        await _db.UpsertSubscriptionAsync(sub);
        Subscriptions.Add(sub);
    }

    [RelayCommand]
    public async Task DeleteSubscriptionAsync(string id)
    {
        await _db.DeleteSubscriptionAsync(id);
        await _db.DeleteItemsBySourceAsync(id);
        var existing = Subscriptions.FirstOrDefault(s => s.Id == id);
        if (existing is not null) Subscriptions.Remove(existing);
    }

    [RelayCommand]
    public async Task ToggleSubscriptionAsync(ICalSubscription sub)
    {
        sub.Enabled = !sub.Enabled;
        await _db.UpsertSubscriptionAsync(sub);
        await LoadAsync();
    }

    // ── Templates ─────────────────────────────────────────────────────────

    [RelayCommand]
    public async Task AddTemplateAsync(ActivityTemplate template)
    {
        await _db.UpsertTemplateAsync(template);
        Templates.Add(template);
    }

    [RelayCommand]
    public async Task DeleteTemplateAsync(string id)
    {
        await _db.DeleteTemplateAsync(id);
        var existing = Templates.FirstOrDefault(t => t.Id == id);
        if (existing is not null) Templates.Remove(existing);
    }
}
