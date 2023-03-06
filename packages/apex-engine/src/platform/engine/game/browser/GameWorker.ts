console.log('loaded: gameWorker.js');

function startGameWorker() {
  self.addEventListener('message', () => {
    onInit();
  });

  function update(ctx: any) {
    const now = performance.now();

    ctx.delta = (now - ctx.elapsed) / 1000;
    ctx.elapsed = now;
    ctx.ticks++;
  }

  function onInit() {
    const context = {
      delta: 0,
      elapsed: 0,
      tickRate: 60,
      ticks: 0
    };

    let interval: any;

    function startGameLoop() {
      interval = setInterval(() => {
        const then = performance.now();

        try {
          update(context);
        } catch (error) {
          clearInterval(interval);
          throw error;
        }

        const elapsed = performance.now() - then;

        if (elapsed > 1000 / context.tickRate) {
          clearInterval(interval);

          try {
            update(context);
          } catch (error) {
            clearInterval(interval);
            throw error;
          }

          interval = startGameLoop();
        }
      }, 1000 / context.tickRate);

      return interval;
    }

    startGameLoop();
  }
}

startGameWorker();
