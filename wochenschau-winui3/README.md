# Wochenschau – WinUI 3 Windows App

A native Windows desktop app that mirrors all the features of the original Wochenschau Svelte PWA.

## Features

| Feature | Status |
|---------|--------|
| Weekly calendar grid (Mon – Sun) | ✅ |
| Add / edit / delete activities | ✅ |
| All-day and timed events | ✅ |
| iCal subscription import & sync | ✅ |
| Activity templates | ✅ |
| Persistent local storage (SQLite) | ✅ |
| Light / Dark mode (follows Windows theme) | ✅ |
| Per-MonitorV2 DPI-aware | ✅ |

## Tech stack

| Layer | Technology |
|-------|-----------|
| UI framework | WinUI 3 (Windows App SDK 1.6) |
| Language | C# 12 / .NET 8 |
| MVVM | CommunityToolkit.Mvvm 8.x |
| Local storage | SQLite via Microsoft.Data.Sqlite |
| iCal parsing | Built-in (no external library) |

## Requirements

* **Windows 10 version 1809** (build 17763) or newer – Windows 11 recommended
* **Visual Studio 2022** (17.8 or newer) with:
  * `.NET Desktop Development` workload
  * `Windows App SDK C# Templates` (VSIX, installed automatically via NuGet)

## Getting started

### 1 – Clone & open

```powershell
git clone https://github.com/meierac/wochenschau
cd wochenschau\wochenschau-winui3
start Wochenschau.sln
```

### 2 – Restore NuGet packages

Visual Studio does this automatically on first build.  
Alternatively, from the Developer Command Prompt:

```powershell
dotnet restore Wochenschau\Wochenschau.csproj
```

### 3 – Build & run

* Select the `Debug | x64` configuration in the toolbar (or `Release | x64` for production)
* Press **F5** or `Debug → Start Debugging`

> **Note:** The first build downloads the Windows App SDK runtime automatically.  
> If you see a `NETSDK1147` error, install the [Windows App SDK runtime](https://learn.microsoft.com/en-us/windows/apps/windows-app-sdk/downloads).

### 4 – Data location

All data is stored in:

```
%LOCALAPPDATA%\Wochenschau\wochenschau.db
```

## Project structure

```
wochenschau-winui3/
├── Wochenschau.sln
└── Wochenschau/
    ├── App.xaml / App.xaml.cs          – Application entry-point
    ├── MainWindow.xaml / .cs           – NavigationView shell
    ├── Models/
    │   ├── CalendarItem.cs             – Activity / event model
    │   ├── ActivityTemplate.cs         – Reusable activity template
    │   └── ICalSubscription.cs         – iCal feed subscription
    ├── Services/
    │   ├── DatabaseService.cs          – SQLite CRUD service
    │   └── ICalService.cs              – Fetch + parse iCal feeds
    ├── Helpers/
    │   └── WeekHelper.cs               – ISO-week date utilities
    ├── ViewModels/
    │   ├── WeekViewModel.cs            – State for the weekly grid
    │   └── SettingsViewModel.cs        – State for settings page
    ├── Views/
    │   ├── WeekPage.xaml / .cs         – Weekly calendar grid
    │   └── SettingsPage.xaml / .cs     – Subscriptions & templates
    └── Dialogs/
        ├── ActivityDialog.xaml / .cs   – Add / edit activity
        ├── AddSubscriptionDialog.xaml / .cs
        └── TemplateDialog.xaml / .cs
```

## iCal subscriptions

1. Open **Einstellungen** (Settings) from the left navigation
2. Click **+ Hinzufügen** under *iCal-Abonnements*
3. Enter the name and the `.ics` URL (e.g. a Google Calendar private link)
4. Click the refresh button (↻) in the toolbar to sync immediately

## Contributing

Please follow the contribution guidelines in the root `README.md`.
