declare interface ObjectConstructor {
  hasObjectConstructor(obj: any): obj is object;
}

Object.hasObjectConstructor = function (obj): obj is object {
  return obj && Object.getPrototypeOf(obj).constructor === Object;
};
