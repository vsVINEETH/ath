// var ProductImg = document.getElementById("img-fluid-main");
// var SmallImg = document.getElementsByClassName("img-fluid");
// SmallImg[0].onclick = function () {
//   ProductImg.src = SmallImg[0].src;
// };
// SmallImg[1].onclick = function () {
//   ProductImg.src = SmallImg[1].src;
// };
// SmallImg[2].onclick = function () {
//   ProductImg.src = SmallImg[2].src;
// };
// SmallImg[3].onclick = function () {
//   ProductImg.src = SmallImg[3].src;
// };

// var ProductImge = document.getElementById("img-fluid-main");
// var SmallImg = document.getElementsByClassName("img-fluid");

// for (var i = 0; i < SmallImg.length; i++) {
//   SmallImg[i].onclick = function () {
//     ProductImge.src = this.src;
//   };
// }

function setupImageClickHandlers(mainImageId, smallImageClassName) {
  let productImg = document.getElementById(mainImageId);
  let smallImgs = document.getElementsByClassName(smallImageClassName);

  for (let i = 0; i < smallImgs.length; i++) {
    smallImgs[i].onclick = function () {
      productImg.src = this.src;
    };
  }
}

setupImageClickHandlers("img-fluid-main", "img-fluid");
