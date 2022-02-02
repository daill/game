use log::{ info };
use winit::{
    event::{Event, WindowEvent},
    event_loop::{ControlFlow, EventLoop},
    window::Windows,
};

fn main() {
    println!("Hello, world!");
    
    // make sure that we're not running anything else then wasm32
    #[cfg(not(target_arch = "wasm32"))]
    std::process::exit(1);

    // create window which represents the browser
    #[cfg(target_arch = "wasm32")]
    std::panic::set_hook(Box::new(console_error_panic_hook::hook));
    console_log::init().expect("could not initialize logger");
    let event_loop = EventLoop::new();
    let window = winit::window::Window::new(event_loop: &event_loop).unwrap();

    use winit::platform::web::WindowExtWebSys;


}
