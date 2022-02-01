extern crate console_error_panic_hook;
use std::process;
use winit::{
    event::{Event, WindowEvent},
    event_loop::{ControlFlow, EventLoop},
    window::Window,
};

fn main() {
    println!("Hello, world!");
    // make sure that we're not running anything else then wasm32
    #[cfg(not(target_arch = "wasm32"))]
    process::exit{code: 0x0100};
    #[cfg(target_arch = "wasm32")]
    // create window which represents the browser
    std::panic::set_hook(Box::new(console_error_panic_hook::hook));
    console_log::init().expect("could not initialize logger");

}
