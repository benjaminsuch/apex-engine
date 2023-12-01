export class ProxyManager {
  private static readonly replicatedProxies = new Set<any>();

  public static markAsReplicated(proxy: InstanceType<TClass>) {
    this.replicatedProxies.add(proxy);

    const idx = this.enqueuedProxies.indexOf(proxy);

    if (idx > -1) {
      this.enqueuedProxies.splice(idx, 1);
    }
  }

  /**
   * Proxies that have been created on the game-thread, but are not
   * replicated on the render-thread yet.
   */
  public static readonly enqueuedProxies: InstanceType<TClass>[] = [];

  /**
   * All proxies that are currently operating.
   */
  public static readonly proxies: InstanceType<TClass>[] = [];

  public static add(proxy: InstanceType<TClass>) {
    const idx = this.proxies.indexOf(proxy);

    if (idx > -1) {
      console.warn(`The proxy has already been added.`);
      return;
    }

    this.enqueuedProxies.push(proxy);
    this.proxies.push(proxy);
  }
}
