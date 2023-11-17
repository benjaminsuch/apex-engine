import * as THREE from 'three';

import { CLASS, getTargetId } from '../class';
import { proxy } from '../class/specifiers/proxy';
import { MeshComponent, MeshComponentProxy } from './MeshComponent';

const temp = new THREE.Vector3();

export class BoxComponentProxy extends MeshComponentProxy {
  private segmentsAround: number = 24;

  public override tick(time: number = 0) {
    const positionAttr = this.mesh.geometry.getAttribute('position');

    time *= 0.001;

    if (positionAttr) {
      for (let i = 0; i < this.positions.length; i += 3) {
        const quad = (i / 12) | 0;
        const ringId = (quad / this.segmentsAround) | 0;
        const angle = ((quad % this.segmentsAround) / this.segmentsAround) * Math.PI * 2;

        temp.fromArray(this.normals, i);
        temp.multiplyScalar(
          THREE.MathUtils.lerp(1, 1.4, Math.sin(time + ringId + angle) * 0.5 + 0.5)
        );
        temp.toArray(this.positions, i);
      }

      positionAttr.needsUpdate = true;
    }
  }

  public makeSpherePositions(segmentsAround: number, segmentsDown: number) {
    this.segmentsAround = segmentsAround;
    this.mesh.material = new THREE.MeshPhongMaterial({
      color: 0xff0000,
      side: THREE.DoubleSide,
      shininess: 100
    });

    const numVertices = segmentsAround * segmentsDown * 6;
    const numComponents = 3;
    const positions = new Float32Array(numVertices * numComponents);
    const indices: any[] = [];

    const temp = new THREE.Vector3();
    const longHelper = new THREE.Object3D();
    const latHelper = new THREE.Object3D();
    const pointHelper = new THREE.Object3D();

    longHelper.add(latHelper);
    latHelper.add(pointHelper);
    pointHelper.position.z = 1;

    function getPoint(lat: number, long: number) {
      latHelper.rotation.x = lat;
      longHelper.rotation.y = long;
      longHelper.updateMatrixWorld(true);
      return pointHelper.getWorldPosition(temp).toArray();
    }

    let posNdx = 0;
    let ndx = 0;

    for (let down = 0; down < segmentsDown; ++down) {
      const v0 = down / segmentsDown;
      const v1 = (down + 1) / segmentsDown;
      const lat0 = (v0 - 0.5) * Math.PI;
      const lat1 = (v1 - 0.5) * Math.PI;

      for (let across = 0; across < segmentsAround; ++across) {
        const u0 = across / segmentsAround;
        const u1 = (across + 1) / segmentsAround;
        const long0 = u0 * Math.PI * 2;
        const long1 = u1 * Math.PI * 2;

        positions.set(getPoint(lat0, long0), posNdx);
        posNdx += numComponents;
        positions.set(getPoint(lat1, long0), posNdx);
        posNdx += numComponents;
        positions.set(getPoint(lat0, long1), posNdx);
        posNdx += numComponents;
        positions.set(getPoint(lat1, long1), posNdx);
        posNdx += numComponents;

        indices.push(ndx, ndx + 1, ndx + 2, ndx + 2, ndx + 1, ndx + 3);
        ndx += 4;
      }
    }

    this.positions = positions;
    this.normals = positions.slice();

    const positionAttr = new THREE.BufferAttribute(positions, 3);
    positionAttr.setUsage(THREE.DynamicDrawUsage);

    this.mesh.geometry.setAttribute('position', positionAttr);
    this.mesh.geometry.setAttribute('normal', new THREE.BufferAttribute(this.normals, 3));
    this.mesh.geometry.setIndex(indices);
  }
}

@CLASS(proxy(BoxComponentProxy))
export class BoxComponent extends MeshComponent {
  public makeSpherePositions(segmentsAround: number, segmentsDown: number) {
    this.renderer.send({
      type: 'rpc',
      id: getTargetId(this),
      action: 'makeSpherePositions',
      params: [segmentsAround, segmentsDown]
    });
  }
}
