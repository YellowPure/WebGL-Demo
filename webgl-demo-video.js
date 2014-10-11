var horizAspect=480/640;
var squareXOffset=0;
var squareYOffset=0;
var squareZOffset=0;
var xIncValue=0.2;
var yIncValue=-0.4;
var zIncValue=0.3;
var squareRotation=0;
var mvMatrixStack=[];

var shaderProgram;
var vertexPositionAttribute;
var perspectiveMatrix;
var vertexColorAttribute;
var textureCoordAttribute;
var vertexNormalAttribute;
var lastSquareUpdateTime;
var cubeVerticesBuffer;
// var cubeVerticesColorBuffer;
var cubeVerticesIndexBuffer;
var cubeTexture;
var cubeImage;
var cubeVerticesTextureCoordBuffer;
var cubeVerticesNormalBuffer;
var videoElement;
var intervalID;

function init(){
	var cv=document.getElementById('cv');
	initWebGL();
	if(gl){
		gl.clearColor(0,0,0,1);
		gl.enable(gl.DEPTH_TEST);
		gl.depthFunc(gl.LEQUAL);
		gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);

		initShaders();

		initBuffers();
		initTextures();

		initVideo();
	}
}

function initVideo(){
	videoElement=document.getElementById('video');

	var isIE=navigator.userAgent.toUpperCase().indexOf("MSIE")?true:false; 
	var isFirefox=window.navigator.userAgent.indexOf("Firefox")?true:false; 
	var isChrome=window.navigator.userAgent.indexOf("Chrome")?true:false; 

	if(isFirefox==true){
		videoElement.addEventListener('canplaythrough',startVideo);
	}else if(isChrome==true){
		videoElement.preload='auto';
	}
	videoElement.addEventListener('ended',videoDone);
	videoElement.src='small.ogv';
}

function startVideo(){
	videoElement.play();
	intervalID=setInterval(drawScene,15);
}

function videoDone(){
	clearInterval(intervalID);
}

function initTextures(){
	cubeTexture=gl.createTexture();

	// cubeImage=new Image();
	// cubeImage.onload=function(){handleTextureLoaded(cubeImage,cubeTexture);}
	// cubeImage.src='cubetexture.png';
}

function handleTextureLoaded(image,texture){
	// console.log("handleTextureLoaded, image = " + image);
	gl.bindTexture(gl.TEXTURE_2D,texture);
	gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);
	gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
	// gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); //gl.NEAREST is also allowed, instead of gl.LINEAR, as neither mipmap.
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); //Prevents s-coordinate wrapping (repeating).
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); //Prevents t-coordinate wrapping (repeating).
	// gl.generateMipmap(gl.TEXTURE_2D);
	gl.bindTexture(gl.TEXTURE_2D,null);

	drawScene();
}
function drawScene(){
	gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);

	perspectiveMatrix=makePerspective(45,640/480,0.1,100);

	loadIdentity();
	mvTranslate([0,0,-6]);

	mvPushMatrix();
	mvRotate(squareRotation,[1,0,1]);
	// mvTranslate([squareXOffset,squareYOffset,squareZOffset]);

	gl.bindBuffer(gl.ARRAY_BUFFER,cubeVerticesBuffer);
	gl.vertexAttribPointer(vertexPositionAttribute,3,gl.FLOAT,false,0,0);

	gl.bindBuffer(gl.ARRAY_BUFFER,cubeVerticesTextureCoordBuffer);
	gl.vertexAttribPointer(textureCoordAttribute,2,gl.FLOAT,false,0,0);

	gl.bindBuffer(gl.ARRAY_BUFFER,cubeVerticesNormalBuffer);
	gl.vertexAttribPointer(vertexNormalAttribute,3,gl.FLOAT,false,0,0);

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D,cubeTexture);
	gl.uniform1i(gl.getUniformLocation(shaderProgram,'uSampler'),0);
	// gl.bindBuffer(gl.ARRAY_BUFFER,cubeVerticesColorBuffer);
	// gl.vertexAttribPointer(vertexColorAttribute,4,gl.FLOAT,false,0,0);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,cubeVerticesIndexBuffer);
	setMatrixUniforms();
	// gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
	gl.drawElements(gl.TRIANGLES,36,gl.UNSIGNED_SHORT,0);
	mvPopMatrix();
	var currentTime=(new Date).getTime();
	if(lastSquareUpdateTime){
		var delta=currentTime-lastSquareUpdateTime;

		squareRotation+=(30*delta)/1000;
		// squareXOffset+=xIncValue*(30*delta)/1000;
		// squareYOffset+=yIncValue*(30*delta)/1000;
		// squareZOffset+=zIncValue*(30*delta)/1000;

		if(Math.abs(squareYOffset)>2.5){
			xIncValue=-xIncValue;
			yIncValue=-yIncValue;
			zIncValue=-zIncValue;
		}
	}
	lastSquareUpdateTime=currentTime;

}

function mvPushMatrix(m){
	if(m){
		mvMatrixStack.push(m.dup());
		mvMatrix=m.dup();
	}else{
		mvMatrixStack.push(mvMatrix.dup());
	}
}

function mvPopMatrix(){
	if(!mvMatrixStack.length){
		throw("can't pop form an empty matrix stack");
	}
	mvMatrix=mvMatrixStack.pop();
	return mvMatrix;
}

function mvRotate(angle,v){
	var inRadians=angle*Math.PI/180;

	var m=Matrix.Rotation(inRadians,$V([v[0],v[1],v[2]])).ensure4x4();
	multMatrix(m);
}

function loadIdentity(){
	mvMatrix=Matrix.I(4)
}

function multMatrix(m){
	mvMatrix=mvMatrix.x(m);
}

function mvTranslate(v){
	multMatrix(Matrix.Translation($V([v[0],v[1],v[2]])).ensure4x4());
}

function setMatrixUniforms(){
	var pUniform=gl.getUniformLocation(shaderProgram,'uPMatrix');
	gl.uniformMatrix4fv(pUniform,false,new Float32Array(perspectiveMatrix.flatten()));

	var mvUniform=gl.getUniformLocation(shaderProgram,'uMVMatrix');
	gl.uniformMatrix4fv(mvUniform,false,new Float32Array(mvMatrix.flatten()));

	var normalMatrix=mvMatrix.inverse();
	normalMatrix=normalMatrix.transpose();
	var nUniform=gl.getUniformLocation(shaderProgram,'uNormalMatrix');
	gl.uniformMatrix4fv(nUniform,false,new Float32Array(normalMatrix.flatten()));
}

function initBuffers(){
	cubeVerticesTextureCoordBuffer=gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER,cubeVerticesTextureCoordBuffer);

	var textureCoordinates=[
		//Front
		0,0,
		1,0,
		1,1,
		0,1,
		//back
		0,0,
		1,0,
		1,1,
		0,1,
		//Top
		0,0,
		1,0,
		1,1,
		0,1,
		//Bottom
		0,0,
		1,0,
		1,1,
		0,1,
		//Right
		0,0,
		1,0,
		1,1,
		0,1,
		//Left
		0,0,
		1,0,
		1,1,
		0,1
	]
	gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(textureCoordinates),gl.STATIC_DRAW);

	cubeVerticesBuffer=gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER,cubeVerticesBuffer);
	var vertices=[
		//front face
		-1,-1,1,
		1,-1,1,
		1,1,1,
		-1,1,1,

		//back face
		-1,-1,-1,
		-1,1,-1,
		1,1,-1,
		1,-1,-1,

		//top face
		-1,1,-1,
		-1,1,1,
		1,1,1,
		1,1,-1,

		//bottom face
		-1,-1,-1,
		1,-1,-1,
		1,-1,1,
		-1,-1,1,

		//left face
		-1,1,1,
		-1,1,-1,
		-1,-1,-1,
		-1,-1,1,

		//right face
		1,1,1,
		1,1,-1,
		1,-1,-1,
		1,-1,1
	]
	gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);


	cubeVerticesNormalBuffer=gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER,cubeVerticesNormalBuffer);
	var vertexNormals=[
		//Front
		0,0,1,
		0,0,1,
		0,0,1,
		0,0,1,
		//Back
		0,0,-1,
		0,0,-1,
		0,0,-1,
		0,0,-1,
		//Top
		0,1,0,
		0,1,0,
		0,1,0,
		0,1,0,
		//Bottom
		0,-1,0,
		0,-1,0,
		0,-1,0,
		0,-1,0,
		//Right
		1,0,0,
		1,0,0,
		1,0,0,
		1,0,0,
		//Left
		-1,0,0,
		-1,0,0,
		-1,0,0,
		-1,0,0
	]
	gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertexNormals),gl.STATIC_DRAW);
	// var colors=[
	// 	[1,1,1,1],
	// 	[1,0,0,1],
	// 	[0,1,0,1],
	// 	[0,0,1,1],
	// 	[1,1,0,1],
	// 	[1,0,1,1]
	// ];

	// var generatedColors=[];

	// for(j=0;j<6;j++){
	// 	var c=colors[j];
	// 	for(i=0;i<4;i++){
	// 		generatedColors=generatedColors.concat(c);
	// 	}
	// }
	// console.log('generatedColors:',generatedColors);
	// cubeVerticesColorBuffer=gl.createBuffer();
	// gl.bindBuffer(gl.ARRAY_BUFFER,cubeVerticesColorBuffer);
	// gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(generatedColors),gl.STATIC_DRAW);

	cubeVerticesIndexBuffer=gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,cubeVerticesIndexBuffer);
	var cubeVertexIndices=[
		0,  1,  2,      0,  2,  3,    // front
	    4,  5,  6,      4,  6,  7,    // back
	    8,  9,  10,     8,  10, 11,   // top
	    12, 13, 14,     12, 14, 15,   // bottom
	    16, 17, 18,     16, 18, 19,   // right
	    20, 21, 22,     20, 22, 23    // left
	]
	
	
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(cubeVertexIndices),gl.STATIC_DRAW);
}

function initShaders(){
	var fragmentShader=getShader(gl,'shader-fs');
	var vertexShader=getShader(gl,'shader-vs');

	shaderProgram=gl.createProgram();
	gl.attachShader(shaderProgram,vertexShader);
	gl.attachShader(shaderProgram,fragmentShader);
	gl.linkProgram(shaderProgram);

	if(!gl.getProgramParameter(shaderProgram,gl.LINK_STATUS)){
		alert('unable to initialize the shader program');
	}
	gl.useProgram(shaderProgram);

	vertexPositionAttribute=gl.getAttribLocation(shaderProgram,'aVertexPosition');
	gl.enableVertexAttribArray(vertexPositionAttribute);

	// vertexColorAttribute=gl.getAttribLocation(shaderProgram,'aVertexColor');
	// gl.enableVertexAttribArray(vertexColorAttribute);

	textureCoordAttribute=gl.getAttribLocation(shaderProgram,'aTextureCoord');
	gl.enableVertexAttribArray(textureCoordAttribute);

	vertexNormalAttribute=gl.getAttribLocation(shaderProgram,'aVertexNormal');
	gl.enableVertexAttribArray(vertexNormalAttribute);
}

function getShader(gl,id){
	var shaderScript,theSource,currentChild,shader;

	shaderScript=document.getElementById(id);
	if(!shaderScript){
		return null;
	}

	theSource='';
	currentChild=shaderScript.firstChild;

	while(currentChild){
		if(currentChild.nodeType==currentChild.TEXT_NODE){
			theSource+=currentChild.textContent;
		}
		currentChild=currentChild.nextSibling;
	}

	if(shaderScript.type=='x-shader/x-vertex'){
		shader=gl.createShader(gl.VERTEX_SHADER);
	}else if(shaderScript.type=='x-shader/x-fragment'){
		shader=gl.createShader(gl.FRAGMENT_SHADER);
	}else{
		return null;
	}

	gl.shaderSource(shader,theSource);

	gl.compileShader(shader);

	if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){
		alert('an error occurred compiling the shaders:'+gl.getShaderInfoLog(shader));
		return null;
	}
	return shader;
}

function initWebGL(){
	window.gl=null;
	try{
		gl=cv.getContext('webgl')|| canvas.getContext("experimental-webgl");
	}catch(e){
		
	}
	if(!gl){alert('web browser is not support WebGL.')}
}