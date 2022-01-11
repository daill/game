import shaderCode from "./shader.wgsl";

let adapter, device, canvas, context, shadermodule, cube;
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


  cube = new Cube(device);

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
  
  cube.draw(passEncoder);

  device.queue.submit([commandEncoder.finish()]);
  
  requestAnimationFrame(() => {
    draw();
  });
}

function showWarning(e) {
  document.querySelector('#webgpu-canvas').style.display = 'none';
  document.querySelector('.warning').style.display = 'block';
  document.querySelector('.warning').innerHTML = e;
}

async function main() {
  try {
    await init();
  } catch (e) {
    showWarning(e);
  }
  draw();
}


class Cube {
  constructor(device) {
    this.device = device;

    this.shadermodule = device.createShaderModule({
      code: shaderCode
    });
    // desscribing the layout of the buffer
    this.vertexBuffers = [{
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
    this.pipelineDescriptor = {
      vertex: {
        module: this.shadermodule,
        entryPoint: 'vertex_main',
        buffers: this.vertexBuffers
      },
      fragment: {
        module: this.shadermodule,
        entryPoint: 'fragment_main',
        targets: [{
          format: 'bgra8unorm'
        }]
      },
      primitive: {
        topology: 'triangle-strip'
      }
    };

    this.renderPipeline = device.createRenderPipeline(this.pipelineDescriptor);

    this.vertices = new Float32Array([
      -0.5, -0.6, 0, 1, 1, 0, 1, 1,
      -0.5, 0.6, 0, 1, 1, 0, 1, 1,
      0.5, -0.6, 0, 1, 1, 0.1, 0.2, 0.1,
      0.5, 0.6, 0, 1, 1, 0, 1, 1,      
    ]);

  }

  draw(passEncoder) { 
    this.vertexBuffer = device.createBuffer({
      size: this.vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true
    });

    // cast arraybuffer to array of our choice and add the vertices of the triangle
    new Float32Array(this.vertexBuffer.getMappedRange()).set(this.vertices);
    this.vertexBuffer.unmap();
    
    passEncoder.setPipeline(this.renderPipeline);
    passEncoder.setVertexBuffer(0, this.vertexBuffer);
    passEncoder.draw(4);
    passEncoder.endPass();
  }
}

window.addEventListener('load', main);