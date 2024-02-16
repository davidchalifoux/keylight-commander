// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use mdns_sd::{ServiceDaemon, ServiceEvent};
use tauri::{Manager, SystemTray, SystemTrayEvent, SystemTrayMenu};

#[derive(Clone, Debug, serde::Serialize)]
struct ElgatoService {
    full_name: String,
    ip_v4: String,
    port: u16,
    model: String,
    mac_address: String,
}

#[tauri::command]
fn scan() -> Vec<ElgatoService> {
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
    let tray_menu = SystemTrayMenu::new();
    let system_tray = SystemTray::new().with_menu(tray_menu);

    tauri::Builder::default()
        .system_tray(system_tray)
        .on_system_tray_event(|app, event| match event {
            SystemTrayEvent::LeftClick { .. } => {
                let window = app.get_window("main").unwrap();

                let is_visible = window.is_visible().unwrap_or_default();
                let is_focused = window.is_focused().unwrap_or_default();

                if is_visible && is_focused {
                    println!("Hiding window");
                    window.hide().unwrap();
                } else if is_visible {
                    println!("Focusing window");
                    window.set_focus().unwrap();
                } else {
                    println!("Showing window");
                    window.show().unwrap();
                    window.set_focus().unwrap();
                }
            }
            _ => {}
        })
        .setup(|app| {
            println!("APPLICATION STARTED");

            // Set the activation policy to Accessory on macOS
            // This will prevent the app from appearing in the dock
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![scan])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
