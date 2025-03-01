use mdns_sd::{ServiceDaemon, ServiceEvent};
use tauri::{
    image::Image,
    menu::{Menu, MenuItem, PredefinedMenuItem},
    path::BaseDirectory,
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager,
};

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[derive(Clone, Debug, serde::Serialize)]
struct ElgatoService {
    hostname: String,
}

#[tauri::command]
async fn scan() -> Vec<ElgatoService> {
    let (service_sender, service_receiver) = flume::unbounded::<ElgatoService>();

    // Create a daemon
    let daemon = ServiceDaemon::new().expect("Failed to create daemon");
    println!("Created service daemon");

    // Browse for Elgato devices
    let daemon_receiver = daemon.browse("_elg._tcp.local.").expect("Failed to browse");

    std::thread::spawn(move || {
        while let Ok(event) = daemon_receiver.recv() {
            match event {
                ServiceEvent::SearchStarted(_info) => {
                    println!("Search started");
                }
                ServiceEvent::SearchStopped(_info) => {
                    println!("Search stopped");
                }
                ServiceEvent::ServiceResolved(info) => {
                    println!("Found new keylight: {}", info.get_hostname());

                    if cfg!(target_os = "windows") {
                        // On Windows, we need to use the IP
                        if let Some(address) = info.get_addresses_v4().iter().next() {
                            service_sender
                                .send(ElgatoService {
                                    hostname: address.to_string(),
                                })
                                .unwrap();
                        }
                    } else {
                        service_sender
                            .send(ElgatoService {
                                hostname: info.get_hostname().to_string(),
                            })
                            .unwrap();
                    }
                }
                _other_event => {
                    // println!("Received other event: {:?}", &other_event);
                }
            }
        }
    });

    // Gracefully shutdown the daemon.
    std::thread::sleep(std::time::Duration::from_secs(5));
    daemon.shutdown().unwrap();
    println!("DAEMON: Shutdown");

    let services: Vec<ElgatoService> = service_receiver.iter().collect();

    return services;
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
                // Prevent the window from closing
                api.prevent_close();
                // Hide the window instead
                let _ = window.hide();
            }
            _ => {}
        })
        .setup(|app| {
            // Set the activation policy to Accessory on macOS
            // This will prevent the app from appearing in the dock
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
                        // Left click released
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
        .expect("error while running tauri application");
}
