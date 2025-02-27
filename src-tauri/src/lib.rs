use mdns_sd::{ServiceDaemon, ServiceEvent};
use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
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

                    service_sender
                        .send(ElgatoService {
                            hostname: info.get_hostname().to_string(),
                        })
                        .unwrap();
                }
                _other_event => {
                    // println!("Received other event: {:?}", &other_event);
                }
            }
        }
    });

    // Gracefully shutdown the daemon.
    std::thread::sleep(std::time::Duration::from_secs(3));
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
        .setup(|app| {
            // Set the activation policy to Accessory on macOS
            // This will prevent the app from appearing in the dock
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            let menu = Menu::with_items(
                app,
                &[
                    &MenuItem::with_id(app, "show", "Show (Always on top)", true, None::<&str>)?,
                    &MenuItem::with_id(app, "show-alt", "Show", true, None::<&str>)?,
                    &MenuItem::with_id(app, "hide", "Hide", true, None::<&str>)?,
                    &PredefinedMenuItem::separator(app)?,
                    &MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?,
                ],
            )?;

            TrayIconBuilder::new()
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        let window = app.get_webview_window("main").unwrap();
                        let _ = window.show();
                        let _ = window.set_focus();
                        let _ = window.set_always_on_top(true);
                    }
                    "show-alt" => {
                        let window = app.get_webview_window("main").unwrap();
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                    "hide" => {
                        let window = app.get_webview_window("main").unwrap();
                        let _ = window.hide();
                    }
                    "quit" => {
                        println!("quit menu item was clicked");
                        app.exit(0);
                    }
                    _ => {
                        println!("menu item {:?} not handled", event.id);
                    }
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

                            if visible {
                                let _ = window.hide();
                            } else {
                                let _ = window.show();
                                let _ = window.set_focus();
                                let _ = window.set_always_on_top(true);
                            }
                        }
                    }
                    _ => {
                        println!("unhandled event {event:?}");
                    }
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
