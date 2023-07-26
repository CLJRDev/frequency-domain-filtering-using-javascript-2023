//Định nghĩa hàm thay đổi màu cho radio button
function checkRadio(){
  let radioBtn1 = document.getElementById('smooth-radio');
  let smoothLab = document.getElementById('smooth-lab');  
  let sharpLab = document.getElementById('sharp-lab');  
  if(radioBtn1.checked){    
    smoothLab.style = "background-color: #6b6eff";
    sharpLab.style = "background-color: transparent";
  }else{    
    smoothLab.style = "background-color: transparent";
    sharpLab.style = "background-color: #6b6eff";
  }
}

//Định nghĩa hàm download ảnh xuống máy tính
function download_image(canvasId){
  let canvas = document.getElementById(canvasId);
  image = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
  let link = document.createElement('a');
  let imageFileName = "";  
  switch (canvasId){
    case 'ideal-output':
      let idealRadius = document.getElementById('ideal-radius').value;
      imageFileName = 'ideal-filter('+ idealRadius +').png';
      break;
    case 'butterworth-output':
      let  butterRadius = document.getElementById('butter-radius').value;
      let butterOrder = document.getElementById('butter-order').value;
      imageFileName = 'butterworth-filter(' + butterRadius + ',' + butterOrder + ').png';
      break;
    case 'gaussian-output':
      let gaussRadius = document.getElementById('gauss-radius').value;
      imageFileName = 'gaussian-filter(' + gaussRadius + ').png';
      break;
  }
  link.download = imageFileName;
  link.href = image;
  link.click();
}
checkRadio();