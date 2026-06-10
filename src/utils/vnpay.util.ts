export function sortObject(obj) {
  const sorted = {};
  const keys = Object.keys(obj).sort();

  keys.forEach((key) => {
    sorted[key] = encodeURIComponent(obj[key]).replace(/%20/g, '+');
  });

  return sorted;
}

// export function sortObject(obj) {
//   let sorted = {};
//   let str = [];
//   let key;
//   for (key in obj) {
//     if (obj.hasOwnProperty(key)) {
//       str.push(encodeURIComponent(key));
//     }
//   }
//   str.sort();
//   for (key = 0; key < str.length; key++) {
//     sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, '+');
//   }
//   return sorted;
// }
