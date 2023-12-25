console.log('RenderWorker');
onmessage = (event) => {
  console.log('received message:', event.data);
};
setTimeout(() => {
  self.postMessage({});
}, 500);
