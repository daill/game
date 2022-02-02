use log::{ info };


fn main() {
    println!("Hello, world!");
    
    // make sure that we're not running anything else then wasm32
    #[cfg(not(target_arch = "wasm32"))]
    std::process::exit(1);

    // create window which represents the browser
    #[cfg(target_arch = "wasm32")]
    std::panic::set_hook(Box::new(console_error_panic_hook::hook));
    console_log::init().expect("could not initialize logger");

    info!("test");
}
