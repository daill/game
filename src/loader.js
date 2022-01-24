import { mat4, vec3, quat } from 'gl-matrix';
 
let modes = [];

// load model set gltf + bin
export function loadModel(path, fileName) {
  let model = null;
  fetch(path + fileName)
    .then(response => response.json())
    .then(modelDesc => {
      console.debug(modelDesc);
      model = new Model(modelDesc);
      modelDesc.buffers.forEach(bufferDesc => {
          console.debug(bufferDesc);
          fetch(path + bufferDesc.uri)
            .then(response => response.arrayBuffer())
            .then(buffer => {
              console.debug("buffer " + bufferDesc.uri + " loaded with " + );
              bufferDesc.data = buffer;
            })
            .catch(err => console.error(err));
          }
        );
    })
    .catch(err => console.error(err));

  return model;
}

// ctypes
// 5120 signed byte
// 5121 unsigned byte
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
  }
} 
