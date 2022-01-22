let modes = [];


function loadModel(fileName) {
    fetch(fileName)
    .then(response => checkStatus(response) && response.arrayBuffer())
    .then(buffer => {
       console.log(buffer);       
    })
    .catch(err => console.error(err)); // Never forget the final catch!
}
