import shaderCode from "./shader.wgsl";
import { mat4, vec3 } from 'gl-matrix';

let adapter, device, canvas, context, cube, aspect, infos;
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

  aspect = canvas.width / canvas.height;
  cube = new Cube(device);

  infos = document.querySelector(".infos");

}


function getTransformationMatrix(projectionMatrix) {
  const viewMatrix = mat4.create();
  mat4.translate(viewMatrix, viewMatrix, vec3.fromValues(0, vert, -3));
  const now = Date.now() / 1000;
  mat4.rotate(
    viewMatrix,
    viewMatrix,
    1,
    vec3.fromValues(Math.sin(now), Math.cos(now), 0)
  );

  const modelViewProjectionMatrix = mat4.create();
  mat4.multiply(modelViewProjectionMatrix, projectionMatrix, viewMatrix);

  return Float32Array.from(modelViewProjectionMatrix);
}

let then = 0;
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

    let now = Date.now() * 0.001;                          // convert to seconds
    const deltaTime = now - then;          // compute time since last frame
    then = now;                            // remember time for next frame
    const fps = 1 / deltaTime;             // compute frames per second
    infos.innerHTML = fps.toFixed(1);
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
  constructor(device, projectionMatrix) {
    this.projectionMatrix = projectionMatrix;
    this.device = device;

    this.shadermodule = this.device.createShaderModule({
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

    this.renderPipeline = this.device.createRenderPipeline(this.pipelineDescriptor);

    this.vertices = new Float32Array([
      -0.5, -0.6, 0, 1, 1, 2, 1, 1,
      -0.5, 0.6, 0, 1, 1, 0, 1, 1,
      0.5, -0.6, 0, 1, 1, 0.1, 0.2, 0.1,
      0.5, 0.6, 0, 1, 1, 0, 1, 1,
      0.8, 0.0, 0, 1, 1, 0.1, 0.2, 0.1,
      
    ]);



  
    this.uniformBufferSize = 4 * 16; // 4x4 matrix
    this.uniformBuffer = this.device.createBuffer({
      size: this.uniformBufferSize,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
  
    this.uniformBindGroup = this.device.createBindGroup({
      layout: this.renderPipeline.getBindGroupLayout(0),
      entries: [
        {
          binding: 0,
          resource: {
            buffer: this.uniformBuffer,
          },
        },
      ],
    });

    
  }

  draw(passEncoder) { 
    this.projectionMatrix = mat4.create();
    mat4.perspective(this.projectionMatrix, (2 * Math.PI) / 5, aspect, 1, 100.0);
    

    this.transformationMatrix = getTransformationMatrix(this.projectionMatrix);
    this.device.queue.writeBuffer(
      this.uniformBuffer,
      0,
      this.transformationMatrix.buffer,
      this.transformationMatrix.byteOffset,
      this.transformationMatrix.byteLength
    );

    this.vertexBuffer = this.device.createBuffer({
      size: this.vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true
    });

    // cast arraybuffer to array of our choice and add the vertices of the triangle
    new Float32Array(this.vertexBuffer.getMappedRange()).set(this.vertices);
    this.vertexBuffer.unmap();
    
    passEncoder.setPipeline(this.renderPipeline);
    passEncoder.setBindGroup(0, this.uniformBindGroup);
    passEncoder.setVertexBuffer(0, this.vertexBuffer);
    passEncoder.draw(5);
    passEncoder.endPass();
  }
}

window.addEventListener('load', main);