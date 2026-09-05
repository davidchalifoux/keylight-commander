// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn parse_args() -> Result<Option<tauri_v2_lib::PowerState>, String> {
    let args: Vec<String> = std::env::args().skip(1).collect();

    if args.is_empty() {
        return Ok(None);
    }

    if args.len() != 2 || args[0] != "--power" {
        return Err("Usage: keylight-commander [--power on|off]".to_string());
    }

    match args[1].as_str() {
        "on" => Ok(Some(tauri_v2_lib::PowerState::On)),
        "off" => Ok(Some(tauri_v2_lib::PowerState::Off)),
        value => Err(format!(
            "Invalid power value '{value}'. Expected 'on' or 'off'."
        )),
    }
}

fn main() {
    let power = match parse_args() {
        Ok(power) => power,
        Err(error) => {
            eprintln!("{error}");
            std::process::exit(2);
        }
    };

    if let Some(power) = power {
        match tauri_v2_lib::set_all_lights_power(power) {
            Ok(()) => {
                println!("All lights turned {}.", power.as_str());
                std::process::exit(0);
            }
            Err(error) => {
                eprintln!("Failed to set light power: {error}");
                std::process::exit(1);
            }
        }
    }

    tauri_v2_lib::run();
}