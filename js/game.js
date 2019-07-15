class Game {
    constructor() {
        this.config = {
            background: 0x282828,
            ground: -1,
            cubeColor: 0xbebebe,
            cubeWidth: 4,
            cubeHeight: 2,
            cubeDeep: 4,
            jumperColor: 0x232323,
            jumperWidth: 1,
            jumperHeight: 2,
            jumperDeep: 1
        };
        this.score = 0;
        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer({
            antialias: true
        });
        this.size = {
            width: window.innerWidth,
            height: window.innerHeight
        };
        this.camera = new THREE.OrthographicCamera(
            window.innerWidth / -50,
            window.innerWidth / 50,
            window.innerHeight / 50,
            window.innerHeight / -50,
            0,
            5000
        );
        this.cameraPros = {
            current: new THREE.Vector3(0, 0, 0),
            next: new THREE.Vector3()
        };
        this.cubes = [];
        this.cubeStat = {
            nextDir: ""
        };
        this.falledStat = {
            location: -1,
            distance: 0
        };
        this.fallingStat = {
            end: false,
            speed: 0.2
        };
        this.jumperStat = {
            ready: false,
            xSpeed: 0,
            ySpeed: 0
        };
    }
    init() {
        this._setCamera();
        this._setRenderer();
        this._setLight();
        this._createCube();
        this._createCube();
        this._createJumper();
        this._updateCamera();
        this._handleWindowResize();
        window.addEventListener("resize", () => {
            this._handleWindowResize();
        });
        let canvas = document.querySelector("canvas");
        canvas.addEventListener("mousedown", () => {
            this._handleMouseDown();
        });
        canvas.addEventListener("mouseup", () => {
            this._handleMouseUp();
        });
    }
    _addSuccessFn(fn) {
        this.successCallback = fn;
    }
    _addFailedFn(fn) {
        this.failedCallback = fn;
    }
    _addAxisHelp() {
        let axis = new THREE.AxisHelper(20);
        this.scene.add(axis);
    }
    _handleWindowResize() {
        this._setSize();
        this.camera.left = this.size.width / -50;
        this.camera.right = this.size.width / 50;
        this.camera.top = this.size.height / 50;
        this.camera.bottom = this.size.height / -50;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.size.width, this.size.height);
        this._render();
    }
    _handleMouseDown() {
        if (!this.jumperStat.ready && this.jumper.scale.y > 0.02) {
            this.jumper.scale.y -= 0.01;
            this.jumperStat.xSpeed += 0.004;
            this.jumperStat.ySpeed += 0.008;
            this._render();
            requestAnimationFrame(() => {
                this._handleMouseDown();
            });
        }
    }
    _handleMouseUp() {
        this.jumperStat.ready = true;
        if (this.jumper.position.y >= 1) {
            if (this.jumper.scale.y < 1) {
                this.jumper.scale.y += 0.1;
            }
            if (this.cubeStat.nextDir == "left") {
                this.jumper.position.x -= this.jumperStat.xSpeed;
            } else {
                this.jumper.position.z -= this.jumperStat.xSpeed;
            }
            this.jumperStat.ySpeed -= 0.01;
            this.jumper.position.y += this.jumperStat.ySpeed;
            this._render();
            requestAnimationFrame(() => {
                this._handleMouseUp();
            })
        } else {
            this.jumperStat.ready = false;
            this.jumper.scale.y = 1;
            this.jumper.position.y = 1;
            this.jumperStat.xSpeed = 0;
            this.jumperStat.ySpeed = 0;
            this._checkInCube();
            if (this.falledStat.location == 1) {
                this.score++;
                this._createCube();
                this._updateCamera();
                if (this.successCallback) {
                    this.successCallback(this.score);
                }
            } else {
                this._falling();
            }
        }
    }
    _checkInCube() {
        let distanceCur, distanceNext;
        let should = (this.config.cubeWidth + this.config.jumperWidth) / 2;
        if (this.cubeStat.nextDir == "left") {
            distanceCur = Math.abs(
                this.cubes[this.cubes.length - 2].position.x - this.jumper.position.x
            );
            distanceNext = Math.abs(
                this.cubes[this.cubes.length - 1].position.x - this.jumper.position.x
            );
        } else {
            distanceCur = Math.abs(
                this.cubes[this.cubes.length - 2].position.z - this.jumper.position.z
            );
            distanceNext = Math.abs(
                this.cubes[this.cubes.length - 1].position.z - this.jumper.position.z
            );
        }
        if (distanceCur < should) {
            this.falledStat.location =
                distanceCur < this.config.cubeWidth / 2 ? -1 : -10;
        } else if (distanceNext < should) {
            this.falledStat.location =
                distanceNext < this.config.cubeWidth / 2 ? 1 : 10;
        } else {
            this.falledStat.location = 0;
        }
    }
    _falling() {
        if (this.falledStat.location == 10) {
            if (this.cubeStat.nextDir == "left") {
                if (
                    this.jumper.position.x > this.cubes[this.cubes.length - 1].position.x
                ) {
                    this._fallingDir("leftBottom");
                } else {
                    this._fallingDir("leftTop");
                }
            } else {
                if (
                    this.jumper.position.z > this.cubes[this.cubes.length - 1].position.z
                ) {
                    this._fallingDir("rightBottom");
                } else {
                    this._fallingDir("rightTop");
                }
            }
        } else if (this.falledStat.location == -10) {
            if (this.cubeStat.nextDir == "left") {
                this._fallingDir("leftTop");
            } else {
                this._fallingDir("rightTop");
            }
        } else if (this.falledStat.location == 0) {
            this._fallingDir("none");
        }
    }
    _fallingDir(dir) {
        let offset = this.falledStat.distance - this.config.cubeWidth / 2;
        let axis = dir.includes("left") ? "z" : "x";
        let isRotate = this.jumper.rotation[axis] < Math.PI / 2;
        let rotate = this.jumper.rotation[axis];
        let fallingTo = this.config.ground + this.config.jumperWidth / 2;
        if (dir == "leftTop") {
            rotate += 0.1;
            isRotate = this.jumper.rotation[axis] < Math.PI / 2;
        } else if (dir == "leftBottom") {
            rotate -= 0.1;
            isRotate = this.jumper.rotation[axis] > -Math.PI / 2;
        } else if (dir == "rightTop") {
            rotate -= 0.1;
            isRotate = this.jumper.rotation[axis] > -Math.PI / 2;
        } else if (dir == "rightBottom") {
            rotate += 0.1;
            isRotate = this.jumper.rotation[axis] < Math.PI / 2;
        } else if (dir == "none") {
            fallingTo = this.config.ground;
            isRotate = false;
        }
        if (!this.fallingStat.end) {
            if (isRotate) {
                this.jumper.rotation[axis] = rotate;
            } else if (this.jumper.position.y > fallingTo) {
                this.jumper.position.y -= this.fallingStat.speed;
            } else {
                this.fallingStat.end = true;
            }
            this._render();
            requestAnimationFrame(() => {
                this._falling();
            });
        } else {
            if (this.failedCallback) {
                this.failedCallback();
            }
        }
    }
    _setCamera() {
        this.camera.position.set(100, 100, 100);
        this.camera.lookAt(this.cameraPros.current);
    }
    _setRenderer() {
        this.renderer.setSize(this.size.width, this.size.height);
        this.renderer.setClearColor(this.config.background);
        document.body.appendChild(this.renderer.domElement);
    }
    _createCube() {
        let geometry = new THREE.CubeGeometry(
            this.config.cubeWidth,
            this.config.cubeHeight,
            this.config.cubeDeep
        );
        let material = new THREE.MeshLambertMaterial({
            color: this.config.cubeColor
        });
        let cube = new THREE.Mesh(geometry, material);
        if (this.cubes.length) {
            this.cubeStat.nextDir = Math.random() > 0.5 ? "left" : "right";
            cube.position.x = this.cubes[this.cubes.length - 1].position.x;
            cube.position.y = this.cubes[this.cubes.length - 1].position.y;
            cube.position.z = this.cubes[this.cubes.length - 1].position.z;
            if (this.cubeStat.nextDir == "left") {
                cube.position.x -= Math.random() * 4 + 6;
            } else {
                cube.position.z -= Math.random() * 4 + 6;
            }
        }
        this.cubes.push(cube);
        if (this.cubes.length > 6) {
            this.scene.remove(this.cubes.shift());
        }
        this.scene.add(cube);
        if (this.cubes.length > 1) {
            this._updateCameraPros();
        }
    }
    _createJumper() {
        let geometry = new THREE.CubeGeometry(
            this.config.jumperWidth,
            this.config.jumperHeight,
            this.config.jumperDeep
        );
        let material = new THREE.MeshLambertMaterial({
            color: this.config.jumperColor
        });
        this.jumper = new THREE.Mesh(geometry, material);
        geometry.translate(0, 1, 0);
        this.jumper.position.y = 1;
        this.scene.add(this.jumper);
    }
    _updateCameraPros() {
        let lastIndex = this.cubes.length - 1;
        let pointA = {
            x: this.cubes[lastIndex - 1].position.x,
            z: this.cubes[lastIndex - 1].position.z
        };
        let pointB = {
            x: this.cubes[lastIndex].position.x,
            z: this.cubes[lastIndex].position.z
        };
        this.cameraPros.next = new THREE.Vector3(
            (pointA.x + pointB.x) / 2,
            0,
            (pointA.z + pointB.z) / 2
        );
    };
    _updateCamera() {
        if (
            this.cameraPros.current.x > this.cameraPros.next.x ||
            this.cameraPros.current.z > this.cameraPros.next.z
        ) {
            if (this.cubeStat.nextDir == "left") {
                this.cameraPros.current.x -= 0.1;
            } else {
                this.cameraPros.current.z -= 0.1;
            }
            if (this.cameraPros.current.x - this.cameraPros.next.x < 0.05) {
                this.cameraPros.current.x = this.cameraPros.next.x;
            } else if (this.cameraPros.current.z - this.cameraPros.next.z < 0.05) {
                this.cameraPros.current.z = this.cameraPros.next.z;
            }
        }
        this.camera.lookAt(this.cameraPros.current);
        this._render();
        requestAnimationFrame(() => {
            this._updateCamera();
        });
    }
    _setLight() {
        let directionalLight = new THREE.DirectionalLight(0xffffff, 1.1);
        directionalLight.position.set(3, 10, 5);
        this.scene.add(directionalLight);
        let light = new THREE.AmbientLight(0xffffff, 0.3);
        this.scene.add(light);
    }
    _render() {
        this.renderer.render(this.scene, this.camera);
    }
    _setSize() {
        this.size = {
            width: window.innerWidth,
            height: window.innerHeight
        };
    }
    _restart() {
        this.score = 0;
        this.falledStat = {
            location: -1,
            distance: 0
        };
        this.fallingStat = {
            end: false,
            speed: 0.2
        };
        this.cameraPros = {
            current: new THREE.Vector3(0, 0, 0),
            next: new THREE.Vector3(0, 0, 0)
        };
        this.scene.remove(this.jumper);
        this.cubes.forEach(item => this.scene.remove(item));
        this.cubes = [];
        this._createCube();
        this._createCube();
        this._createJumper();
        this._updateCamera();
    }
}