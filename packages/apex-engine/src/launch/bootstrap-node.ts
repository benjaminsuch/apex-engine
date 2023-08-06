process.on('uncaughtException', function (err) {
  console.log('Uncaught Exception:');
  console.log(err);
  //process.exit(1);
});
