use std::{
    io::{Read, Write},
    net::TcpStream,
    time::Duration,
};

use mdns_sd::{ServiceDaemon, ServiceEvent};
use tauri::{
    image::Image,
    menu::{Menu, MenuItem, PredefinedMenuItem},
    path::BaseDirectory,
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager,
};

const DISCOVERY_TIMEOUT: Duration = Duration::from_secs(5);
const LIGHT_PORT: u16 = 9123;
const REQUEST_TIMEOUT: Duration = Duration::from_secs(5);

#[derive(Clone, Copy, Debug)]
pub enum PowerState {
    On,
    Off,
}

impl PowerState {
    pub fn as_str(self) -> &'static str {
        match self {
            PowerState::On => "on",
            PowerState::Off => "off",
        }
    }

    fn as_number(self) -> u8 {
        match self {
            PowerState::On => 1,
            PowerState::Off => 0,
        }
    }
}

#[derive(Clone, Debug, serde::Serialize)]
struct ElgatoService {
    hostname: String,
}

fn discover_lights() -> Result<Vec<ElgatoService>, String> {
    let (service_sender, service_receiver) = flume::unbounded::<ElgatoService>();

    let daemon =
        ServiceDaemon::new().map_err(|error| format!("Failed to create service daemon: {error}"))?;

    let daemon_receiver = daemon
        .browse("_elg._tcp.local.")
        .map_err(|error| format!("Failed to browse for lights: {error}"))?;

    std::thread::spawn(move || {
        while let Ok(event) = daemon_receiver.recv() {
            match event {
                ServiceEvent::ServiceResolved(info) => {
                    println!("Found new keylight: {}", info.get_hostname());

                    let hostname = if cfg!(target_os = "windows") {
                        match info.get_addresses_v4().iter().next() {
                            Some(address) => address.to_string(),
                            None => continue,
                        }
                    } else {
                        info.get_hostname().to_string()
                    };

                    if service_sender
                        .send(ElgatoService { hostname })
                        .is_err()
                    {
                        break;
                    }
                }

                _ => {}
            }
        }
    });

    std::thread::sleep(DISCOVERY_TIMEOUT);

    daemon
        .shutdown()
        .map_err(|error| format!("Failed to stop discovery: {error}"))?;

    let mut services: Vec<ElgatoService> = service_receiver.iter().collect();

    services.sort_by(|a, b| a.hostname.cmp(&b.hostname));
    services.dedup_by(|a, b| a.hostname == b.hostname);

    Ok(services)
}

fn set_light_power(light: &ElgatoService, power: PowerState) -> Result<(), String> {
    let body = format!(
        r#"{{"lights":[{{"on":{}}}]}}"#,
        power.as_number()
    );

    let address = format!("{}:{}", light.hostname, LIGHT_PORT);

    let mut stream = TcpStream::connect(&address)
        .map_err(|error| format!("Could not connect to {}: {error}", light.hostname))?;

    stream
        .set_read_timeout(Some(REQUEST_TIMEOUT))
        .map_err(|error| format!("Could not configure read timeout: {error}"))?;

    stream
        .set_write_timeout(Some(REQUEST_TIMEOUT))
        .map_err(|error| format!("Could not configure write timeout: {error}"))?;

    let request = format!(
        "PUT /elgato/lights HTTP/1.1\r\n\
         Host: {}\r\n\
         Content-Type: application/json\r\n\
         Content-Length: {}\r\n\
         Connection: close\r\n\
         \r\n\
         {}",
        address,
        body.len(),
        body
    );

    stream
        .write_all(request.as_bytes())
        .map_err(|error| format!("Could not send request to {}: {error}", light.hostname))?;

    let mut response = String::new();

    stream
        .read_to_string(&mut response)
        .map_err(|error| format!("Could not read response from {}: {error}", light.hostname))?;

    let status_line = response.lines().next().unwrap_or_default();

    let successful = status_line
        .split_whitespace()
        .nth(1)
        .and_then(|status| status.parse::<u16>().ok())
        .map(|status| (200..300).contains(&status))
        .unwrap_or(false);

    if !successful {
        return Err(format!(
            "Light {} returned an unsuccessful response: {}",
            light.hostname, status_line
        ));
    }

    Ok(())
}

pub fn set_all_lights_power(power: PowerState) -> Result<(), String> {
    println!("Searching for lights for {} seconds...", DISCOVERY_TIMEOUT.as_secs());

    let lights = discover_lights()?;

    if lights.is_empty() {
        return Err("No Key Light devices were found".to_string());
    }

    println!("Found {} light(s)", lights.len());

    let mut failures = Vec::new();

    for light in &lights {
        match set_light_power(light, power) {
            Ok(()) => {
                println!("Set {} to {}", light.hostname, power.as_str());
            }
            Err(error) => {
                eprintln!("{error}");
                failures.push(light.hostname.clone());
            }
        }
    }

    if failures.is_empty() {
        Ok(())
    } else {
        Err(format!(
            "Failed to update {} light(s): {}",
            failures.len(),
            failures.join(", ")
        ))
    }
}

#[tauri::command]
async fn scan() -> Vec<ElgatoService> {
    match discover_lights() {
        Ok(services) => services,
        Err(error) => {
            eprintln!("{error}");
            Vec::new()
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![scan])
        .on_window_event(|window, event| match event {
            tauri::WindowEvent::CloseRequested { api, .. } => {
                // Prevent the window from closing.
                api.prevent_close();

                // Hide the window instead.
                let _ = window.hide();
            }
            _ => {}
        })
        .setup(|app| {
            // Set the activation policy to Accessory on macOS.
            // This prevents the app from appearing in the dock.
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            let menu = Menu::with_items(
                app,
                &[
                    &MenuItem::with_id(app, "open", "Open", true, None::<&str>)?,
                    &MenuItem::with_id(
                        app,
                        "open-on-top",
                        "Open (Always on top)",
                        true,
                        None::<&str>,
                    )?,
                    &PredefinedMenuItem::separator(app)?,
                    &MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?,
                ],
            )?;

            let icon: Image<'_> = {
                #[cfg(target_os = "macos")]
                {
                    let macos_icon_path: std::path::PathBuf = app
                        .path()
                        .resolve("icons/macos-tray.png", BaseDirectory::Resource)?;

                    Image::from_path(macos_icon_path)?
                }

                #[cfg(not(target_os = "macos"))]
                {
                    app.default_window_icon().unwrap().clone()
                }
            };

            let is_template = cfg!(target_os = "macos");

            TrayIconBuilder::new()
                .icon(icon)
                .icon_as_template(is_template)
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "open-on-top" => {
                        let window = app.get_webview_window("main").unwrap();

                        let _ = window.show();
                        let _ = window.center();
                        let _ = window.set_focus();
                        let _ = window.set_always_on_top(true);
                    }

                    "open" => {
                        let window = app.get_webview_window("main").unwrap();

                        let _ = window.show();
                        let _ = window.center();
                        let _ = window.set_focus();
                        let _ = window.set_always_on_top(false);
                    }

                    "quit" => {
                        app.exit(0);
                    }

                    _ => {}
                })
                .on_tray_icon_event(|tray, event| match event {
                    TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } => {
                        let app = tray.app_handle();

                        if let Some(window) = app.get_webview_window("main") {
                            let visible = window.is_visible().unwrap();
                            let focused = window.is_focused().unwrap();

                            if focused {
                                let _ = window.hide();
                            } else if visible {
                                let _ = window.set_focus();
                            } else {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    }

                    _ => {}
                })
                .build(app)?;

            #[cfg(desktop)]
            let _ = app
                .handle()
                .plugin(tauri_plugin_single_instance::init(|_app, _args, _cwd| {}));

            Ok(())
        })
        // https://github.com/tauri-apps/tauri/issues/12382
        .run(tauri::generate_context!())
        .expect("error while running Tauri application");
}
