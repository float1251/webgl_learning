declare var mat4: any;

var texture: WebGLTexture;

let VSHADER_SRC = `
attribute vec3 position;
attribute vec4 color;
attribute vec2 textureCoord;
uniform   mat4 mvpMatrix;
varying   vec4 vColor;
varying   vec2 vTextureCoord;

void main(void){
    vColor      = color;
    vTextureCoord = textureCoord;
    gl_Position = mvpMatrix * vec4(position, 1.0);
}`;

let FSHADER_SRC = `
precision mediump float;

uniform sampler2D texture;
varying vec4 vColor;
varying vec2 vTextureCoord;

void main(void){
    vec4 smpColor = texture2D(texture, vTextureCoord);
    gl_FragColor    = vColor * smpColor;
}`;


function main() {
    var canvas: HTMLCanvasElement = <HTMLCanvasElement>document.getElementById("webgl");
    if(!canvas){
        alert("No Canvas");
        return;
    }

    var gl: WebGLRenderingContext;
    // 行列変換処理
    var mMatrix = mat4.create();
    var vMatrix = mat4.create();
    var pMatrix = mat4.create();
    var tmpMatrix = mat4.create();
    var mvpMatrix = mat4.create();
    var invMatrix = mat4.create();

    gl = getWebGLContext(canvas);

    var program = initShaders(gl, VSHADER_SRC, FSHADER_SRC);

    // attributeLocationの取得
    var attLocation = new Array();
    attLocation[0] = gl.getAttribLocation(program, "position");
    attLocation[1] = gl.getAttribLocation(program, "color");
    attLocation[2] = gl.getAttribLocation(program, "textureCoord");

    // attributeの要素数(この要素はxyzの3要素)
    var attStride = new Array();
    attStride[0] = 3;
    attStride[1] = 4;
    attStride[2] = 2;

    //  頂点の位置
    var position = [
        -1.0,  1.0,  0.0,
         1.0,  1.0,  0.0,
        -1.0, -1.0,  0.0,
         1.0, -1.0,  0.0  
    ]

    // 頂点色
    var color = [
        1.0, 1.0, 1.0, 1.0,
        1.0, 1.0, 1.0, 1.0,
        1.0, 1.0, 1.0, 1.0,
        1.0, 1.0, 1.0, 1.0
    ]

    // テクスチャ座標
    var textureCoord = [
        0.0, 0.0,
        1.0, 0.0,
        0.0, 1.0,
        1.0, 1.0
    ]

    // 頂点インデックス
    var index = [
        0, 1, 2,
        3, 2, 1
    ]

    var position_vbo = createVBO(gl, position);
    var color_vbo = createVBO(gl, color);
    var textureCoord_vbo = createVBO(gl, textureCoord);
    var VBOList = [position_vbo, color_vbo, textureCoord_vbo];
    // attribute属性を有効にする
    // attribute属性を登録
    set_attribute(gl, VBOList, attLocation, attStride);

    // iboの作成
    var ibo = create_ibo(gl, index);

    // IBOをバインドして登録する
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    // uniformLocationの取得
    var uniLocation = new Array();
    uniLocation[0] = gl.getUniformLocation(program, 'mvpMatrix');
    uniLocation[1] = gl.getUniformLocation(program, 'texture');

    // ビュー変換行列
    mat4.lookAt(vMatrix, [0.0, 2.0, 5.0], [0, 0, 0], [0, 1, 0]);
    // プロジェクション座標変換行列
    mat4.perspective(pMatrix, 45, canvas.width/canvas.height, 0.1, 1000);
    mat4.mul(tmpMatrix, pMatrix, vMatrix);

    // 有効にするテクsチャユニットを指定
    gl.activeTexture(gl.TEXTURE0);

    texture = null;

    create_texture(gl, "src/texture.png");

    // カリングと深度テストを有効に 	
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    //gl.enable(gl.CULL_FACE);

    var render_count:number = 0;
    function render_update(timestamp: any) {
        // キャンバスの初期化
        gl.clearColor(0, 0, 0, 1);
        gl.clearDepth(1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
        // カウントをインクリメント
        render_count++;

        // ラジアンを算出
        var rad = (render_count%360) * Math.PI / 180;

         // テクスチャをバインドする
        gl.bindTexture(gl.TEXTURE_2D, texture);
        
        // uniform変数にテクスチャを登録
        gl.uniform1i(uniLocation[1], 0);
        
        // モデル2はY軸を中心に回転する
        mat4.identity(mMatrix);
        mat4.rotate(mMatrix, mMatrix, rad, [0, 1, 0]);    
        // モデル2の座標変換行列と描画
        mat4.mul(mvpMatrix, tmpMatrix, mMatrix);

        gl.uniformMatrix4fv(uniLocation[0], false, mvpMatrix);
        gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0);

        gl.flush();

        window.requestAnimationFrame(render_update);
    }

    // requestAnimationFrameの取得
    window.requestAnimationFrame(render_update);
}

function getWebGLContext(canvas: HTMLCanvasElement): WebGLRenderingContext {
    var gl: WebGLRenderingContext = null;
        
    gl = <WebGLRenderingContext>canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

    if(!gl){
        alert("cant support webgl")
    }
    return gl;
}

function initShaders(gl: WebGLRenderingContext, vs: string, fs: string): WebGLProgram {
    var v_shader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(v_shader, vs);
    gl.compileShader(v_shader);
    // TODO Errorチェック
    var f_shader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(f_shader, fs);
    gl.compileShader(f_shader);

    var program = gl.createProgram();
    gl.attachShader(program, v_shader);
    gl.attachShader(program, f_shader);
    gl.linkProgram(program);
  	if(gl.getProgramParameter(program, gl.LINK_STATUS)){
        gl.useProgram(program);
        return program;
    }else{
        alert(gl.getProgramInfoLog(program));
    }    
    return program;
}

function createVBO(gl: WebGLRenderingContext , data: Array<number>): WebGLBuffer {
    // バッファオブジェクトを作成
    var vbo = gl.createBuffer();

    // バッファをバインドする
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);

    // バッファにデータをセット
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW); 

    // バッファのバインドを無効化する
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    return vbo;
}

// VBOをバインドし登録する関数
function set_attribute(gl: WebGLRenderingContext, vbo: Array<WebGLRenderbuffer>, attL: Array<number>, attS: Array<number>){
    // 引数として受け取った配列を処理する
    for(var i in vbo){
        // バッファをバインドする
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo[i]);
        
        // attributeLocationを有効にする
        gl.enableVertexAttribArray(attL[i]);
        
        // attributeLocationを通知し登録する
        gl.vertexAttribPointer(attL[i], attS[i], gl.FLOAT, false, 0, 0);
    }
}

// IBOを作成する
function create_ibo(gl: WebGLRenderingContext, data: Array<number>): WebGLBuffer{
    // バッファの作成
    var ibo = gl.createBuffer()
    // バッファのバインド
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    // バッファにデータをセット
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(data), gl.STATIC_DRAW);
    // バッファの無効化
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    return ibo;
}

// トーラスの頂点データを作成する
function torus(row: number, column: number, irad: number, orad: number){
    var pos = new Array(), nor = new Array(),
        col = new Array(), idx = new Array();
    for(var i = 0; i <= row; i++){
        var r = Math.PI * 2 / row * i;
        var rr = Math.cos(r);
        var ry = Math.sin(r);
        for(var ii = 0; ii <= column; ii++){
            var tr = Math.PI * 2 / column * ii;
            var tx = (rr * irad + orad) * Math.cos(tr);
            var ty = ry * irad;
            var tz = (rr * irad + orad) * Math.sin(tr);
            var rx = rr * Math.cos(tr);
            var rz = rr * Math.sin(tr);
            pos.push(tx, ty, tz);
            nor.push(rx, ry, rz);
            var tc = hsva(360 / column * ii, 1, 1, 1);
            col.push(tc[0], tc[1], tc[2], tc[3]);
        }
    }
    for(i = 0; i < row; i++){
        for(ii = 0; ii < column; ii++){
            r = (column + 1) * i + ii;
            idx.push(r, r + column + 1, r + 1);
            idx.push(r + column + 1, r + column + 2, r + 1);
        }
    }
    return [pos, nor, col, idx];
}

function hsva(h:number, s:number, v:number, a:number){
    if(s > 1 || v > 1 || a > 1){return;}
    var th = h % 360;
    var i = Math.floor(th / 60);
    var f = th / 60 - i;
    var m = v * (1 - s);
    var n = v * (1 - s * f);
    var k = v * (1 - s * (1 - f));
    var color = new Array();
    if(!(s > 0) && !(s < 0)){
        color.push(v, v, v, a); 
    } else {
        var r = new Array(v, n, m, m, k, v);
        var g = new Array(k, v, v, n, m, m);
        var b = new Array(m, m, k, v, v, n);
        color.push(r[i], g[i], b[i], a);
    }
    return color;
}

function create_texture(gl: WebGLRenderingContext, source: string) {
    var img = new Image();
    img.onload = ()=> {
        // テクスチャオブジェクトを生成
        var tex = gl.createTexture();

        // テクスチャをバインドする
        gl.bindTexture(gl.TEXTURE_2D, tex);

        // テクスチャへイメージを適用
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);

        // ミップマップを生成
        gl.generateMipmap(gl.TEXTURE_2D);

        // テクスチャバインドを無効化
        gl.bindTexture(gl.TEXTURE_2D, null);

        texture = tex;
    }
    img.src = source;
}

main();
