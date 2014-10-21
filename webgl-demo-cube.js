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
var vertexColorAttribute;
// var squareVerticesColorBuffer;
var vertexAttribute;
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
function drawScene(){
	gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);

	perspectiveMatrix=makePerspective(45,640/480,0.1,100);

	loadIdentity();


	mvTranslate([-0,0,-6]);
	// mvRotate(1,[10,0,1]);
	// gl.viewport(0,0,640,480);
	gl.bindBuffer(gl.ARRAY_BUFFER,cubeVerticesBuffer);
	gl.vertexAttribPointer(vertexPositionAttribute,3,gl.FLOAT,false,0,0);
	gl.bindBuffer(gl.ARRAY_BUFFER,cubeVerticesColorBuffer);
	gl.vertexAttribPointer(vertexColorAttribute,4,gl.FLOAT,false,0,0);


	setMatrixUniforms();
	gl.drawArrays(gl.TRIANGLE_STRIP,0,4);

	requestAnimationFrame(drawScene);
}

function initBuffers(){
	cubeVerticesBuffer=gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER,cubeVerticesBuffer);
	var vertices=[
		1,1,0,
		-1,1,0,
		1,-1,0,
		-1,-1,0
	]
	gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);

	cubeVerticesColorBuffer=gl.createBuffer();
	var colors=[
		1,0,0,1,
		0,1,0,1,
		0,0,1,1,
		0,0,0,1
	]
	gl.bindBuffer(gl.ARRAY_BUFFER,cubeVerticesColorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(colors),gl.STATIC_DRAW);
}

function initShaders(){
	var fragmentShader=getShader(gl,'shader-fs');
	var vertexShader=getShader(gl,'shader-vs');

	shaderProgram=gl.createProgram();
	gl.attachShader(shaderProgram,vertexShader);
	gl.attachShader(shaderProgram,fragmentShader);
	gl.linkProgram(shaderProgram);

	if(!gl.getProgramParameter(shaderProgram,gl.LINK_STATUS)){
		console.log('unable to initialize the shader program');
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
		console.log('an error occurred compiling the shaders:'+gl.getShaderInfoLog(shader));
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