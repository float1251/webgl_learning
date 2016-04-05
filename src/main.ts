declare var mat4: any;

let VSHADER_SRC = `
attribute vec3 a_Position;
attribute vec4 a_Color;
uniform   mat4 mvpMatrix;
varying vec4 v_Color;

void main(){
    v_Color = a_Color; 
    gl_Position = mvpMatrix * vec4(a_Position, 1.0);
}`;

let FSHADER_SRC = `
precision mediump float;
varying vec4 v_Color;
void main(){
    gl_FragColor = v_Color;   
}`;

function main() {
    var canvas: HTMLCanvasElement = <HTMLCanvasElement>document.getElementById("webgl");
    if(!canvas){
        alert("No Canvas");
        return;
    }

    var gl = getWebGLContext(canvas);
    gl.clearColor(0, 0, 0, 1);
    gl.clearDepth(1.0);

    var program = initShaders(gl, VSHADER_SRC, FSHADER_SRC);

    var vertexPositionAttribute = gl.getAttribLocation(program, "a_Position");

        // キャンバスの初期化
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // attributeLocationの取得
    var attLocation = new Array(2);
    attLocation[0] = gl.getAttribLocation(program, "a_Position");
    attLocation[1] = gl.getAttribLocation(program, "a_Color");

    // attributeの要素数(この要素はxyzの3要素)
    var attStride = new Array(2);
    attStride[0] = 3;
    attStride[1] = 4;

    // 頂点データ
    var vertex_position = [
        0.0, 1.0, 0.0,
        1.0, 0.0, 0.0,
       -1.0, 0.0, 0.0 
    ];

    var vertex_color = [
        1.0, 0.0, 0.0, 1.0,
        0.0, 1.0, 0.0, 1.0,
        0.0, 0.0, 1.0, 1.0
    ]

    var position_vbo = createVBO(gl, vertex_position);
    var color_vbo = createVBO(gl, vertex_color);
    // attribute属性を有効にする
    // attribute属性を登録
    gl.bindBuffer(gl.ARRAY_BUFFER, position_vbo);
    gl.enableVertexAttribArray(attLocation[0]);
    gl.vertexAttribPointer(attLocation[0], attStride[0], gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, color_vbo);
    gl.enableVertexAttribArray(attLocation[1]);
    gl.vertexAttribPointer(attLocation[1], attStride[1], gl.FLOAT, false, 0, 0);


    // 行列変換処理
    var mMatrix = mat4.create();
    var vMatrix = mat4.create();
    var pMatrix = mat4.create();
    var tmpMatrix = mat4.create();
    var mvpMatrix = mat4.create();

    // ビュー変換行列
    mat4.lookAt(vMatrix, [0.0, 0.0, 3.0], [0, 0, 0], [0,1,0]);
    // プロジェクション座標変換行列
    mat4.perspective(pMatrix, 90, canvas.width/canvas.height, 0.1, 1000);
    mat4.mul(tmpMatrix, pMatrix, vMatrix);

    // 1つめのモデルを移動するためのモデル座標変換行列
    mat4.translate(mMatrix, mMatrix, [1.5, 0.0, 0.0]);

    // 各行列を掛けあわせ、座標変換行列を完成させる
    mat4.mul(mvpMatrix, tmpMatrix, mMatrix);

    // uniformLocationの取得
    var uniLocation = gl.getUniformLocation(program, "mvpMatrix");
    // uniformLocationへの座標変換行列を登録
    gl.uniformMatrix4fv(uniLocation, false, mvpMatrix);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    mat4.identity(mMatrix);
    mat4.translate(mMatrix, mMatrix, [-1.5, 0.0, 0.0]);

    // モデルxビューxプロジェクション
    mat4.mul(mvpMatrix, tmpMatrix, mMatrix);

    // uniformLocationへの座標変換行列を登録
    gl.uniformMatrix4fv(uniLocation, false, mvpMatrix);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // コンテキストの再描画
    gl.flush();
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
    // TODO linkチェック
    gl.useProgram(program);
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

main();
