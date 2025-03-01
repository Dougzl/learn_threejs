// 判断点是否在四边形内
import {Line3, Plane, SphereGeometry, Vector3} from "three";

const isPointInParallelogram = (point: Vector3, vertices: Vector3[]) => {
    // 这里假设平行四边形的顶点顺序为 A, B, C, D，
    // 并且 A、B、D 分别是一个角的起点和其相邻的两个顶点
    const u = new Vector3().subVectors(vertices[1], vertices[0]);
    const v = new Vector3().subVectors(vertices[3], vertices[0]);
    const w = new Vector3().subVectors(point, vertices[0]);

    const uu = u.dot(u);
    const uv = u.dot(v);
    const vv = v.dot(v);
    const wu = w.dot(u);
    const wv = w.dot(v);

    const Ddenom = uu * vv - uv * uv;
    // 如果 Ddenom 很接近 0 则说明 u 和 v 共线，不构成平行四边形
    if (Math.abs(Ddenom) < 1e-6) return false;

    const s = (wu * vv - wv * uv) / Ddenom;
    const t = (wv * uu - wu * uv) / Ddenom;

    return (s >= 0 && s <= 1 && t >= 0 && t <= 1);
}

// 计算两条线段的交点
const getLineSegmentIntersection = (p1: Vector3, p2: Vector3, p3: Vector3, p4: Vector3, tolerance = 1e-6) => {
    // 计算向量
    const r = new Vector3().subVectors(p2, p1);
    const s = new Vector3().subVectors(p4, p3);
    const w0 = new Vector3().subVectors(p1, p3);

    // 计算系数
    const a = r.dot(r);
    const b = r.dot(s);
    const c = s.dot(s);
    const d = r.dot(w0);
    const e = s.dot(w0);

    const denominator = a * c - b * b;

    // 如果 denominator 接近0，则线条平行或共线
    if (Math.abs(denominator) < tolerance) {
        return null; // 无唯一交点
    }

    // 求参数 t 和 s
    const t = (b * e - c * d) / denominator;
    const sParam = (a * e - b * d) / denominator;

    // 检查参数是否在 [0,1] 内
    if (t < 0 || t > 1 || sParam < 0 || sParam > 1) {
        return null; // 线段延长线相交，但线段本身不相交
    }

    // 计算两条直线上的对应点
    const P = p1.clone().add(r.clone().multiplyScalar(t));
    const Q = p3.clone().add(s.clone().multiplyScalar(sParam));

    // 如果两点足够接近，则认为交于该点
    if (P.distanceTo(Q) > tolerance) {
        return null; // 两条直线最近点距离较大，认为没有交点
    }

    // 返回交点
    return P;
}

// ===== 图数据结构构建 =====
function connectLines(lines: Line3[], epsilon = 1e-5) {
    // 辅助函数：规范点坐标，避免浮点精度问题
    function getKey(point: Vector3) {
        return `${Math.round(point.x / epsilon)},${Math.round(point.y / epsilon)},${Math.round(point.z / epsilon)}`;
    }

    // 预处理线段，合并相近的点
    const pointMap = new Map();
    function getCanonicalPoint(point: Vector3) {
        const key = getKey(point);
        if (pointMap.has(key)) {
            return pointMap.get(key);
        }
        pointMap.set(key, point);
        return point;
    }

    // 构建规范化的线段数组
    const normalizedLines = lines.map(line => {
        const start = line.start.clone();
        const end = line.end.clone();
        const canonicalStart = getCanonicalPoint(start);
        const canonicalEnd = getCanonicalPoint(end);
        return new Line3(canonicalStart, canonicalEnd);
    });

    // 构建邻接表，记录每个点连接的线段及对应的邻接点
    const adjMap = new Map();
    for (const line of normalizedLines) {
        const start = line.start;
        const end = line.end;
        if (!adjMap.has(start)) adjMap.set(start, []);
        adjMap.get(start).push({ point: end, line });
        if (!adjMap.has(end)) adjMap.set(end, []);
        adjMap.get(end).push({ point: start, line });
    }

    const processedLines = new Set();
    const result = [];

    for (const line of normalizedLines) {
        if (processedLines.has(line)) continue;

        let currentStart = line.start;
        let currentEnd = line.end;
        const path = [currentStart, currentEnd];
        processedLines.add(line);

        // 向前扩展路径（从currentStart方向）
        let extendingForward = true;
        while (extendingForward) {
            const neighbors = adjMap.get(currentStart) || [];
            let found = false;
            for (const neighbor of neighbors) {
                if (!processedLines.has(neighbor.line)) {
                    currentStart = neighbor.point;
                    path.unshift(currentStart);
                    processedLines.add(neighbor.line);
                    found = true;
                    break;
                }
            }
            extendingForward = found;
        }

        // 向后扩展路径（从currentEnd方向）
        let extendingBackward = true;
        while (extendingBackward) {
            const neighbors = adjMap.get(currentEnd) || [];
            let found = false;
            for (const neighbor of neighbors) {
                if (!processedLines.has(neighbor.line)) {
                    currentEnd = neighbor.point;
                    path.push(currentEnd);
                    processedLines.add(neighbor.line);
                    found = true;
                    break;
                }
            }
            extendingBackward = found;
        }

        // 闭合路径检测：如果路径是闭合的，去掉重复的终点
        if (path.length > 2 && path[0].equals(path[path.length - 1])) {
            path.pop();
        }

        result.push(path);
    }

    return result;
}

export const intersect =
    (geometry: SphereGeometry, vertices: Vector3[]): Vector3[][] => {
    // 获取顶点位置和索引
    const positions = geometry.attributes.position.array; // 顶点坐标数组
    const indices = geometry.index?.array || []; // 面索引数组
    const plane = new Plane().setFromCoplanarPoints(vertices[0], vertices[1], vertices[2])

    const lines: Line3[] = []

    for (let i = 0; i < indices.length; i += 3) {
        const a = indices[i];     // 第一个顶点的索引
        const b = indices[i + 1]; // 第二个顶点的索引
        const c = indices[i + 2]; // 第三个顶点的索引

        // 获取三个顶点的坐标
        const v1 = new Vector3(positions[a * 3], positions[a * 3 + 1], positions[a * 3 + 2]);
        const v2 = new Vector3(positions[b * 3], positions[b * 3 + 1], positions[b * 3 + 2]);
        const v3 = new Vector3(positions[c * 3], positions[c * 3 + 1], positions[c * 3 + 2]);

        const l1 = new Line3(v1, v2)
        const l2 = new Line3(v1, v3)
        const l3 = new Line3(v2, v3)

        const p1 = plane.intersectLine(l1, new Vector3())
        const p2 = plane.intersectLine(l2, new Vector3())
        const p3 = plane.intersectLine(l3, new Vector3())

        let intersects: Vector3[] = []
        p1 && intersects.push(p1)
        p2 && intersects.push(p2)
        p3 && intersects.push(p3)

        // 有交点
        if (intersects.length == 2 && intersects.some(l => isPointInParallelogram(l, vertices))) {
            let line = new Line3(intersects[0], intersects[1]);
            const container = intersects.find(l => isPointInParallelogram(l, vertices))
            const unContainer = intersects.find(l => !isPointInParallelogram(l, vertices))
            if (
                container && unContainer
            ) {
                for (let i = 0; i < vertices.length; i++) {
                    const p1 = vertices[i];
                    const p2 = vertices[(i + 1) % vertices.length]; // 下一个顶点
                    const intersection = getLineSegmentIntersection(intersects[0], intersects[1], p1, p2);
                    if (intersection) {
                        line = new Line3(container, intersection)
                    }
                }
            }
            if (line.distance() > 1e-6)
                lines.push(line)
        }
    }

    return connectLines(lines)
}
