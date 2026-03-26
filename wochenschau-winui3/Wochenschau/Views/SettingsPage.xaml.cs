using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using Wochenschau.Dialogs;
using Wochenschau.Models;
using Wochenschau.ViewModels;

namespace Wochenschau.Views;

/// <summary>
/// Settings page: iCal subscriptions and activity templates.
/// </summary>
public sealed partial class SettingsPage : Page
{
    public SettingsViewModel ViewModel { get; }

    // Visibility helpers for empty-state messages
    public Visibility EmptySubscriptionsVisible
        => ViewModel.Subscriptions.Count == 0 ? Visibility.Visible : Visibility.Collapsed;

    public Visibility EmptyTemplatesVisible
        => ViewModel.Templates.Count == 0 ? Visibility.Visible : Visibility.Collapsed;

    public SettingsPage()
    {
        ViewModel = new SettingsViewModel(App.Database);
        InitializeComponent();
        Loaded += OnLoaded;
    }

    private async void OnLoaded(object sender, RoutedEventArgs e)
    {
        await ViewModel.LoadCommand.ExecuteAsync(null);
        // Trigger re-evaluate visibility bindings
        Bindings.Update();
    }

    // ── Subscriptions ─────────────────────────────────────────────────────

    private async void AddSubscriptionButton_Click(object sender, RoutedEventArgs e)
    {
        var dialog = new AddSubscriptionDialog(XamlRoot);
        var result = await dialog.ShowAsync();
        if (result == ContentDialogResult.Primary && dialog.Result != null)
        {
            await ViewModel.AddSubscriptionCommand.ExecuteAsync(dialog.Result);
            Bindings.Update();
        }
    }

    private async void DeleteSubscriptionButton_Click(object sender, RoutedEventArgs e)
    {
        if (sender is FrameworkElement fe && fe.Tag is string id)
        {
            var confirm = new ContentDialog
            {
                XamlRoot = XamlRoot,
                Title = "Abonnement löschen",
                Content = "Soll dieses Abonnement und alle zugehörigen Ereignisse gelöscht werden?",
                PrimaryButtonText = "Löschen",
                CloseButtonText = "Abbrechen",
            };
            var r = await confirm.ShowAsync();
            if (r == ContentDialogResult.Primary)
            {
                await ViewModel.DeleteSubscriptionCommand.ExecuteAsync(id);
                Bindings.Update();
            }
        }
    }

    private async void SubToggle_Toggled(object sender, RoutedEventArgs e)
    {
        if (sender is ToggleSwitch ts && ts.Tag is string id)
        {
            var sub = ViewModel.Subscriptions.FirstOrDefault(s => s.Id == id);
            if (sub != null)
                await ViewModel.ToggleSubscriptionCommand.ExecuteAsync(sub);
        }
    }

    // ── Templates ─────────────────────────────────────────────────────────

    private async void AddTemplateButton_Click(object sender, RoutedEventArgs e)
    {
        var dialog = new TemplateDialog(XamlRoot, null);
        var result = await dialog.ShowAsync();
        if (result == ContentDialogResult.Primary && dialog.Result != null)
        {
            await ViewModel.AddTemplateCommand.ExecuteAsync(dialog.Result);
            Bindings.Update();
        }
    }

    private async void DeleteTemplateButton_Click(object sender, RoutedEventArgs e)
    {
        if (sender is FrameworkElement fe && fe.Tag is string id)
        {
            await ViewModel.DeleteTemplateCommand.ExecuteAsync(id);
            Bindings.Update();
        }
    }
}
