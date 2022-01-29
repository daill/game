import shaderCode from "./shader.wgsl";
import { mat4, vec3, quat } from 'gl-matrix';
import { vert, hor} from "./controls";
import { loadModel, Model} from "./loader.js";


let model, adapter, device, canvas, context, cube, aspect, infos;
const clearColor = { r: 0.0, g: 0.5, b: 1.0, a: 1.0 };


async function initializeWebGPU() {
    // Check to ensure the user agent supports WebGPU.
    if (!('gpu' in navigator)) {
        console.error('User agent doesn’t support WebGPU.');
        return false;
    }

    // Request an adapter.
    adapter = await navigator.gpu.requestAdapter();

    // requestAdapter may resolve with null if no suitable adapters are found.
    if (!adapter) {
        console.error('No WebGPU adapters found.');
        return false;
    }
    device = await adapter.requestDevice();
    device.lost.then((info) => {
        console.error(`WebGPU device was lost: ${info.message}`);

        device = null;

        if (info.reason != 'destroyed') {
            initializeWebGPU();
        }
    });

    onWebGPUInitialized();

    return true;
}

async function onWebGPUInitialized() {
  // create 
  canvas = document.querySelector('#webgpu-canvas');
  context = canvas.getContext('webgpu');

  context.configure({
    device: device,
    format: context.getPreferredFormat(adapter), 
  });

  aspect = canvas.width / canvas.height;
  cube = new Cube(device);

  infos = document.querySelector(".infos");

  model = await loadModel("src/", "Box0.gltf");
  console.debug(model);

  model.shaderCode(shaderCode);
  console.log(shaderCode);
  model.prepare(device);

}


function getTransformationMatrix(projectionMatrix) {
  const now = Date.now() / 1000;
  const rotQuat = quat.create();
  quat.fromEuler(rotQuat, Math.sin(now)*(180 / Math.PI), Math.cos(now)*(180 / Math.PI), 0);
  const modelViewProjectionMatrix = mat4.create();
  mat4.fromRotationTranslationScale(modelViewProjectionMatrix, rotQuat, vec3.fromValues(hor, vert, -3), vec3.fromValues(1,1,1))
  mat4.multiply(modelViewProjectionMatrix, projectionMatrix, modelViewProjectionMatrix);
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

  const projectionMatrix = mat4.create();
  mat4.perspective(projectionMatrix, (2 * Math.PI) / 5, aspect, 1, 100.0);
  const transformationMatrix = getTransformationMatrix(projectionMatrix);
 
  const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
  cube.draw(passEncoder, transformationMatrix);  
  
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
    await initializeWebGPU();
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
