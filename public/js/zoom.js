// const container = document.getElementById("cont")
// const img = document.getElementById("img-fluid-main");

// container.addEventListener("mousemove", (e) => {
//     const x = e.clientX - e.target.offsetLeft;
//     const y = e.clientY - e.target.offsetTop;
//     console.log(x,y);

//     img.style.transformOrigin = `${x}px ${y}px`
//     img.style.transform = "scale(2)"

//     container.addEventListener("mouseleave", () => {
//         img.style.transformOrigin = 'center center';
//         img.style.transform = 'scale(1)';
//      });
// })
function addImageZoomEffect(containerId, imageId) {
  const container = document.getElementById(containerId);
  const img = document.getElementById(imageId);

  container.addEventListener("mousemove", (e) => {
    const x = e.clientX - e.target.offsetLeft;
    const y = e.clientY - e.target.offsetTop;

    img.style.transformOrigin = `${x}px ${y}px`;
    img.style.transform = "scale(2)";

    container.addEventListener("mouseleave", () => {
      img.style.transformOrigin = "center center";
      img.style.transform = "scale(1)";
    });
  });
}

addImageZoomEffect("cont", "img-fluid-main");
