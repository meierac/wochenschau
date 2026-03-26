using Microsoft.UI.Xaml.Controls;
using Wochenschau.Models;

namespace Wochenschau.Dialogs;

/// <summary>
/// Dialog to add a new iCal subscription.
/// </summary>
public sealed partial class AddSubscriptionDialog : ContentDialog
{
    public ICalSubscription? Result { get; private set; }
    public bool IsSaveEnabled { get; private set; }

    public AddSubscriptionDialog(Microsoft.UI.Xaml.XamlRoot xamlRoot)
    {
        XamlRoot = xamlRoot;
        InitializeComponent();
        PrimaryButtonClick += OnSave;
    }

    private void OnSave(ContentDialog sender, ContentDialogButtonClickEventArgs args)
    {
        var name = NameBox.Text.Trim();
        var url = UrlBox.Text.Trim();
        if (string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(url))
        {
            args.Cancel = true;
            return;
        }

        Result = new ICalSubscription
        {
            Name         = name,
            Url          = url,
            Color        = string.IsNullOrWhiteSpace(ColorBox.Text) ? null : ColorBox.Text.Trim(),
            SyncInterval = (int)(SyncIntervalBox.Value),
        };
    }

    private void Validate(object sender, Microsoft.UI.Xaml.Controls.TextChangedEventArgs e)
    {
        IsSaveEnabled = !string.IsNullOrWhiteSpace(NameBox?.Text)
                     && !string.IsNullOrWhiteSpace(UrlBox?.Text);
        Bindings.Update();
    }
}
