import { foo } from 'apex-engine';

//ifdef !IS_CLIENT
console.log(foo);
//endif

//ifdef IS_CLIENT
console.log('this is client code', foo);
//endif
