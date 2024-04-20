// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use mdns_sd::{ServiceDaemon, ServiceEvent};
use tauri::{
    CustomMenuItem, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem,
};
use tauri_plugin_positioner::{Position, WindowExt};

#[derive(Clone, Debug, serde::Serialize)]
struct ElgatoService {
    full_name: String,
    ip_v4: String,
    port: u16,
    model: String,
    mac_address: String,
}

#[tauri::command]
async fn scan() -> Vec<ElgatoService> {
    let (service_sender, service_receiver) = flume::unbounded::<ElgatoService>();

    // Create a daemon
    let daemon = ServiceDaemon::new().expect("Failed to create daemon");
    println!("DAEMON: Created");

    // Browse for Elgato devices
    let daemon_receiver = daemon.browse("_elg._tcp.local.").expect("Failed to browse");

    std::thread::spawn(move || {
        while let Ok(event) = daemon_receiver.recv() {
            match event {
                ServiceEvent::SearchStarted(_info) => {
                    println!("SEARCH: Started");
                }
                ServiceEvent::SearchStopped(_info) => {
                    println!("SEARCH: Stopped");
                }
                ServiceEvent::ServiceResolved(info) => {
                    println!("NEW-SERVICE: {}", info.get_fullname());

                    service_sender
                        .send(ElgatoService {
                            full_name: info.get_fullname().into(),
                            ip_v4: info.get_addresses_v4().iter().next().unwrap().to_string(),
                            port: info.get_port(),
                            model: info.get_property("md").unwrap().val_str().into(),
                            mac_address: info.get_property("id").unwrap().val_str().into(),
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

fn main() {
    let quit_button = CustomMenuItem::new("quit".to_string(), "Quit");
    let show_hide_button = CustomMenuItem::new("show".to_string(), "Show");

    let tray_menu = SystemTrayMenu::new()
        .add_item(show_hide_button)
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(quit_button);

    let system_tray = SystemTray::new().with_menu(tray_menu);

    tauri::Builder::default()
        .plugin(tauri_plugin_positioner::init())
        .system_tray(system_tray)
        .setup(|app| {
            println!("STARTED");

            // Set the activation policy to Accessory on macOS
            // This will prevent the app from appearing in the dock
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            Ok(())
        })
        .on_window_event(|event| match event.event() {
            tauri::WindowEvent::CloseRequested { api, .. } => {
                event.window().hide().unwrap();
                api.prevent_close();
            }
            tauri::WindowEvent::Focused(focused) => {
                // hide window whenever it loses focus
                if !focused {
                    event.window().hide().unwrap();
                }
            }
            _ => {}
        })
        .on_system_tray_event(|app, event| {
            tauri_plugin_positioner::on_tray_event(app, &event);

            match event {
                SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
                    "quit" => app.exit(0),
                    "show" => {
                        let window = app.get_window("main").unwrap();

                        let _ = window.move_window(Position::TrayCenter);

                        window.show().unwrap();
                        window.set_focus().unwrap();
                    }
                    _ => {}
                },

                SystemTrayEvent::LeftClick { .. } => {
                    let window = app.get_window("main").unwrap();

                    let _ = window.move_window(Position::TrayCenter);

                    let is_visible = window.is_visible().unwrap_or_default();

                    if !is_visible {
                        window.show().unwrap();
                        window.set_focus().unwrap();
                    } else {
                        window.hide().unwrap();
                    }
                }
                _ => {}
            }
        })
        .invoke_handler(tauri::generate_handler![scan])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
