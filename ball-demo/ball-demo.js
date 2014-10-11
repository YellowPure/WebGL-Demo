var camera,gl,canvas,shaderProgram;
var fragmentShader;
var vertexShader;
var buffer,glFragColor,v3Position;

function init(){
	canvas=document.getElementById('my');
	initWebGl();
	if(gl){
		gl.viewport(0,0,canvas.width,canvas.heigth);

		gl.clearColor(0,0,0,1);
		gl.enable(gl.DEPTH_TEST);

		gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);

		initShader();
		initBuffer();
	}
}

function initBuffer(){
	var data=[
		0,1,0,
		-1,-1,0,
		1,0,0
	]

	// glFragColor=gl.getAttribLocation(shaderProgram,'gl_FragColor');
	v3Position=gl.getAttribLocation(shaderProgram,'v3Position');

	buffer=gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER,buffer);

	gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);

	gl.enableVertexAttribArray(v3Position);
	gl.vertexAttribPointer(v3Position,3,gl.FLOAT,false,0,0);
	gl.drawArrays(gl.TRIANGLES,0,3);
}

function initShader(){
	fragmentShader=getShader(gl,'shader-fs');
	vertexShader=getShader(gl,'shader-vs');

	shaderProgram=gl.createProgram();
	gl.attachShader(shaderProgram,vertexShader);
	gl.attachShader(shaderProgram,fragmentShader);
	gl.linkProgram(shaderProgram);

	if(!gl.getProgramParameter(shaderProgram,gl.LINK_STATUS)){
		var lastError = gl.getProgramInfoLog(shaderProgram);
	    console.warn("Error in program linking:" + lastError);

	    gl.deleteProgram(shaderProgram);
	    gl.deleteShader(vertexShader);
	    gl.deleteShader(fragmentShader);
	    return ;
	}

	gl.useProgram(shaderProgram);
}

function getShader(gl,id){
	var sourceCode,currentChild,shaderScript,shader;
	shaderScript=document.getElementById(id);
	if(!shaderScript)return "";
	sourceCode="";
	var currentChild=shaderScript.firstChild;
	while(currentChild){
		if(currentChild.nodeType==currentChild.TEXT_NODE)sourceCode+=currentChild.textContent;
		currentChild=currentChild.nextSibling;
	}

	if(shaderScript.type=='x-shader/x-vertex'){
		shader=gl.createShader(gl.VERTEX_SHADER);
	}else if(shaderScript.type=='x-shader/x-fragment'){
		shader=gl.createShader(gl.FRAGMENT_SHADER);
	}else{
		return null;
	}

	gl.shaderSource(shader,sourceCode);
	gl.compileShader(shader);

	if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){
		console.log(gl.getShaderInfoLog(shader));
		return null;
	}

	return shader;
	// return sourceCode;
}

function initWebGl(){
	try{
		gl=canvas.getContext('webgl')||canvas.getContext('experimental-webgl');
	}catch(e){

	}
	if(!gl)alert("don't support webgl");
}

window.onload=function(){
	init();
}