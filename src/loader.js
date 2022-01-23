let modes = [];


// load model set gltf + bin
export function loadModel(fileName) {
 fetch(fileName + ".gltf")
    .then(response => response.json())
    .then(model => {
       console.debug(model);
       model.buffers.forEach
       
    })
    .catch(err => console.error(err));
}

