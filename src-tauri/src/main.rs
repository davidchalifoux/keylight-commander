// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    let args = parse_args();

    if let Some(power) = args.power {
        let result = tauri_v2_lib::set_all_lights_power(power);
        std::process::exit(if result.is_ok() { 0 } else { 1 });
    }

    tauri_v2_lib::run();
}
