use std::process;

fn main() {
    println!("Hello, world!");
    // make sure that we're not running anything else then wasm32
    #[cfg(not(target_arch == "wasm32"))]
    process::exit(code: 0x0100);
    #[cfg(target_arch == "wasm32")]
    // create window which represents the browser

}
