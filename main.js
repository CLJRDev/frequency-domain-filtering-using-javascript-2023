//Thẻ ảnh
let inputImg = document.getElementById('img-source');
//Thẻ input
let inputFile = document.getElementById('file-input');
//Hàm load ảnh
inputFile.addEventListener('change', function(){
  inputImg.src = URL.createObjectURL(this.files[0]);
});

//Tạo bộ lọc thông thấp Ideal
function lowPass_Ideals(D0,U,V){
  //Bước 1: Khởi tạo bộ lọc      
  let H = new cv.Mat.zeros(U,V,cv.CV_32F);   
  let cx = H.cols/2;
  let cy = H.rows/2;
  for(let i=0;i<H.rows;i++){
    for(let j=0;j<H.cols;j++){
      let duv = Math.sqrt(Math.pow(i-cx,2) + Math.pow(j-cy,2));
      if(duv <= D0){
        //Gán điểm thứ (i,j) của bộ lọc thành 1
        H.floatPtr(i, j)[0] = 1;                                        
      }
    }
  }
  return H;      
}

//Tạo bộ lọc thông cao Ideal
function highPass_Ideals(D0,U,V){
  //Bước 1: Gọi bộ lọc thông thấp
  let Hlow = lowPass_Ideals(D0,U,V);

  //Bước 2: Khơi tạo bộ lọc
  let H = new cv.Mat.zeros(U,V,cv.CV_32F);   
  for(let i=0;i<U;i++){
    for(let j=0;j<V;j++){
      H.floatPtr(i,j)[0] = 1 - Hlow.floatPtr(i,j)[0];
    }
  }
  return H;      
}

//Tạo bộ lọc thông thấp Butterworth
function lowPass_Butterworth(D0,U,V,N){
  //Bước 1: Khởi tạo bộ lọc      
  let H = new cv.Mat.zeros(U,V,cv.CV_32F);   
  let cx = U/2;
  let cy = V/2;
  for(let i=0;i<U;i++){
    for(let j=0;j<V;j++){
      //Công thức bộ lọc
      let duv = Math.pow(i - cx,2) + Math.pow(j - cy,2);
      H.floatPtr(i,j)[0] = 1 / (1+Math.pow((duv/Math.pow(D0,2)),N));
    }
  }
  return H;      
}

//Tạo bộ lọc thông cao Butterworth
function highPass_Butterworth(D0,U,V,N){
  //Bước 1: Gọi bộ lọc thông thấp
  let Hlow = lowPass_Butterworth(D0,U,V,N);

  //Bước 2: Khởi tạo bộ lọc
  let H = new cv.Mat.zeros(U,V,cv.CV_32F);   
  for(let i=0;i<U;i++){
    for(let j=0;j<V;j++){
      H.floatPtr(i,j)[0] = 1 - Hlow.floatPtr(i,j)[0];
    }
  }
  return H;    
}

//Tạo bộ lọc thông thấp Gaussian
function lowPass_Gaussian(D0,U,V){
  //Bước 1: Khởi tạo bộ lọc      
  let H = new cv.Mat.zeros(U,V,cv.CV_32F);   
  let cx = U/2;
  let cy = V/2;
  for(let i=0;i<U;i++){
    for(let j=0;j<V;j++){
      //Công thức bộ lọc
      let duv2 = Math.pow(i - cx,2) + Math.pow(j - cy,2);
      H.floatPtr(i,j)[0] = Math.exp(-(duv2)/(2*Math.pow(D0,2)));
    }
  }
  return H;      
}

//Tạo bộ lọc thông cao Gaussian
function highPass_Gaussian(D0,U,V){
  //Bước 1: Gọi bộ lọc thông thấp
  let Hlow = lowPass_Gaussian(D0,U,V);

  //Bước 2: Khởi tạo bộ lọc
  let H = new cv.Mat.zeros(U,V,cv.CV_32F);   
  for(let i=0;i<U;i++){
    for(let j=0;j<V;j++){
      H.floatPtr(i,j)[0] = 1 - Hlow.floatPtr(i,j)[0];
    }
  }
  return H;    
}

//Định nghĩa hàm nhân phổ ảnh với bộ lọc
function multiplySpectrum(img1, img2){
  const numRows = img1.rows;
  const numCols = img1.cols;

  // Khởi tạo ma trận output
  let resultImg = new cv.Mat(numRows, numCols, img1.type());

  // Nhân 2 ảnh
  for(let i=0;i<numRows;i++){
    for(let j=0;j<numCols;j++){
      let pixel = img1.floatPtr(i,j);
      
      let a = pixel[0];
      let b = pixel[1];
      let c = img2.floatPtr(i,j)[0];
      
      let real = c*a;
      let imag = c*b;

      resultImg.floatPtr(i,j)[0] = real;
      resultImg.floatPtr(i,j)[1] = imag;
    }
  }
  return resultImg;
}

//Định nghĩa hàm lấy kết quả ảnh sau khi lọc
function takeResult(complexImg, filter,P,Q){
  //Bước 5: Nhân ảnh với bộ lọc 
  let filteredImg = multiplySpectrum(complexImg, filter);

  //Bước 6:
  //Bước 6.1: Thực hiện biến đổi ngược DFT và lấy phần thực
  let realPart = new cv.Mat(P,Q,cv.CV_32F);
  cv.dft(filteredImg,realPart,cv.DFT_INVERSE|cv.DFT_REAL_OUTPUT);      
  //Bước 6.2: Nhân phần thực ảnh sau khi biến đổi ngược với -1 mũ (x+y)
  let realPaddedImg = new cv.Mat.zeros(P, Q, realPart.type());
  for(let x=0; x<P ;x++){
    for(let y=0; y<Q; y++){
      realPaddedImg.floatPtr(x,y)[0] = realPart.floatPtr(x,y)[0] * Math.pow(-1,x+y);
    }
  }      
  cv.normalize(realPaddedImg, realPaddedImg, 0, 1, cv.NORM_MINMAX);      

  //Bước 7: Rút trích ảnh kích thước MxN từ ảnh PxQ
  let rect = new cv.Rect(0,0,P/2,Q/2);
  let result = realPaddedImg.roi(rect);
  return result;
}

//Hàm tính toán thời gian các phép lọc
function calculateTime(){
  return 
}

//Thực hiện lọc
function implementFilter(idealRadius, butterRadius, butterOrder, gaussRadius, type){     
  let start = new Date().getTime();
  let orgImg = cv.imread(inputImg);
  cv.cvtColor(orgImg,orgImg,cv.COLOR_RGBA2GRAY, 0);
  //let size = new cv.Size(275,275);
  //cv.resize(orgImg,orgImg,size,0,0,cv.INTER_AREA);

  //Bước 1: Chuyển ảnh từ kích thước MxN vào ảnh PxQ với P= 2M và Q =2N
  let P = orgImg.rows*2;
  let Q = orgImg.cols*2;      
  let paddedImg = new cv.Mat();
  let s0 = cv.Scalar.all(0);
  cv.copyMakeBorder(orgImg,paddedImg,0,P-orgImg.rows,0,
  Q - orgImg.cols, cv.BORDER_CONSTANT, s0);
  let floatImg = new cv.Mat();
  paddedImg.convertTo(floatImg,cv.CV_32F);      

  //Bước 2: Nhân ảnh fp(x,y) với (-1) mũ (x+y) để tạo ảnh mới
  let centerPaddedImg = new cv.Mat.zeros(P, Q, floatImg.type());
  for(let x=0; x<P ;x++){
    for(let y=0; y<Q; y++){
      centerPaddedImg.floatPtr(x,y)[0] = floatImg.floatPtr(x,y)[0] * Math.pow(-1,x+y);
    }
  }

  //Bước 3: Biến đổi dft
  let plane0 = centerPaddedImg;      
  let plane1 = new cv.Mat.zeros(centerPaddedImg.rows,centerPaddedImg.cols,cv.CV_32F);
  let planes = new cv.MatVector();
  planes.push_back(plane0);
  planes.push_back(plane1);
  let complexImg = new cv.Mat();
  cv.merge(planes, complexImg);
  cv.dft(complexImg,complexImg, cv.DFT_COMPLEX_OUTPUT);      
  
  //Bước 4: Khởi tạo các bộ lọc (Ideal, Butterworth, Gaussian)
  let idealFilter; let butterFilter; let gaussFilter;
  let idealResult; let butterResult; let gaussResult;
  
  let end = new Date().getTime();
  let time = end - start;
  console.log("Time: " + time);
  if(type === true){
    let idealStart = new Date().getTime();
    idealFilter = lowPass_Ideals(idealRadius,P,Q); 
    idealResult = takeResult(complexImg, idealFilter,P,Q);  
    let idealEnd = new Date().getTime();
    let idealTime = idealEnd - idealStart;
    console.log("IdealTime: " + idealTime);
    document.getElementById('ideal-time').innerText = "Time: " + (time+idealTime) + "ms";

    let butterStart = new Date().getTime();
    butterFilter = lowPass_Butterworth(butterRadius,P,Q,butterOrder);    
    butterResult = takeResult(complexImg, butterFilter,P,Q);
    let butterEnd = new Date().getTime();
    let butterTime = butterEnd - butterStart;
    console.log("ButterTime: " + butterTime);
    document.getElementById('butter-time').innerText = "Time: " + (time+butterTime) + "ms";

    let gaussStart = new Date().getTime(); 
    gaussFilter = lowPass_Gaussian(gaussRadius,P,Q);    
    gaussResult = takeResult(complexImg, gaussFilter,P,Q);
    let gaussEnd = new Date().getTime();
    let gaussTime = gaussEnd - gaussStart;
    console.log("GaussTime: " + gaussTime);
    document.getElementById('gauss-time').innerText = "Time: " + (time+gaussTime) + "ms";

  }else{
    let idealStart = new Date().getTime();
    idealFilter = highPass_Ideals(idealRadius,P,Q); 
    idealResult = takeResult(complexImg, idealFilter,P,Q);  
    let idealEnd = new Date().getTime();
    let idealTime = idealEnd - idealStart;
    document.getElementById('ideal-time').innerText = "Time: " + (time+idealTime) + "ms";

    let butterStart = new Date().getTime();
    butterFilter = highPass_Butterworth(butterRadius,P,Q,butterOrder);    
    butterResult = takeResult(complexImg, butterFilter,P,Q);
    let butterEnd = new Date().getTime();
    let butterTime = butterEnd - butterStart;
    document.getElementById('butter-time').innerText = "Time: " + (time+butterTime) + "ms";

    let gaussStart = new Date().getTime(); 
    gaussFilter = highPass_Gaussian(gaussRadius,P,Q);    
    gaussResult = takeResult(complexImg, gaussFilter,P,Q);
    let gaussEnd = new Date().getTime();
    let gaussTime = gaussEnd - gaussStart;
    document.getElementById('gauss-time').innerText = "Time: " + (time+gaussTime) + "ms";
  }

  //Hiển thị kết quả
  cv.imshow('ideal-output', idealResult); 
  cv.imshow('butterworth-output', butterResult);
  cv.imshow('gaussian-output', gaussResult);

  // //Xử lý với 1 ảnh
  // // //Bước 5: Nhân ảnh với bộ lọc 
  // // let filteredImg = multiplySpectrum(complexImg, filter);

  // //Bước 6:
  // //Bước 6.1: Thực hiện biến đổi ngược DFT và lấy phần thực
  // let realPart = new cv.Mat(P,Q,cv.CV_32F);
  // cv.dft(filteredImg,realPart,cv.DFT_INVERSE|cv.DFT_REAL_OUTPUT);      
  // //Bước 6.2: Nhân phần thực ảnh sau khi biến đổi ngược với -1 mũ (x+y)
  
  // let realPaddedImg = new cv.Mat.zeros(P, Q, realPart.type());
  // for(let x=0; x<P ;x++){
  //   for(let y=0; y<Q; y++){
  //     realPaddedImg.floatPtr(x,y)[0] = realPart.floatPtr(x,y)[0] * Math.pow(-1,x+y);
  //   }
  // }      
  // cv.normalize(realPaddedImg, realPaddedImg, 0, 1, cv.NORM_MINMAX);      

  // //Bước 7: Rút trích ảnh kích thước MxN từ ảnh PxQ
  // let rect = new cv.Rect(0,0,P/2,Q/2);
  // let result = realPaddedImg.roi(rect);
  // cv.imshow('ideal-output', result);
}

function apply_click(){     
  if(inputImg.src === ""){
    alert('There is no input image!');
    return;
  }
  let radioBtn1 = document.getElementById('smooth-radio');
  let idealRadius = document.getElementById('ideal-radius').value;
  let butterRadius = document.getElementById('butter-radius').value;
  let butterOrder = document.getElementById('butter-order').value;
  let gaussRadius = document.getElementById('gauss-radius').value;    
  if(idealRadius <= 0 || butterRadius <= 0 || butterOrder <= 0 || gaussRadius <=0){
    alert('Invalid value!');
    return;
  }  
  implementFilter(idealRadius, butterRadius, butterOrder, gaussRadius, radioBtn1.checked);
  console.log(radioBtn1.checked);
  console.log('Proccess done!');
}