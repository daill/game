export let vert = 0;
export let hor = 0;

document.addEventListener('keydown', (event) => {
  const keyName = event.key;

  if (keyName === 'w') {
    vert += 0.001;
    return;
  }
}, false);