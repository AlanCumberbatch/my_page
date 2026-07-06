/// <reference types="vite/client" />

// Cesium全局变量和命名空间声明
declare global {
  interface Window {
    CESIUM_BASE_URL?: string;
    Cesium: any;
  }
}

// Cesium命名空间声明
declare namespace Cesium {
  class Cartesian3 {
    static fromDegrees(longitude: number, latitude: number, height?: number): Cartesian3;
    static lerp(start: Cartesian3, end: Cartesian3, t: number, result?: Cartesian3): Cartesian3;
    static distance(left: Cartesian3, right: Cartesian3): number;
    static add(left: Cartesian3, right: Cartesian3, result?: Cartesian3): Cartesian3;
    static multiplyByScalar(cartesian: Cartesian3, scalar: number, result?: Cartesian3): Cartesian3;
    static UNIT_Z: Cartesian3;
    x: number;
    y: number;
    z: number;
  }

  class Color {
    static fromCssColorString(color: string): Color;
    static WHITE: Color;
    static LIGHTBLUE: Color;
    withAlpha(alpha: number): Color;
    toCssColorString(): string;
  }

  class Entity {
    id: string;
    position: any;
    point: any;
    billboard: any;
    label: any;
    description: string;
  }

  class Rectangle {
    static fromDegrees(west: number, south: number, east: number, north: number): Rectangle;
  }

  class ConstantProperty {
    constructor(value: any);
  }

  class ConstantPositionProperty {
    constructor(value: any);
  }

  namespace Math {
    function toRadians(degrees: number): number;
    function toDegrees(radians: number): number;
  }

  namespace ScreenSpaceEventType {
    const LEFT_CLICK: any;
    const MOUSE_MOVE: any;
    const LEFT_DOUBLE_CLICK: any;
  }

  namespace HeightReference {
    const CLAMP_TO_GROUND: any;
  }

  namespace VerticalOrigin {
    const BOTTOM: any;
    const CENTER: any;
  }

  namespace HorizontalOrigin {
    const CENTER: any;
  }

  namespace LabelStyle {
    const FILL_AND_OUTLINE: any;
  }

  class Cartesian2 {
    constructor(x: number, y: number);
    x: number;
    y: number;
  }

  class Cartographic {
    static fromCartesian(cartesian: Cartesian3): Cartographic;
    longitude: number;
    latitude: number;
    height: number;
  }

  class ScreenSpaceEventHandler {
    constructor(canvas: HTMLCanvasElement);
    setInputAction(action: Function, type: any): void;
    destroy(): void;
  }

  class Viewer {
    constructor(container: HTMLElement | string, options?: any);
    scene: any;
    camera: any;
    entities: any;
    imageryLayers: any;
    terrainProvider: any;
    cesiumWidget: any;
    creditDisplay: any;
    destroy(): void;
  }

  namespace SceneTransforms {
    function worldToWindowCoordinates(scene: any, position: Cartesian3): Cartesian2 | undefined;
  }

  class PolylineGlowMaterialProperty {
    constructor(options?: any);
  }

  class EllipsoidTerrainProvider {
    constructor();
  }

  function createWorldTerrainAsync(): Promise<any>;
}

export {}
