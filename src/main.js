import shaderCode from "./shader.wgsl";

let adapter, device, canvas, context, shadermodule, vertexBuffer, renderPipeline;
const clearColor = { r: 0.0, g: 0.5, b: 1.0, a: 1.0 };

async function init() {
  // create 
  adapter = await window.navigator.gpu.requestAdapter();
  device = await adapter.requestDevice();

  canvas = document.querySelector('#webgpu-canvas');
  context = canvas.getContext('webgpu');

  context.configure({
    device: device,
    format: 'bgra8unorm'
  });

  shadermodule = device.createShaderModule({
    code: shaderCode
  });

  const vertices = new Float32Array([
    -0.5,  0.6, 0, 1, 1, 0, 1, 1,
    -0.5, -0.6, 0, 1, 1, 0, 1, 1,
    0.5, -0.6, 0, 1, 1, 1, 1, 1,

    0.5, 0.6, 0, 1, 1, 0, 1, 1,
    -0.5, 0.6, 0, 1, 1, 0, 1, 1,
    0.5, -0.6, 0, 1, 1, 1, 1, 1
  ]);

  vertexBuffer = device.createBuffer({
    size: vertices.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true
  });

  // cast arraybuffer to array of our choice and add the vertices of the triangle
  new Float32Array(vertexBuffer.getMappedRange()).set(vertices);
  vertexBuffer.unmap();


  // desscribing the layout of the buffer
  const vertexBuffers = [{
    attributes: [{
      shaderLocation: 0, // position
      offset: 0,
      format: 'float32x4'
    }, {
      shaderLocation: 1, // color
      offset: 16,
      format: 'float32x4'
    }],
    arrayStride: 32,
    stepMode: 'vertex'
  }];

  // describing how the pipeline parts incooperate with the buffers
  const pipelineDescriptor = {
    vertex: {
      module: shadermodule,
      entryPoint: 'vertex_main',
      buffers: vertexBuffers
    },
    fragment: {
      module: shadermodule,
      entryPoint: 'fragment_main',
      targets: [{
        format: 'bgra8unorm'
      }]
    },
    primitive: {
      topology: 'triangle-list'
    }
  };

  renderPipeline = device.createRenderPipeline(pipelineDescriptor);


}


function draw() {
  const commandEncoder = device.createCommandEncoder();
  
  const renderPassDescriptor = {
    colorAttachments: [{
      loadValue: clearColor,
      storeOp: 'store',
      view: context.getCurrentTexture().createView()
    }]
  };
  
  const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);

  passEncoder.setPipeline(renderPipeline);
  passEncoder.setVertexBuffer(0, vertexBuffer);
  passEncoder.draw(6);
  passEncoder.endPass();
  device.queue.submit([commandEncoder.finish()]);
  
  requestAnimationFrame(() => {
    draw();
  });
}

function showWarning(e) {
  document.querySelector('#gpuCanvas').style.display = 'none';
  document.querySelector('.warning').style.display = 'block';
}

async function main() {
  try {
    await init();
  } catch (e) {
    showWarning(e);
  }
  draw();
}

window.addEventListener('load', main);