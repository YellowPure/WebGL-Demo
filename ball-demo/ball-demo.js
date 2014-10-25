
var mvMatrixStack=[];
var modelViewMatrix=mat4.create();
var projectViewMatrix=mat4.create();

var shaderProgram;
var floorVertexPositionBuffer;
var floorVertexIndexBuffer;
var ballVertexPositionBuffer;
var ballVertexNormalBuffer;
var ballVertexTextureCoordBuffer;
var ballVertexIndexBuffer;
var vertexColorAttribute;
var vertexPositionAttribute;
var radius=2;
var latitudeBands=30;
var longitudeBands=30;

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
	initBallBuffers();
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


function initBallBuffers(){
	ballVertexPositionBuffer=gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER,ballVertexPositionBuffer);
	ballVertexNormalBuffer=gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER,ballVertexNormalBuffer);
	var positionArray=[];
	var normalData=[];
	for(var i=0;i<=latitudeBands;i++){
		var item=i*Math.PI/latitudeBands;
		var sinItem=Math.sin(item);
		var cosItem=Math.cos(item);
		for(var j=0;j<=longitudeBands;j++){
			var _item=2*j*Math.PI/longitudeBands;
			var _sinItem=Math.sin(_item);
			var _cosItem=Math.cos(_item);

			var x=_sinItem*sinItem;
			var y=cosItem;
			var z=_cosItem*sinItem;

			normalData.push(x);
			normalData.push(y);
			normalData.push(z);
			positionArray.push(radius*x);
			positionArray.push(radius*y);
			positionArray.push(radius*z);
		}
	}
	gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(positionArray),gl.STATIC_DRAW);
	ballVertexPositionBuffer.itemSize=3;
	ballVertexPositionBuffer.numberOfItems=positionArray.length/3;

	gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(normalData),gl.STATIC_DRAW);
	ballVertexNormalBuffer.itemSize=3;
	ballVertexNormalBuffer.numberOfItems=positionArray.length/3;

	ballVertexIndexBuffer=gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ballVertexIndexBuffer);
	var indexData=[];
	for (var latNumber = 0; latNumber < latitudeBands; latNumber++) {
		for (var longNumber = 0; longNumber < longitudeBands; longNumber++) {
			var first=latNumber*(longitudeBands+1)+longNumber;
			var sencond=first+longitudeBands+1;
			indexData.push(first);
			indexData.push(sencond);
			indexData.push(first+1);

			indexData.push(sencond);
			indexData.push(sencond+1);
			indexData.push(first+1);
		}
	}
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indexData),gl.STATIC_DRAW);
	ballVertexIndexBuffer.itemSize=1;
	ballVertexIndexBuffer.numberOfItems=indexData.length;
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
	mat4.translate(modelViewMatrix,[5,5,0],modelViewMatrix);
	
	
	uploadMatrixToShader();
	gl.disableVertexAttribArray(vertexColorAttribute);
	gl.vertexAttrib4f(vertexColorAttribute,1,1,0,1);

	gl.bindBuffer(gl.ARRAY_BUFFER,ballVertexPositionBuffer);
	gl.vertexAttribPointer(vertexPositionAttribute,ballVertexPositionBuffer.itemSize,gl.FLOAT,false,0,0);

	// gl.bindBuffer(gl.ARRAY_BUFFER,ballVertexNormalBuffer);
	// gl.vertexAttribPointer(vertexPositionAttribute,ballVertexNormalBuffer.itemSize,gl.FLOAT,false,0,0);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ballVertexIndexBuffer);
	gl.drawElements(gl.TRIANGLE,ballVertexIndexBuffer.numberOfItems,gl.UNSIGNED_SHORT,0);
	mvPopMatrix();
}