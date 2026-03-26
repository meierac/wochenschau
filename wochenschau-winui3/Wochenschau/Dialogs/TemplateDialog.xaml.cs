using Microsoft.UI.Xaml.Controls;
using Wochenschau.Models;

namespace Wochenschau.Dialogs;

/// <summary>
/// Dialog to create or edit an <see cref="ActivityTemplate"/>.
/// </summary>
public sealed partial class TemplateDialog : ContentDialog
{
    public ActivityTemplate? Result { get; private set; }
    public bool IsSaveEnabled { get; private set; }

    private readonly ActivityTemplate? _existing;

    public TemplateDialog(Microsoft.UI.Xaml.XamlRoot xamlRoot, ActivityTemplate? existing)
    {
        _existing = existing;
        XamlRoot = xamlRoot;
        Title = existing is null ? "Vorlage erstellen" : "Vorlage bearbeiten";
        InitializeComponent();

        if (existing is not null)
        {
            NameBox.Text = existing.Name;
            StartTimeBox.Text = existing.StartTime;
            EndTimeBox.Text = existing.EndTime;
            DescriptionBox.Text = existing.Description ?? string.Empty;
        }

        PrimaryButtonClick += OnSave;
        Validate(null!, null!);
    }

    private void OnSave(ContentDialog sender, ContentDialogButtonClickEventArgs args)
    {
        var name = NameBox.Text.Trim();
        if (string.IsNullOrWhiteSpace(name)) { args.Cancel = true; return; }

        Result = new ActivityTemplate
        {
            Id          = _existing?.Id ?? Guid.NewGuid().ToString(),
            Name        = name,
            StartTime   = StartTimeBox.Text.Trim(),
            EndTime     = EndTimeBox.Text.Trim(),
            Description = string.IsNullOrWhiteSpace(DescriptionBox.Text) ? null : DescriptionBox.Text.Trim(),
            CreatedAt   = _existing?.CreatedAt ?? DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
        };
    }

    private void Validate(object sender, TextChangedEventArgs e)
    {
        IsSaveEnabled = !string.IsNullOrWhiteSpace(NameBox?.Text);
        Bindings.Update();
    }
}
