use tauri::menu::{MenuBuilder, MenuItemBuilder, PredefinedMenuItem, SubmenuBuilder};
use tauri::Emitter;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Work around WebKitGTK compositing crash on Wayland
    std::env::set_var("WEBKIT_DISABLE_COMPOSITING_MODE", "1");

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .setup(|app| {
            let settings = MenuItemBuilder::new("Indstillinger")
                .id("settings")
                .accelerator("CmdOrCtrl+,")
                .build(app)?;

            let refresh = MenuItemBuilder::new("Genindlæs")
                .id("refresh")
                .accelerator("CmdOrCtrl+R")
                .build(app)?;

            let update_selected = MenuItemBuilder::new("Opdatér valgte")
                .id("update_selected")
                .accelerator("CmdOrCtrl+U")
                .build(app)?;

            let check_update = MenuItemBuilder::new("Tjek for opdatering")
                .id("check_update")
                .build(app)?;

            let quit = MenuItemBuilder::new("Afslut")
                .id("quit")
                .accelerator("CmdOrCtrl+Q")
                .build(app)?;

            let app_menu = SubmenuBuilder::new(app, "Bookinghuset")
                .item(&settings)
                .item(&refresh)
                .item(&update_selected)
                .item(&check_update)
                .separator()
                .item(&quit)
                .build()?;

            let mut menu_builder = MenuBuilder::new(app)
                .item(&app_menu);

            if cfg!(target_os = "macos") {
                let edit_menu = SubmenuBuilder::new(app, "Edit")
                    .item(&PredefinedMenuItem::undo(app, None)?)
                    .item(&PredefinedMenuItem::redo(app, None)?)
                    .separator()
                    .item(&PredefinedMenuItem::cut(app, None)?)
                    .item(&PredefinedMenuItem::copy(app, None)?)
                    .item(&PredefinedMenuItem::paste(app, None)?)
                    .item(&PredefinedMenuItem::select_all(app, None)?)
                    .build()?;
                menu_builder = menu_builder.item(&edit_menu);
            }

            let menu = menu_builder.build()?;

            app.set_menu(menu)?;

            app.on_menu_event(move |app_handle, event| {
                match event.id().as_ref() {
                    "settings" => {
                        let _ = app_handle.emit("menu-event", "settings");
                    }
                    "refresh" => {
                        let _ = app_handle.emit("menu-event", "refresh");
                    }
                    "update_selected" => {
                        let _ = app_handle.emit("menu-event", "update_selected");
                    }
                    "check_update" => {
                        let _ = app_handle.emit("menu-event", "check_update");
                    }
                    "quit" => {
                        app_handle.exit(0);
                    }
                    _ => {}
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
