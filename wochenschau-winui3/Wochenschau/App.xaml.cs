using Microsoft.UI.Xaml;
using Wochenschau.Services;

namespace Wochenschau;

/// <summary>
/// Provides application-specific behavior to supplement the default Application class.
/// </summary>
public partial class App : Application
{
    private MainWindow? _window;

    public static DatabaseService Database { get; private set; } = null!;

    public App()
    {
        InitializeComponent();
    }

    protected override async void OnLaunched(LaunchActivatedEventArgs args)
    {
        // Initialize database
        Database = new DatabaseService();
        await Database.InitializeAsync();

        _window = new MainWindow();
        _window.Activate();
    }
}
