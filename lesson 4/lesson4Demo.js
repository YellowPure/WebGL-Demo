
var mvMatrixStack=[];
var modelViewMatrix=mat4.create();
var projectViewMatrix=mat4.create();

var shaderProgram;
var floorVertexPositionBuffer;
var floorVertexIndexBuffer;
var cubeVertexPositionBuffer;
var cubeVertexIndexBuffer;
var cubeVertexColorBuffer;
var vertexColorAttribute;
var vertexPositionAttribute;

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

function initWebGL(){
	window.gl=null;
	try{
		gl=cv.getContext('webgl')|| canvas.getContext("experimental-webgl");
	}catch(e){
		
	}
	if(!gl){alert('web browser is not support WebGL.')}
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
function initBuffers(){
	initFloorBuffers();
	initCubeBuffers();
}

function initFloorBuffers(){
	floorVertexPositionBuffer=gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER,floorVertexPositionBuffer);
	var floorPosition=[
		5,0,5,
		5,0,-5,
		-5,0,-5,
		-5,0,5
	]
	gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(floorPosition),gl.STATIC_DRAW);
	floorVertexPositionBuffer.itemSize=3;
	floorVertexPositionBuffer.numberOfItems=4;

	floorVertexIndexBuffer=gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,floorVertexIndexBuffer);
	var floorIndeices=[0,1,2,3];
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(floorIndeices),gl.STATIC_DRAW);
	floorVertexIndexBuffer.itemSize=1;
	floorVertexIndexBuffer.numberOfItems=4;
}

function initCubeBuffers(){
	cubeVertexPositionBuffer=gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER,cubeVertexPositionBuffer);
	var cubePosition=[
		//front face
		1,1,1,
		1,-1,1,
		-1,-1,1,
		-1,1,1,
		//back face
		1,1,-1,
		1,-1,-1,
		-1,-1,-1,
		-1,1,-1,
		//left face
		-1,1,1,
		-1,-1,1,
		-1,-1,-1,
		-1,1,-1,
		//right face
		1,1,1,
		1,-1,1,
		1,-1,-1,
		1,1,-1,
		//top face
		-1,1,1,
		1,1,1,
		1,1,-1,
		-1,1,-1,
		//bottom face
		-1,-1,1,
		1,-1,1,
		1,-1,-1,
		-1,-1,-1,
	]

	gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(cubePosition),gl.STATIC_DRAW);
	cubeVertexPositionBuffer.itemSize=3;
	cubeVertexPositionBuffer.numberOfItems=24;


	cubeVertexIndexBuffer=gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,cubeVertexIndexBuffer);
	var cubeIndeices = [
            0, 1, 2,      0, 2, 3,    // Front face
            4, 6, 5,      4, 7, 6,    // Back face
            8, 9, 10,     8, 10, 11,  // Left face
            12, 13, 14,   12, 14, 15, // Right face
            16, 17, 18,   16, 18, 19, // Top face
            20, 22, 21,   20, 23, 22  // Bottom face
        ];
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(cubeIndeices),gl.STATIC_DRAW);
	cubeVertexIndexBuffer.itemSize=1;
	cubeVertexIndexBuffer.numberOfItems=36;
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

function mvPushMatrix(m){
	if(m){
		var _m=mat4.create(m);
		mvMatrixStack.push(_m);
		modelViewMatrix=_m;
	}else{
		mvMatrixStack.push(mat4.create(modelViewMatrix));
	}
}

function mvPopMatrix(){
	if(!mvMatrixStack.length){
		throw("can't pop form an empty matrix stack");
	}
	modelViewMatrix=mvMatrixStack.pop();
	return modelViewMatrix;
}

function uploadMatrixToShader(){
	var pUniform=gl.getUniformLocation(shaderProgram,'uPMatrix');
	gl.uniformMatrix4fv(pUniform,false,projectViewMatrix);

	var mvUniform=gl.getUniformLocation(shaderProgram,'uMVMatrix');
	gl.uniformMatrix4fv(mvUniform,false,modelViewMatrix);
}

function drawFloor(r,g,b,a){
	gl.disableVertexAttribArray(vertexColorAttribute);
	gl.vertexAttrib4f(vertexColorAttribute,r,g,b,a);

	gl.bindBuffer(gl.ARRAY_BUFFER,floorVertexPositionBuffer);
	gl.vertexAttribPointer(vertexPositionAttribute,floorVertexPositionBuffer.itemSize,gl.FLOAT,false,0,0);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,floorVertexIndexBuffer);
	gl.drawElements(gl.TRIANGLE_FAN,floorVertexIndexBuffer.numberOfItems,gl.UNSIGNED_SHORT,0);
}

function drawCube(r,g,b,a){
	gl.disableVertexAttribArray(vertexColorAttribute);
	gl.vertexAttrib4f(vertexColorAttribute,r,g,b,a);

	gl.bindBuffer(gl.ARRAY_BUFFER,cubeVertexPositionBuffer);
	gl.vertexAttribPointer(vertexPositionAttribute,cubeVertexPositionBuffer.itemSize,gl.FLOAT,false,0,0);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,cubeVertexIndexBuffer);
	gl.drawElements(gl.TRIANGLES,cubeVertexIndexBuffer.numberOfItems,gl.UNSIGNED_SHORT,0);
}

function drawTable(){
	mvPushMatrix();
	mat4.translate(modelViewMatrix,[0,1,0],modelViewMatrix);
	mat4.scale(modelViewMatrix,[2,0.1,2],modelViewMatrix);
	uploadMatrixToShader();
	drawCube(0.72,0.53,0.04,1);
	mvPopMatrix();

	for(var j=-1;j<2;j+=2){
		for(var i=-1;i<2;i+=2){
			mvPushMatrix();
			mat4.translate(modelViewMatrix,[1.9*i,-0.1,1.9*j],modelViewMatrix);
			mat4.scale(modelViewMatrix,[0.1,1,0.1],modelViewMatrix);
			uploadMatrixToShader();
			drawCube(0.72,0.53,0.04,1);
			mvPopMatrix();
		}
	}
}

function drawChair(){
	mvPushMatrix();
	mat4.scale(modelViewMatrix,[1,0.2,1],modelViewMatrix);
	uploadMatrixToShader();
	drawCube(1,0,1,1);
	mvPopMatrix();

	mvPushMatrix();
	mat4.translate(modelViewMatrix,[-0.9,1.2,0],modelViewMatrix);
	mat4.scale(modelViewMatrix,[0.1,1,1],modelViewMatrix);
	uploadMatrixToShader();
	drawCube(1,0,1,1);
	mvPopMatrix();

	
	for(var j=-1;j<2;j+=2){
		for(var i=-1;i<2;i+=2){
			mvPushMatrix();
			mat4.translate(modelViewMatrix,[0.9*i,-1,0.9*j],modelViewMatrix);
			mat4.scale(modelViewMatrix,[0.1,0.8,0.1],modelViewMatrix);
			uploadMatrixToShader();
			drawCube(1,0,1,1);
			mvPopMatrix();
		}
	}
	
}

function drawScene(){
	gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
	gl.viewport(0,0,640,480);

	mat4.perspective(60,640/480,0.1,100,projectViewMatrix);
	mat4.identity(modelViewMatrix);
	mat4.lookAt([8,5,10],[0,0,0],[0,1,0],modelViewMatrix);

	uploadMatrixToShader();
	// mvPushMatrix();
	drawFloor(1.0,0.0,0.0,1.0);
	
	mvPushMatrix();
	mat4.translate(modelViewMatrix,[0,1.1,0],modelViewMatrix);
	uploadMatrixToShader();
	drawTable();
	mvPopMatrix();

	mvPushMatrix();
	mat4.translate(modelViewMatrix,[0,2.7,0],modelViewMatrix);
	mat4.scale(modelViewMatrix, [0.5, 0.5, 0.5], modelViewMatrix);
	uploadMatrixToShader();
	drawCube(0,1,0,1);
	mvPopMatrix();

	mvPushMatrix();
	mat4.translate(modelViewMatrix,[4,1.8,0],modelViewMatrix);
	uploadMatrixToShader();
	drawChair();
	mvPopMatrix();
}