import { mat4, vec3, quat } from 'gl-matrix';
 
let models = [];

// load model set gltf + bin
async function loadModel(path, fileName) {
  let model = null;
  model = await fetch(path + fileName)
    .then(response => response.json())
    .then(modelDesc => {
      console.debug(modelDesc);
      model = new Model(modelDesc);
      /*modelDesc.buffers.forEach(bufferDesc => {
          console.debug(bufferDesc);
          bufferDesc.data = fetch(path + bufferDesc.uri)
            .then(response => response.arrayBuffer())
            .then(buffer => {
              console.debug("buffer " + bufferDesc.uri + " loaded with " + buffer.byteLength + " bytes");
              return buffer;
            })
            .catch(err => console.error(err));
          }
        );
      console.log("model desc loaded");*/
      return model;
    })
    .catch(err => console.error(err));

  return  model;
}

// ctypes
// 5120 signed byte
// 5121 unsigned byt
// 5122 signed short
// 5123 unsigned short
// 5125 unsigned int
// 5126 float


// "SCALAR" -> 1
// "VECX" -> X
// "MATX" -> 2*X
//
// POSITION, NORMAL -> VEC3
// TANGENT, COLOR_n
//
//
// Buffer <- BufferView <- Accessors

class Model {
  constructor(description) {
    this.description = description;
    this.vertexBuffers;
    this.pipelineDescriptor;
    this.shadermodule;
    this.renderPipeline;
    this.vertices;
    this.uniformBufferSize;
    this.uniformBuffer;
    this.uniformBindGroup;
    this.shaderCoder;
  }

  meshes() {
        
  }

  shaderCode(code) {
    this.shaderCoder = code;
  }

  prepare(device) {
    this.device = device;
    console.log(this.device);
    console.log(this.shaderCode);
    this.shadermodule = this.device.createShaderModule({
      code: this.shaderCode
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
          binding: 1,
          resource: {
            buffer: this.uniformBuffer,
          }
        },
      ],
    });
  }

  draw(passEncoder, transformationMatrix) { 
   
    this.device.queue.writeBuffer(
      this.uniformBuffer,
      0,
      transformationMatrix.buffer,
      transformationMatrix.byteOffset,
      transformationMatrix.byteLength
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

export { loadModel, Model}
