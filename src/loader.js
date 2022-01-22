let modes = [];


// load model set gltf + bin
function loadModel(fileName) {
 fetch(fileName + ".gltf")
    .then(response => response.arrayBuffer())
    .then(buffer => {
       console.log(buffer);
    })
    .catch(err => console.error(err));

 fetch(fileName + ".bin")
    .then(response => response.arrayBuffer())
    .then(buffer => {
       console.log(buffer);       
    })
    .catch(err => console.error(err)); // Never forget the final catch!

}
