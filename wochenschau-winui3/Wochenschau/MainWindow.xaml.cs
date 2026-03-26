using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using Wochenschau.Views;

namespace Wochenschau;

/// <summary>
/// Main application window with NavigationView.
/// </summary>
public sealed partial class MainWindow : Window
{
    public MainWindow()
    {
        InitializeComponent();
        Title = "Wochenschau";
        ExtendsContentIntoTitleBar = true;

        // Navigate to WeekPage on startup
        ContentFrame.Navigate(typeof(WeekPage));
        NavView.SelectedItem = NavView.MenuItems[0];
    }

    private void NavView_SelectionChanged(NavigationView sender, NavigationViewSelectionChangedEventArgs args)
    {
        if (args.SelectedItem is NavigationViewItem item)
        {
            var tag = item.Tag?.ToString();
            var pageType = tag switch
            {
                "WeekPage" => typeof(WeekPage),
                "SettingsPage" => typeof(SettingsPage),
                _ => typeof(WeekPage)
            };

            if (ContentFrame.CurrentSourcePageType != pageType)
                ContentFrame.Navigate(pageType);
        }
    }
}
