export function configureBrowserLauncher(main: Function) {
  return () => {
    main();
  };
}
