struct Uniforms {
  modelViewProjectionMatrix : mat4x4<f32>;
};

struct VertexOut {
  [[builtin(position)]] position : vec4<f32>;
  [[location(0)]] color : vec4<f32>;
};

// vertex shader
[[binding(0), group(0)]] var<uniform> uniforms : Uniforms;

[[stage(vertex)]]
fn vertex_main([[location(0)]] position: vec4<f32>,
               [[location(1)]] color: vec4<f32>) -> VertexOut
{
  var output : VertexOut;
  output.position = uniforms.modelViewProjectionMatrix * position;
  output.color = color;
  return output;
}


// fragment shader

[[stage(fragment)]]
fn fragment_main(fragData: VertexOut) -> [[location(0)]] vec4<f32>
{
  return fragData.color;
}

