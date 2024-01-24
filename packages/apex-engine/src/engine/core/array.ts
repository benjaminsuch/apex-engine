declare interface Array<T> {
  /**
   * Removes the item at `idx`.
   *
   * This method is way more performant than using `splice`. It swaps the item at `idx`
   * with the last item and then calls `pop` to remove it. Doing so will prevent the
   * compiler to re-arrange the array.
   */
  removeAtSwap(idx: number): void;
}

Array.prototype.removeAtSwap = function (this, idx): void {
  this.splice(idx, 1, this[this.length - 1]);
  this.pop();
};
