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
// var squareVerticesBuffer;
var perspectiveMatrix;
// var squareVerticesColorBuffer;
var vertexColorAttribute;
var lastSquareUpdateTime;
var cubeVerticesBuffer;
var cubeVerticesColorBuffer;
var cubeVerticesIndexBuffer;

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
		drawScene();
	}
}
function drawScene(){
	gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);

	perspectiveMatrix=makePerspective(45,640/480,0.1,100);

	loadIdentity();
	mvTranslate([0,0,-6]);

	mvPushMatrix();
	mvRotate(squareRotation,[1,0,1]);
	mvTranslate([squareXOffset,squareYOffset,squareZOffset]);

	gl.bindBuffer(gl.ARRAY_BUFFER,cubeVerticesBuffer);
	gl.vertexAttribPointer(vertexPositionAttribute,3,gl.FLOAT,false,0,0);

	gl.bindBuffer(gl.ARRAY_BUFFER,cubeVerticesColorBuffer);
	gl.vertexAttribPointer(vertexColorAttribute,4,gl.FLOAT,false,0,0);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,cubeVerticesIndexBuffer);
	setMatrixUniforms();
	// gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
	gl.drawElements(gl.TRIANGLES,36,gl.UNSIGNED_SHORT,0);
	mvPopMatrix();
	var currentTime=(new Date).getTime();
	if(lastSquareUpdateTime){
		var delta=currentTime-lastSquareUpdateTime;

		squareRotation+=(30*delta)/1000;
		squareXOffset+=xIncValue*(30*delta)/1000;
		squareYOffset+=yIncValue*(30*delta)/1000;
		squareZOffset+=zIncValue*(30*delta)/1000;

		if(Math.abs(squareYOffset)>2.5){
			xIncValue=-xIncValue;
			yIncValue=-yIncValue;
			zIncValue=-zIncValue;
		}
	}
	lastSquareUpdateTime=currentTime;

	requestAnimationFrame(drawScene);
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
}

function initBuffers(){
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

	var colors=[
		[1,1,1,1],
		[1,0,0,1],
		[0,1,0,1],
		[0,0,1,1],
		[1,1,0,1],
		[1,0,1,1]
	];

	var generatedColors=[];

	for(j=0;j<6;j++){
		var c=colors[j];
		for(i=0;i<4;i++){
			generatedColors=generatedColors.concat(c);
		}
	}
	// console.log('generatedColors:',generatedColors);
	cubeVerticesColorBuffer=gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER,cubeVerticesColorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(generatedColors),gl.STATIC_DRAW);

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

	vertexColorAttribute=gl.getAttribLocation(shaderProgram,'aVertexColor');
	gl.enableVertexAttribArray(vertexColorAttribute);
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