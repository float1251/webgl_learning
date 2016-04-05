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

    var gl: WebGLRenderingContext;
    // 行列変換処理
    var mMatrix = mat4.create();
    var vMatrix = mat4.create();
    var pMatrix = mat4.create();
    var tmpMatrix = mat4.create();
    var mvpMatrix = mat4.create();

    gl = getWebGLContext(canvas);
    
    var program = initShaders(gl, VSHADER_SRC, FSHADER_SRC);

    var vertexPositionAttribute = gl.getAttribLocation(program, "a_Position");

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
       -1.0, 0.0, 0.0,
        0.0, -1.0, 0.0
    ];

    var vertex_color = [
        1.0, 0.0, 0.0, 1.0,
        0.0, 1.0, 0.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        1.0, 1.0, 1.0, 1.0
    ]

    var index = [
        0, 1, 2,
        1, 2, 3
    ]

    var position_vbo = createVBO(gl, vertex_position);
    var color_vbo = createVBO(gl, vertex_color);
    // attribute属性を有効にする
    // attribute属性を登録
    set_attribute(gl, [position_vbo, color_vbo], attLocation, attStride);

    // iboの作成
    var ibo = create_ibo(gl, index);

    // IBOをバインドして登録する
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    // uniformLocationの取得
    var uniLocation = gl.getUniformLocation(program, 'mvpMatrix');

    // ビュー変換行列
    mat4.lookAt(vMatrix, [0.0, 0.0, 3.0], [0, 0, 0], [0,1,0]);
    // プロジェクション座標変換行列
    mat4.perspective(pMatrix, 90, canvas.width/canvas.height, 0.1, 1000);
    mat4.mul(tmpMatrix, pMatrix, vMatrix);

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
        
        // モデル1は円の動きを描き、移動する
        var x = Math.cos(rad);
        var y = Math.sin(rad);
        mat4.identity(mMatrix);
        mat4.translate(mMatrix, mMatrix, [x, y+1.0, 0.0]);
    
        // モデル1の座標変換行列と、レンダリング
        // モデルxビューxプロジェクション
        mat4.mul(mvpMatrix, tmpMatrix, mMatrix);
        gl.uniformMatrix4fv(uniLocation, false, mvpMatrix);
        gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0);

        // モデル2はY軸を中心に回転する
        mat4.identity(mMatrix);
        mat4.translate(mMatrix, mMatrix, [1.0, -1.0, 0.0]);
        mat4.rotateY(mMatrix, mMatrix, rad);    

        // モデル2の座標変換行列と描画
        mat4.mul(mvpMatrix, tmpMatrix, mMatrix);
        gl.uniformMatrix4fv(uniLocation, false, mvpMatrix);
        gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0);

        // モデル3は拡大縮小する
        var s = Math.sin(rad) + 1.0;
        mat4.identity(mMatrix);
        mat4.translate(mMatrix, mMatrix, [-1.0, -1.0, 0.0]);
        mat4.scale(mMatrix, mMatrix, [s, s, s]);
        
        // モデル3の座標変換行列と描画
        mat4.mul(mvpMatrix, tmpMatrix, mMatrix);
        gl.uniformMatrix4fv(uniLocation, false, mvpMatrix);
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
main();
