import {BufferGeometry, Float32BufferAttribute, Vector3} from "three";
import earcut from "earcut";

// 鲁棒法向量计算（避免前三点共线问题）
const computeRobustNormal = (points: Vector3[])=> {
    const centroid = new Vector3();
    points.forEach(p => centroid.add(p));
    centroid.divideScalar(points.length);

    let xx = 0, xy = 0, xz = 0, yy = 0, yz = 0, zz = 0;
    points.forEach(p => {
        const delta = p.clone().sub(centroid);
        xx += delta.x * delta.x;
        xy += delta.x * delta.y;
        xz += delta.x * delta.z;
        yy += delta.y * delta.y;
        yz += delta.y * delta.z;
        zz += delta.z * delta.z;
    });

    const detX = yy * zz - yz * yz;
    const detY = xx * zz - xz * xz;
    const detZ = xx * yy - xy * xy;

    return new Vector3(
        detX,
        detY,
        detZ
    ).normalize();
}

// 共面性检查（带容差）
const arePointsCoplanar = (points: Vector3[], epsilon = 1e-5) => {
    if (points.length < 4) return true;
    const normal = computeRobustNormal(points);
    const basePoint = points[0];
    return points.every(p => {
        const vec = p.clone().sub(basePoint);
        return Math.abs(vec.dot(normal)) < epsilon;
    });
}


// 二维投影函数（自动处理倾斜平面）
const projectTo2D = (vertices: Vector3[]) => {
    // 1. 计算平面法向量（修正核心问题）
    const normal = computeNormal(vertices[0], vertices[1], vertices[2]);

    // 2. 计算质心
    const center = new Vector3();
    vertices.forEach(v => center.add(v));
    center.divideScalar(vertices.length);

    // 3. 构建局部坐标系（修正参考轴选择）
    const basisX = new Vector3()
        .subVectors(vertices[0], center)
        .normalize();

    // 避免basisX与法向量平行
    if (Math.abs(basisX.dot(normal)) > 0.9) {
        basisX.set(1, 0, 0).cross(normal).normalize();
    }

    const basisY = new Vector3()
        .crossVectors(normal, basisX)
        .normalize();

    // 4. 投影到二维
    return vertices.map(v => {
        const relPos = v.clone().sub(center);
        return [
            relPos.dot(basisX),
            relPos.dot(basisY)
        ];
    });
}

// 计算三点法向量
const computeNormal = (a: Vector3, b: Vector3, c: Vector3) => {
    const ab = new Vector3().subVectors(b, a);
    const ac = new Vector3().subVectors(c, a);
    return ab.cross(ac).normalize();
}

export const createPlanarGeometry = (vertices: Vector3[]) => {
    // 1. 验证共面性（此处省略，参考前文实现）
    /*if (!arePointsCoplanar(vertices)) {
        console.warn("顶点不共面，无法生成平面");
        return
    }*/
    if (vertices.length < 3) {
        return new BufferGeometry().setFromPoints(vertices);
    }

    // 2. 投影到二维平面（自动处理倾斜）
    const points2D = projectTo2D(vertices);

    // 3. 一步获取三角剖分索引
    const indices = earcut(points2D.flat()); // 核心简化点

    // 4. 构建几何体
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(
        vertices.flatMap(v => [v.x, v.y, v.z]),
        3
    ));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
}
