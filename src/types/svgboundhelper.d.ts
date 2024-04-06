declare module 'svg-boundings/util/helper.js' {
    function transformToMatrix(val: string, baseMatrixOrTransform?: any): any;
    function normalizeTransform(val: string, baseMatrixOrTransform?: any): any;
    function boundingUnderTransform(matrix: any, t: any, r: any, b: any, l: any): any;
}