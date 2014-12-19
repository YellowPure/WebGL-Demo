/*
version v1.0
author Yellow
data 2014.10.28
*/
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
var floorVertorTextureCoordinateBuffer;
var uniformSamplerLoc;
var vertexTextureAttributeLoc;
var cubeVertorTextureCoordinateBuffer
var floorTexture;
var woodTexture;
var cubeTexture;

function init(){
	var cv=document.getElementById('cv');
	//webgl 上下文丢失事件
	cv.addEventListener('webglcontextlost',contextLostHandler);
	cv.addEventListener('webglcontextRestored',restoredHandler);
	//初始化webgl
	initWebGL();
	if(gl){
		//以rgba()填充webglRenderingContext
		gl.clearColor(0,0,0,1);
		//允许更新深度缓存
		gl.enable(gl.DEPTH_TEST);
		//Pass if the incoming value is less than or equal to the depth buffer value.
		gl.depthFunc(gl.LEQUAL);
		//清除颜色缓存和深度缓存
		gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);

		initShaders();

		initBuffers();
		initTexture();	

		drawScene();
		addEvent();
	}
}

function changeMagTextureModel(target,value){
	gl.bindTexture(gl.TEXTURE_2D, target);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, value);
	gl.bindTexture(gl.TEXTURE_2D, null);
}

function changeMinTextureModel(target,value){
	gl.bindTexture(gl.TEXTURE_2D, target);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, value);
	gl.bindTexture(gl.TEXTURE_2D, null);
}

function addEvent(){
	var btn1=document.getElementById('linear');
	var btn2=document.getElementById('nearest');
	var btn3=document.getElementById('linear_mipmap_nearest');
	var btn4=document.getElementById('linear_mipmap_linear');
	var btn5=document.getElementById('nearest_mipmap_linear');
	var btn6=document.getElementById('nearest_mipmap_nearest');
	var btn7=document.getElementById('mag_linear');
	var btn8=document.getElementById('mag_nearest');
	btn1.addEventListener('click',function(){
		changeMinTextureModel(floorTexture,gl.LINEAR);
		changeMinTextureModel(woodTexture,gl.LINEAR);
		changeMinTextureModel(cubeTexture,gl.LINEAR);
	});
	btn2.addEventListener('click',function(){
		changeMinTextureModel(floorTexture,gl.NEAREST);
		changeMinTextureModel(woodTexture,gl.NEAREST);
		changeMinTextureModel(cubeTexture,gl.NEAREST);
	});
	btn3.addEventListener('click',function(){
		changeMinTextureModel(floorTexture,gl.LINEAR_MIPMAP_NEAREST);
		changeMinTextureModel(woodTexture,gl.LINEAR_MIPMAP_NEAREST);
		changeMinTextureModel(cubeTexture,gl.LINEAR_MIPMAP_NEAREST);
	});
	btn4.addEventListener('click',function(){
		changeMinTextureModel(floorTexture,gl.LINEAR_MIPMAP_LINEAR);
		changeMinTextureModel(woodTexture,gl.LINEAR_MIPMAP_LINEAR);
		changeMinTextureModel(cubeTexture,gl.LINEAR_MIPMAP_LINEAR);
	});
	btn5.addEventListener('click',function(){
		changeMinTextureModel(floorTexture,gl.NEAREST_MIPMAP_LINEAR);
		changeMinTextureModel(woodTexture,gl.NEAREST_MIPMAP_LINEAR);
		changeMinTextureModel(cubeTexture,gl.NEAREST_MIPMAP_LINEAR);
	});
	btn6.addEventListener('click',function(){
		changeMinTextureModel(floorTexture,gl.NEAREST_MIPMAP_NEAREST);
		changeMinTextureModel(woodTexture,gl.NEAREST_MIPMAP_NEAREST);
		changeMinTextureModel(cubeTexture,gl.NEAREST_MIPMAP_NEAREST);
	});
	btn7.addEventListener('click',function(){
		changeMagTextureModel(floorTexture,gl.LINEAR);
		changeMagTextureModel(woodTexture,gl.LINEAR);
		changeMagTextureModel(cubeTexture,gl.LINEAR);
	});
	btn8.addEventListener('click',function(){
		changeMagTextureModel(floorTexture,gl.NEAREST);
		changeMagTextureModel(woodTexture,gl.NEAREST);
		changeMagTextureModel(cubeTexture,gl.NEAREST);
	});
}

function contextLostHandler(event){
	event.preventDefault();
	// cancelRequestAnimFrame(pwgl.)
}
function restoredHandler(event){
	initShaders();
	initBuffers();
	// drawScene();
}

function initWebGL(){
	window.gl=null;
	//浏览器是否对webgl支持
	try{
		gl=cv.getContext('webgl')|| canvas.getContext("experimental-webgl");
	}catch(e){
		
	}
	if(!gl){alert('web browser is not support WebGL.')}
}

function initShaders(){
	//生成顶点着色器和片段着色器
	var fragmentShader=getShader(gl,'shader-fs');
	var vertexShader=getShader(gl,'shader-vs');

	//生成程序对象
	shaderProgram=gl.createProgram();
	//将顶点和片段着色器附加到WebGLProgram中
	gl.attachShader(shaderProgram,vertexShader);
	gl.attachShader(shaderProgram,fragmentShader);
	//链接一段附有vertextShader和fragmentShader的WebGLProgram
	gl.linkProgram(shaderProgram);

	if(!gl.getProgramParameter(shaderProgram,gl.LINK_STATUS)&&!gl.isContextLost()){
		console.log('unable to initialize the shader program');
	}
	//设置该对象用于渲染
	gl.useProgram(shaderProgram);
	//获取某个属性的通用属性索引
	vertexPositionAttribute=gl.getAttribLocation(shaderProgram,'aVertexPosition');
	//打开一个顶点属性在顶点属性数组中的特定索引位置
	gl.enableVertexAttribArray(vertexPositionAttribute);

	// vertexColorAttribute=gl.getAttribLocation(shaderProgram,'aVertexColor');
	// gl.enableVertexAttribArray(vertexColorAttribute);

	
	// gl.activeTexture(gl.TEXTURE0);

	vertexTextureAttributeLoc=gl.getAttribLocation(shaderProgram,'aTextureCoordinates');
	gl.enableVertexAttribArray(vertexTextureAttributeLoc);
}

function initTexture(){
	floorTexture=gl.createTexture();
	setTexture('wood_floor_256.jpg',floorTexture);

	woodTexture=gl.createTexture();
	setTexture('wood_128x128.jpg',woodTexture);

	cubeTexture=gl.createTexture();
	setTexture('wicker_256.jpg',cubeTexture);
}

/*
	设置纹理
	纹理所用资源遵循同域策略 或者用CORS跨域 服务器在响应头中插入Access0Control-Allow-Origin image.crossOrigin='anonymous'
*/
function setTexture(imgSrc,texture){
	var img=new Image();
	img.src=imgSrc;
	img.onload=function(){
		//绑定为当前纹理对象 纹理大小必须是2的n次方
		gl.bindTexture(gl.TEXTURE_2D,texture);
		//图像用作纹理时不上下颠倒
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
		/*
			第一个参数 2d纹理
			第二个参数 Mip映射级别 应用Mip映射纹理的方法是让WebGL自动生成映射链 从零级纹理开始
			第三个参数 内部格式
			第四个参数 格式 （在WebGL中 这2个参数必须相同）
			第五个参数 定义每个纹素数据的存储类型 UNSIGNED_BYTE 表示用一个字节存储红绿蓝和alpha通道 共需要4个字节
			第六个参数 Image对象
		*/
		gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);
		//自动生成Mip映射纹理链
		gl.generateMipmap(gl.TEXTURE_2D);
		/*
			定义纹理的伸展过滤器 第三个参数为伸展过滤设置为线性模式 还有一种gl.NEAREST 最近相邻模式
			线性模式在伸展时会出现模糊 相邻模式伸展时会出现块状
		*/
		gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
		//定义纹理的收缩过滤器
		gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
		/*
			为纹理在s和t方向定义包装模式 默认包装模式为gl.REPEAT 
			其他模式：  
			gl.MIRRORED_REPEAT 常用于纹理坐标整数部分为偶数时，在表面产生无缝平铺效果
			gl.CLAMP_TO_EDGE 所有纹理坐标都嵌在[0,1]范围内
		*/
		gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.MIRRORED_REPEAT);
		gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.MIRRORED_REPEAT);
		gl.bindTexture(gl.TEXTURE_2D,null);
	}
}
function initBuffers(){
	initFloorBuffers();
	initCubeBuffers();
}

function initFloorBuffers(){
	//初始化一个webGLBufffer对象
	floorVertexPositionBuffer=gl.createBuffer();
	//将新建的buffer对象绑定为当前的数组缓冲对象
	gl.bindBuffer(gl.ARRAY_BUFFER,floorVertexPositionBuffer);
	//顶点数据
	var floorPosition=[
		5,0,5,
		5,0,-5,
		-5,0,-5,
		-5,0,5
	];
	//把顶点数据写入到当前的WebGLBuffer对象中
	gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(floorPosition),gl.STATIC_DRAW);
	//每个属性有多少个分量
	floorVertexPositionBuffer.itemSize=3;
	//缓冲中项或顶点的个数
	floorVertexPositionBuffer.numberOfItems=4;

	floorVertorTextureCoordinateBuffer=gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER,floorVertorTextureCoordinateBuffer);
	//纹理坐标数组
	var textureCoordinates=[
		0,0,
		0,3,
		3,3,
		3,0
	]
	gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(textureCoordinates),gl.STATIC_DRAW);
	floorVertorTextureCoordinateBuffer.itemSize=2;
	floorVertorTextureCoordinateBuffer.numberOfItems=4;
	//缓冲用元素数组
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

	cubeVertorTextureCoordinateBuffer=gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER,cubeVertorTextureCoordinateBuffer);
	var cubeTextureCoordinates=[
		//Front face
	    0.0, 0.0, //v0
	    1.0, 0.0, //v1
	    1.0, 1.0, //v2
	    0.0, 1.0, //v3
	    
	    // Back face
	    0.0, 1.0, //v4
	    1.0, 1.0, //v5
	    1.0, 0.0, //v6
	    0.0, 0.0, //v7
	    
	    // Left face
	    0.0, 1.0, //v8
	    1.0, 1.0, //v9
	    1.0, 0.0, //v10
	    0.0, 0.0, //v11
	    
	    // Right face
	    0.0, 1.0, //v12
	    1.0, 1.0, //v13
	    1.0, 0.0, //v14
	    0.0, 0.0, //v15
	    
	    // Top face
	    0.0, 1.0, //v16
	    1.0, 1.0, //v17
	    1.0, 0.0, //v18
	    0.0, 0.0, //v19
	    
	    // Bottom face
	    0.0, 1.0, //v20
	    1.0, 1.0, //v21
	    1.0, 0.0, //v22
	    0.0, 0.0, //v23
	]
	gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(cubeTextureCoordinates),gl.STATIC_DRAW);
	cubeVertorTextureCoordinateBuffer.itemSize=2;
	cubeVertorTextureCoordinateBuffer.numberOfItems=24;

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

	//获得javascript 文本
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
	//将源代码写入shader中
	gl.shaderSource(shader,theSource);
	//GLSL着色器源代码编译成二进制数据
	gl.compileShader(shader);
	//编译失败则返回
	if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)&&!gl.isContextLost()){
		console.log('an error occurred compiling the shaders:'+gl.getShaderInfoLog(shader));
		return null;
	}
	return shader;
}
//保存模型视图矩阵
function mvPushMatrix(m){
	if(m){
		var _m=mat4.create(m);
		mvMatrixStack.push(_m);
		modelViewMatrix=_m;
	}else{
		mvMatrixStack.push(mat4.create(modelViewMatrix));
	}

}
//恢复该矩阵
function mvPopMatrix(){
	if(!mvMatrixStack.length){
		throw("can't pop form an empty matrix stack");
	}
	modelViewMatrix=mvMatrixStack.pop();
	return modelViewMatrix;
}

function uploadMatrixToShader(){
	//获取着色程序中的参数
	var pUniform=gl.getUniformLocation(shaderProgram,'uPMatrix');
	//将该参数设置为projectViewMatrix的值
	gl.uniformMatrix4fv(pUniform,false,projectViewMatrix);
	var mvUniform=gl.getUniformLocation(shaderProgram,'uMVMatrix');
	gl.uniformMatrix4fv(mvUniform,false,modelViewMatrix);

	uniformSamplerLoc=gl.getUniformLocation(shaderProgram,'uSampler');
	//将一个整数值赋给一个统一的变量为当前程序对象
	gl.uniform1i(uniformSamplerLoc, 0);
}

function drawFloor(){
	// gl.disableVertexAttribArray(vertexColorAttribute);
	// gl.vertexAttrib4f(vertexColorAttribute,r,g,b,a);

	gl.bindBuffer(gl.ARRAY_BUFFER,floorVertexPositionBuffer);
	gl.vertexAttribPointer(vertexPositionAttribute,floorVertexPositionBuffer.itemSize,gl.FLOAT,false,0,0);

	gl.bindBuffer(gl.ARRAY_BUFFER,floorVertorTextureCoordinateBuffer);
	gl.vertexAttribPointer(vertexTextureAttributeLoc,floorVertorTextureCoordinateBuffer.itemSize,gl.FLOAT,false,0,0);
	//设定要操作的纹理单元
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D,floorTexture);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,floorVertexIndexBuffer);
	gl.drawElements(gl.TRIANGLE_FAN,floorVertexIndexBuffer.numberOfItems,gl.UNSIGNED_SHORT,0);
}

function drawCube(texture){
	// gl.disableVertexAttribArray(vertexColorAttribute);
	// gl.vertexAttrib4f(vertexColorAttribute,r,g,b,a);

	gl.bindBuffer(gl.ARRAY_BUFFER,cubeVertexPositionBuffer);
	gl.vertexAttribPointer(vertexPositionAttribute,cubeVertexPositionBuffer.itemSize,gl.FLOAT,false,0,0);

	gl.bindBuffer(gl.ARRAY_BUFFER,cubeVertorTextureCoordinateBuffer);
	gl.vertexAttribPointer(vertexTextureAttributeLoc,cubeVertorTextureCoordinateBuffer.itemSize,gl.FLOAT,false,0,0);

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D,texture);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,cubeVertexIndexBuffer);
	gl.drawElements(gl.TRIANGLES,cubeVertexIndexBuffer.numberOfItems,gl.UNSIGNED_SHORT,0);
}

function drawTable(texture){
	mvPushMatrix();
	mat4.translate(modelViewMatrix,[0,1,0],modelViewMatrix);
	mat4.scale(modelViewMatrix,[2,0.1,2],modelViewMatrix);
	uploadMatrixToShader();
	drawCube(texture);
	mvPopMatrix();

	for(var j=-1;j<2;j+=2){
		for(var i=-1;i<2;i+=2){
			mvPushMatrix();
			mat4.translate(modelViewMatrix,[1.9*i,-0.1,1.9*j],modelViewMatrix);
			mat4.scale(modelViewMatrix,[0.1,1,0.1],modelViewMatrix);
			uploadMatrixToShader();
			drawCube(texture);
			mvPopMatrix();
		}
	}
}

function drawChair(texture){
	mvPushMatrix();
	mat4.scale(modelViewMatrix,[1,0.2,1],modelViewMatrix);
	uploadMatrixToShader();
	drawCube(texture);
	mvPopMatrix();

	mvPushMatrix();
	mat4.translate(modelViewMatrix,[-0.9,1.2,0],modelViewMatrix);
	mat4.scale(modelViewMatrix,[0.1,1,1],modelViewMatrix);
	uploadMatrixToShader();
	drawCube(texture);
	mvPopMatrix();

	
	for(var j=-1;j<2;j+=2){
		for(var i=-1;i<2;i+=2){
			mvPushMatrix();
			mat4.translate(modelViewMatrix,[0.9*i,-1,0.9*j],modelViewMatrix);
			mat4.scale(modelViewMatrix,[0.1,0.8,0.1],modelViewMatrix);
			uploadMatrixToShader();
			drawCube(texture);
			mvPopMatrix();
		}
	}
	
}

function drawScene(){
	gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
	gl.viewport(0,0,640,480);
	
	/*设置透视投影的矩阵
		第一个参数 视域垂直范围
		第一个参数 纵横比(视口宽/视口高)
		第三个参数 近平面离观察者距离
		第四个参数 远平面离观察者距离
		第五个参数 投影矩阵
	*/
	mat4.perspective(60,640/480,0.1,100,projectViewMatrix);
	/* 设置modelViewMatrix为单位矩阵
		[1,0,0,0,
		 0,1,0,0,
		 0,0,1,0,
		 0,0,0,1
		]
	*/
	mat4.identity(modelViewMatrix);
	/*
		第一个参数定义观察者位置
		第二个参数定义视图方向指向原点
		第三个参数定义照相机向上方向为y轴正方向
	*/
	mat4.lookAt([-5,7,-5],[0,0,0],[0,1,0],modelViewMatrix);

	uploadMatrixToShader();
	drawFloor();

	mvPushMatrix();
	//模型视图变换 z轴平移-10
	mat4.translate(modelViewMatrix,[0,1.1,0],modelViewMatrix);
	uploadMatrixToShader();
	drawTable(woodTexture);
	mvPopMatrix();

	mvPushMatrix();
	mat4.translate(modelViewMatrix,[0,3.2,0],modelViewMatrix);
	// mat4.scale(modelViewMatrix, [2, 2, 2], modelViewMatrix);
	uploadMatrixToShader();
	drawCube(cubeTexture);
	mvPopMatrix();

	mvPushMatrix();
	mat4.translate(modelViewMatrix,[4,1.8,0],modelViewMatrix);
	uploadMatrixToShader();
	drawChair(woodTexture);
	mvPopMatrix();
	
	requestAnimationFrame(drawScene);
}