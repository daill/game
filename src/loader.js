let modes = [];

// load model set gltf + bin
export function loadModel(path, fileName) {
  
  fetch(path + fileName)
    .then(response => response.json())
    .then(model => {
      console.debug(model);
      model.buffers.forEach(
        bufferdata => {
          console.debug(bufferdata);
          fetch(path + bufferdata.uri)
            .then(response => response.arrayBuffer())
            .then(buffer => console.debug(buffer))
            .catch(err => console.error(err));
          }
        );
    })
    .catch(err => console.error(err));
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

class Model {
  constructor(description) {
    this.description = description;
  }

  




}
