var AllmapsTransform = (() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // node_modules/ml-matrix/matrix.js
  var require_matrix = __commonJS({
    "node_modules/ml-matrix/matrix.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      var toString = Object.prototype.toString;
      function isAnyArray(value) {
        const tag = toString.call(value);
        return tag.endsWith("Array]") && !tag.includes("Big");
      }
      function max(input, options = {}) {
        if (!isAnyArray(input)) {
          throw new TypeError("input must be an array");
        }
        if (input.length === 0) {
          throw new TypeError("input must not be empty");
        }
        const { fromIndex = 0, toIndex = input.length } = options;
        if (fromIndex < 0 || fromIndex >= input.length || !Number.isInteger(fromIndex)) {
          throw new Error("fromIndex must be a positive integer smaller than length");
        }
        if (toIndex <= fromIndex || toIndex > input.length || !Number.isInteger(toIndex)) {
          throw new Error("toIndex must be an integer greater than fromIndex and at most equal to length");
        }
        let maxValue = input[fromIndex];
        for (let i = fromIndex + 1; i < toIndex; i++) {
          if (input[i] > maxValue)
            maxValue = input[i];
        }
        return maxValue;
      }
      function min(input, options = {}) {
        if (!isAnyArray(input)) {
          throw new TypeError("input must be an array");
        }
        if (input.length === 0) {
          throw new TypeError("input must not be empty");
        }
        const { fromIndex = 0, toIndex = input.length } = options;
        if (fromIndex < 0 || fromIndex >= input.length || !Number.isInteger(fromIndex)) {
          throw new Error("fromIndex must be a positive integer smaller than length");
        }
        if (toIndex <= fromIndex || toIndex > input.length || !Number.isInteger(toIndex)) {
          throw new Error("toIndex must be an integer greater than fromIndex and at most equal to length");
        }
        let minValue = input[fromIndex];
        for (let i = fromIndex + 1; i < toIndex; i++) {
          if (input[i] < minValue)
            minValue = input[i];
        }
        return minValue;
      }
      function rescale(input, options = {}) {
        if (!isAnyArray(input)) {
          throw new TypeError("input must be an array");
        } else if (input.length === 0) {
          throw new TypeError("input must not be empty");
        }
        let output;
        if (options.output !== void 0) {
          if (!isAnyArray(options.output)) {
            throw new TypeError("output option must be an array if specified");
          }
          output = options.output;
        } else {
          output = new Array(input.length);
        }
        const currentMin = min(input);
        const currentMax = max(input);
        if (currentMin === currentMax) {
          throw new RangeError("minimum and maximum input values are equal. Cannot rescale a constant array");
        }
        const { min: minValue = options.autoMinMax ? currentMin : 0, max: maxValue = options.autoMinMax ? currentMax : 1 } = options;
        if (minValue >= maxValue) {
          throw new RangeError("min option must be smaller than max option");
        }
        const factor = (maxValue - minValue) / (currentMax - currentMin);
        for (let i = 0; i < input.length; i++) {
          output[i] = (input[i] - currentMin) * factor + minValue;
        }
        return output;
      }
      var indent = " ".repeat(2);
      var indentData = " ".repeat(4);
      function inspectMatrix() {
        return inspectMatrixWithOptions(this);
      }
      function inspectMatrixWithOptions(matrix2, options = {}) {
        const {
          maxRows = 15,
          maxColumns = 10,
          maxNumSize = 8,
          padMinus = "auto"
        } = options;
        return `${matrix2.constructor.name} {
${indent}[
${indentData}${inspectData(matrix2, maxRows, maxColumns, maxNumSize, padMinus)}
${indent}]
${indent}rows: ${matrix2.rows}
${indent}columns: ${matrix2.columns}
}`;
      }
      function inspectData(matrix2, maxRows, maxColumns, maxNumSize, padMinus) {
        const { rows, columns } = matrix2;
        const maxI = Math.min(rows, maxRows);
        const maxJ = Math.min(columns, maxColumns);
        const result = [];
        if (padMinus === "auto") {
          padMinus = false;
          loop: for (let i = 0; i < maxI; i++) {
            for (let j = 0; j < maxJ; j++) {
              if (matrix2.get(i, j) < 0) {
                padMinus = true;
                break loop;
              }
            }
          }
        }
        for (let i = 0; i < maxI; i++) {
          let line = [];
          for (let j = 0; j < maxJ; j++) {
            line.push(formatNumber(matrix2.get(i, j), maxNumSize, padMinus));
          }
          result.push(`${line.join(" ")}`);
        }
        if (maxJ !== columns) {
          result[result.length - 1] += ` ... ${columns - maxColumns} more columns`;
        }
        if (maxI !== rows) {
          result.push(`... ${rows - maxRows} more rows`);
        }
        return result.join(`
${indentData}`);
      }
      function formatNumber(num, maxNumSize, padMinus) {
        return (num >= 0 && padMinus ? ` ${formatNumber2(num, maxNumSize - 1)}` : formatNumber2(num, maxNumSize)).padEnd(maxNumSize);
      }
      function formatNumber2(num, len) {
        let str = num.toString();
        if (str.length <= len) return str;
        let fix = num.toFixed(len);
        if (fix.length > len) {
          fix = num.toFixed(Math.max(0, len - (fix.length - len)));
        }
        if (fix.length <= len && !fix.startsWith("0.000") && !fix.startsWith("-0.000")) {
          return fix;
        }
        let exp = num.toExponential(len);
        if (exp.length > len) {
          exp = num.toExponential(Math.max(0, len - (exp.length - len)));
        }
        return exp.slice(0);
      }
      function installMathOperations(AbstractMatrix3, Matrix3) {
        AbstractMatrix3.prototype.add = function add(value) {
          if (typeof value === "number") return this.addS(value);
          return this.addM(value);
        };
        AbstractMatrix3.prototype.addS = function addS(value) {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, this.get(i, j) + value);
            }
          }
          return this;
        };
        AbstractMatrix3.prototype.addM = function addM(matrix2) {
          matrix2 = Matrix3.checkMatrix(matrix2);
          if (this.rows !== matrix2.rows || this.columns !== matrix2.columns) {
            throw new RangeError("Matrices dimensions must be equal");
          }
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, this.get(i, j) + matrix2.get(i, j));
            }
          }
          return this;
        };
        AbstractMatrix3.add = function add(matrix2, value) {
          const newMatrix = new Matrix3(matrix2);
          return newMatrix.add(value);
        };
        AbstractMatrix3.prototype.sub = function sub(value) {
          if (typeof value === "number") return this.subS(value);
          return this.subM(value);
        };
        AbstractMatrix3.prototype.subS = function subS(value) {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, this.get(i, j) - value);
            }
          }
          return this;
        };
        AbstractMatrix3.prototype.subM = function subM(matrix2) {
          matrix2 = Matrix3.checkMatrix(matrix2);
          if (this.rows !== matrix2.rows || this.columns !== matrix2.columns) {
            throw new RangeError("Matrices dimensions must be equal");
          }
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, this.get(i, j) - matrix2.get(i, j));
            }
          }
          return this;
        };
        AbstractMatrix3.sub = function sub(matrix2, value) {
          const newMatrix = new Matrix3(matrix2);
          return newMatrix.sub(value);
        };
        AbstractMatrix3.prototype.subtract = AbstractMatrix3.prototype.sub;
        AbstractMatrix3.prototype.subtractS = AbstractMatrix3.prototype.subS;
        AbstractMatrix3.prototype.subtractM = AbstractMatrix3.prototype.subM;
        AbstractMatrix3.subtract = AbstractMatrix3.sub;
        AbstractMatrix3.prototype.mul = function mul(value) {
          if (typeof value === "number") return this.mulS(value);
          return this.mulM(value);
        };
        AbstractMatrix3.prototype.mulS = function mulS(value) {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, this.get(i, j) * value);
            }
          }
          return this;
        };
        AbstractMatrix3.prototype.mulM = function mulM(matrix2) {
          matrix2 = Matrix3.checkMatrix(matrix2);
          if (this.rows !== matrix2.rows || this.columns !== matrix2.columns) {
            throw new RangeError("Matrices dimensions must be equal");
          }
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, this.get(i, j) * matrix2.get(i, j));
            }
          }
          return this;
        };
        AbstractMatrix3.mul = function mul(matrix2, value) {
          const newMatrix = new Matrix3(matrix2);
          return newMatrix.mul(value);
        };
        AbstractMatrix3.prototype.multiply = AbstractMatrix3.prototype.mul;
        AbstractMatrix3.prototype.multiplyS = AbstractMatrix3.prototype.mulS;
        AbstractMatrix3.prototype.multiplyM = AbstractMatrix3.prototype.mulM;
        AbstractMatrix3.multiply = AbstractMatrix3.mul;
        AbstractMatrix3.prototype.div = function div(value) {
          if (typeof value === "number") return this.divS(value);
          return this.divM(value);
        };
        AbstractMatrix3.prototype.divS = function divS(value) {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, this.get(i, j) / value);
            }
          }
          return this;
        };
        AbstractMatrix3.prototype.divM = function divM(matrix2) {
          matrix2 = Matrix3.checkMatrix(matrix2);
          if (this.rows !== matrix2.rows || this.columns !== matrix2.columns) {
            throw new RangeError("Matrices dimensions must be equal");
          }
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, this.get(i, j) / matrix2.get(i, j));
            }
          }
          return this;
        };
        AbstractMatrix3.div = function div(matrix2, value) {
          const newMatrix = new Matrix3(matrix2);
          return newMatrix.div(value);
        };
        AbstractMatrix3.prototype.divide = AbstractMatrix3.prototype.div;
        AbstractMatrix3.prototype.divideS = AbstractMatrix3.prototype.divS;
        AbstractMatrix3.prototype.divideM = AbstractMatrix3.prototype.divM;
        AbstractMatrix3.divide = AbstractMatrix3.div;
        AbstractMatrix3.prototype.mod = function mod(value) {
          if (typeof value === "number") return this.modS(value);
          return this.modM(value);
        };
        AbstractMatrix3.prototype.modS = function modS(value) {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, this.get(i, j) % value);
            }
          }
          return this;
        };
        AbstractMatrix3.prototype.modM = function modM(matrix2) {
          matrix2 = Matrix3.checkMatrix(matrix2);
          if (this.rows !== matrix2.rows || this.columns !== matrix2.columns) {
            throw new RangeError("Matrices dimensions must be equal");
          }
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, this.get(i, j) % matrix2.get(i, j));
            }
          }
          return this;
        };
        AbstractMatrix3.mod = function mod(matrix2, value) {
          const newMatrix = new Matrix3(matrix2);
          return newMatrix.mod(value);
        };
        AbstractMatrix3.prototype.modulus = AbstractMatrix3.prototype.mod;
        AbstractMatrix3.prototype.modulusS = AbstractMatrix3.prototype.modS;
        AbstractMatrix3.prototype.modulusM = AbstractMatrix3.prototype.modM;
        AbstractMatrix3.modulus = AbstractMatrix3.mod;
        AbstractMatrix3.prototype.and = function and(value) {
          if (typeof value === "number") return this.andS(value);
          return this.andM(value);
        };
        AbstractMatrix3.prototype.andS = function andS(value) {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, this.get(i, j) & value);
            }
          }
          return this;
        };
        AbstractMatrix3.prototype.andM = function andM(matrix2) {
          matrix2 = Matrix3.checkMatrix(matrix2);
          if (this.rows !== matrix2.rows || this.columns !== matrix2.columns) {
            throw new RangeError("Matrices dimensions must be equal");
          }
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, this.get(i, j) & matrix2.get(i, j));
            }
          }
          return this;
        };
        AbstractMatrix3.and = function and(matrix2, value) {
          const newMatrix = new Matrix3(matrix2);
          return newMatrix.and(value);
        };
        AbstractMatrix3.prototype.or = function or(value) {
          if (typeof value === "number") return this.orS(value);
          return this.orM(value);
        };
        AbstractMatrix3.prototype.orS = function orS(value) {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, this.get(i, j) | value);
            }
          }
          return this;
        };
        AbstractMatrix3.prototype.orM = function orM(matrix2) {
          matrix2 = Matrix3.checkMatrix(matrix2);
          if (this.rows !== matrix2.rows || this.columns !== matrix2.columns) {
            throw new RangeError("Matrices dimensions must be equal");
          }
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, this.get(i, j) | matrix2.get(i, j));
            }
          }
          return this;
        };
        AbstractMatrix3.or = function or(matrix2, value) {
          const newMatrix = new Matrix3(matrix2);
          return newMatrix.or(value);
        };
        AbstractMatrix3.prototype.xor = function xor(value) {
          if (typeof value === "number") return this.xorS(value);
          return this.xorM(value);
        };
        AbstractMatrix3.prototype.xorS = function xorS(value) {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, this.get(i, j) ^ value);
            }
          }
          return this;
        };
        AbstractMatrix3.prototype.xorM = function xorM(matrix2) {
          matrix2 = Matrix3.checkMatrix(matrix2);
          if (this.rows !== matrix2.rows || this.columns !== matrix2.columns) {
            throw new RangeError("Matrices dimensions must be equal");
          }
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, this.get(i, j) ^ matrix2.get(i, j));
            }
          }
          return this;
        };
        AbstractMatrix3.xor = function xor(matrix2, value) {
          const newMatrix = new Matrix3(matrix2);
          return newMatrix.xor(value);
        };
        AbstractMatrix3.prototype.leftShift = function leftShift(value) {
          if (typeof value === "number") return this.leftShiftS(value);
          return this.leftShiftM(value);
        };
        AbstractMatrix3.prototype.leftShiftS = function leftShiftS(value) {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, this.get(i, j) << value);
            }
          }
          return this;
        };
        AbstractMatrix3.prototype.leftShiftM = function leftShiftM(matrix2) {
          matrix2 = Matrix3.checkMatrix(matrix2);
          if (this.rows !== matrix2.rows || this.columns !== matrix2.columns) {
            throw new RangeError("Matrices dimensions must be equal");
          }
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, this.get(i, j) << matrix2.get(i, j));
            }
          }
          return this;
        };
        AbstractMatrix3.leftShift = function leftShift(matrix2, value) {
          const newMatrix = new Matrix3(matrix2);
          return newMatrix.leftShift(value);
        };
        AbstractMatrix3.prototype.signPropagatingRightShift = function signPropagatingRightShift(value) {
          if (typeof value === "number") return this.signPropagatingRightShiftS(value);
          return this.signPropagatingRightShiftM(value);
        };
        AbstractMatrix3.prototype.signPropagatingRightShiftS = function signPropagatingRightShiftS(value) {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, this.get(i, j) >> value);
            }
          }
          return this;
        };
        AbstractMatrix3.prototype.signPropagatingRightShiftM = function signPropagatingRightShiftM(matrix2) {
          matrix2 = Matrix3.checkMatrix(matrix2);
          if (this.rows !== matrix2.rows || this.columns !== matrix2.columns) {
            throw new RangeError("Matrices dimensions must be equal");
          }
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, this.get(i, j) >> matrix2.get(i, j));
            }
          }
          return this;
        };
        AbstractMatrix3.signPropagatingRightShift = function signPropagatingRightShift(matrix2, value) {
          const newMatrix = new Matrix3(matrix2);
          return newMatrix.signPropagatingRightShift(value);
        };
        AbstractMatrix3.prototype.rightShift = function rightShift(value) {
          if (typeof value === "number") return this.rightShiftS(value);
          return this.rightShiftM(value);
        };
        AbstractMatrix3.prototype.rightShiftS = function rightShiftS(value) {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, this.get(i, j) >>> value);
            }
          }
          return this;
        };
        AbstractMatrix3.prototype.rightShiftM = function rightShiftM(matrix2) {
          matrix2 = Matrix3.checkMatrix(matrix2);
          if (this.rows !== matrix2.rows || this.columns !== matrix2.columns) {
            throw new RangeError("Matrices dimensions must be equal");
          }
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, this.get(i, j) >>> matrix2.get(i, j));
            }
          }
          return this;
        };
        AbstractMatrix3.rightShift = function rightShift(matrix2, value) {
          const newMatrix = new Matrix3(matrix2);
          return newMatrix.rightShift(value);
        };
        AbstractMatrix3.prototype.zeroFillRightShift = AbstractMatrix3.prototype.rightShift;
        AbstractMatrix3.prototype.zeroFillRightShiftS = AbstractMatrix3.prototype.rightShiftS;
        AbstractMatrix3.prototype.zeroFillRightShiftM = AbstractMatrix3.prototype.rightShiftM;
        AbstractMatrix3.zeroFillRightShift = AbstractMatrix3.rightShift;
        AbstractMatrix3.prototype.not = function not() {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, ~this.get(i, j));
            }
          }
          return this;
        };
        AbstractMatrix3.not = function not(matrix2) {
          const newMatrix = new Matrix3(matrix2);
          return newMatrix.not();
        };
        AbstractMatrix3.prototype.abs = function abs() {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, Math.abs(this.get(i, j)));
            }
          }
          return this;
        };
        AbstractMatrix3.abs = function abs(matrix2) {
          const newMatrix = new Matrix3(matrix2);
          return newMatrix.abs();
        };
        AbstractMatrix3.prototype.acos = function acos() {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, Math.acos(this.get(i, j)));
            }
          }
          return this;
        };
        AbstractMatrix3.acos = function acos(matrix2) {
          const newMatrix = new Matrix3(matrix2);
          return newMatrix.acos();
        };
        AbstractMatrix3.prototype.acosh = function acosh() {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, Math.acosh(this.get(i, j)));
            }
          }
          return this;
        };
        AbstractMatrix3.acosh = function acosh(matrix2) {
          const newMatrix = new Matrix3(matrix2);
          return newMatrix.acosh();
        };
        AbstractMatrix3.prototype.asin = function asin() {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, Math.asin(this.get(i, j)));
            }
          }
          return this;
        };
        AbstractMatrix3.asin = function asin(matrix2) {
          const newMatrix = new Matrix3(matrix2);
          return newMatrix.asin();
        };
        AbstractMatrix3.prototype.asinh = function asinh() {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, Math.asinh(this.get(i, j)));
            }
          }
          return this;
        };
        AbstractMatrix3.asinh = function asinh(matrix2) {
          const newMatrix = new Matrix3(matrix2);
          return newMatrix.asinh();
        };
        AbstractMatrix3.prototype.atan = function atan() {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, Math.atan(this.get(i, j)));
            }
          }
          return this;
        };
        AbstractMatrix3.atan = function atan(matrix2) {
          const newMatrix = new Matrix3(matrix2);
          return newMatrix.atan();
        };
        AbstractMatrix3.prototype.atanh = function atanh() {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, Math.atanh(this.get(i, j)));
            }
          }
          return this;
        };
        AbstractMatrix3.atanh = function atanh(matrix2) {
          const newMatrix = new Matrix3(matrix2);
          return newMatrix.atanh();
        };
        AbstractMatrix3.prototype.cbrt = function cbrt() {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, Math.cbrt(this.get(i, j)));
            }
          }
          return this;
        };
        AbstractMatrix3.cbrt = function cbrt(matrix2) {
          const newMatrix = new Matrix3(matrix2);
          return newMatrix.cbrt();
        };
        AbstractMatrix3.prototype.ceil = function ceil() {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, Math.ceil(this.get(i, j)));
            }
          }
          return this;
        };
        AbstractMatrix3.ceil = function ceil(matrix2) {
          const newMatrix = new Matrix3(matrix2);
          return newMatrix.ceil();
        };
        AbstractMatrix3.prototype.clz32 = function clz32() {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, Math.clz32(this.get(i, j)));
            }
          }
          return this;
        };
        AbstractMatrix3.clz32 = function clz32(matrix2) {
          const newMatrix = new Matrix3(matrix2);
          return newMatrix.clz32();
        };
        AbstractMatrix3.prototype.cos = function cos() {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, Math.cos(this.get(i, j)));
            }
          }
          return this;
        };
        AbstractMatrix3.cos = function cos(matrix2) {
          const newMatrix = new Matrix3(matrix2);
          return newMatrix.cos();
        };
        AbstractMatrix3.prototype.cosh = function cosh() {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, Math.cosh(this.get(i, j)));
            }
          }
          return this;
        };
        AbstractMatrix3.cosh = function cosh(matrix2) {
          const newMatrix = new Matrix3(matrix2);
          return newMatrix.cosh();
        };
        AbstractMatrix3.prototype.exp = function exp() {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, Math.exp(this.get(i, j)));
            }
          }
          return this;
        };
        AbstractMatrix3.exp = function exp(matrix2) {
          const newMatrix = new Matrix3(matrix2);
          return newMatrix.exp();
        };
        AbstractMatrix3.prototype.expm1 = function expm1() {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, Math.expm1(this.get(i, j)));
            }
          }
          return this;
        };
        AbstractMatrix3.expm1 = function expm1(matrix2) {
          const newMatrix = new Matrix3(matrix2);
          return newMatrix.expm1();
        };
        AbstractMatrix3.prototype.floor = function floor() {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, Math.floor(this.get(i, j)));
            }
          }
          return this;
        };
        AbstractMatrix3.floor = function floor(matrix2) {
          const newMatrix = new Matrix3(matrix2);
          return newMatrix.floor();
        };
        AbstractMatrix3.prototype.fround = function fround() {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, Math.fround(this.get(i, j)));
            }
          }
          return this;
        };
        AbstractMatrix3.fround = function fround(matrix2) {
          const newMatrix = new Matrix3(matrix2);
          return newMatrix.fround();
        };
        AbstractMatrix3.prototype.log = function log() {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, Math.log(this.get(i, j)));
            }
          }
          return this;
        };
        AbstractMatrix3.log = function log(matrix2) {
          const newMatrix = new Matrix3(matrix2);
          return newMatrix.log();
        };
        AbstractMatrix3.prototype.log1p = function log1p() {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, Math.log1p(this.get(i, j)));
            }
          }
          return this;
        };
        AbstractMatrix3.log1p = function log1p(matrix2) {
          const newMatrix = new Matrix3(matrix2);
          return newMatrix.log1p();
        };
        AbstractMatrix3.prototype.log10 = function log10() {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, Math.log10(this.get(i, j)));
            }
          }
          return this;
        };
        AbstractMatrix3.log10 = function log10(matrix2) {
          const newMatrix = new Matrix3(matrix2);
          return newMatrix.log10();
        };
        AbstractMatrix3.prototype.log2 = function log2() {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, Math.log2(this.get(i, j)));
            }
          }
          return this;
        };
        AbstractMatrix3.log2 = function log2(matrix2) {
          const newMatrix = new Matrix3(matrix2);
          return newMatrix.log2();
        };
        AbstractMatrix3.prototype.round = function round() {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, Math.round(this.get(i, j)));
            }
          }
          return this;
        };
        AbstractMatrix3.round = function round(matrix2) {
          const newMatrix = new Matrix3(matrix2);
          return newMatrix.round();
        };
        AbstractMatrix3.prototype.sign = function sign() {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, Math.sign(this.get(i, j)));
            }
          }
          return this;
        };
        AbstractMatrix3.sign = function sign(matrix2) {
          const newMatrix = new Matrix3(matrix2);
          return newMatrix.sign();
        };
        AbstractMatrix3.prototype.sin = function sin() {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, Math.sin(this.get(i, j)));
            }
          }
          return this;
        };
        AbstractMatrix3.sin = function sin(matrix2) {
          const newMatrix = new Matrix3(matrix2);
          return newMatrix.sin();
        };
        AbstractMatrix3.prototype.sinh = function sinh() {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, Math.sinh(this.get(i, j)));
            }
          }
          return this;
        };
        AbstractMatrix3.sinh = function sinh(matrix2) {
          const newMatrix = new Matrix3(matrix2);
          return newMatrix.sinh();
        };
        AbstractMatrix3.prototype.sqrt = function sqrt() {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, Math.sqrt(this.get(i, j)));
            }
          }
          return this;
        };
        AbstractMatrix3.sqrt = function sqrt(matrix2) {
          const newMatrix = new Matrix3(matrix2);
          return newMatrix.sqrt();
        };
        AbstractMatrix3.prototype.tan = function tan() {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, Math.tan(this.get(i, j)));
            }
          }
          return this;
        };
        AbstractMatrix3.tan = function tan(matrix2) {
          const newMatrix = new Matrix3(matrix2);
          return newMatrix.tan();
        };
        AbstractMatrix3.prototype.tanh = function tanh() {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, Math.tanh(this.get(i, j)));
            }
          }
          return this;
        };
        AbstractMatrix3.tanh = function tanh(matrix2) {
          const newMatrix = new Matrix3(matrix2);
          return newMatrix.tanh();
        };
        AbstractMatrix3.prototype.trunc = function trunc() {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, Math.trunc(this.get(i, j)));
            }
          }
          return this;
        };
        AbstractMatrix3.trunc = function trunc(matrix2) {
          const newMatrix = new Matrix3(matrix2);
          return newMatrix.trunc();
        };
        AbstractMatrix3.pow = function pow(matrix2, arg0) {
          const newMatrix = new Matrix3(matrix2);
          return newMatrix.pow(arg0);
        };
        AbstractMatrix3.prototype.pow = function pow(value) {
          if (typeof value === "number") return this.powS(value);
          return this.powM(value);
        };
        AbstractMatrix3.prototype.powS = function powS(value) {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, this.get(i, j) ** value);
            }
          }
          return this;
        };
        AbstractMatrix3.prototype.powM = function powM(matrix2) {
          matrix2 = Matrix3.checkMatrix(matrix2);
          if (this.rows !== matrix2.rows || this.columns !== matrix2.columns) {
            throw new RangeError("Matrices dimensions must be equal");
          }
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, this.get(i, j) ** matrix2.get(i, j));
            }
          }
          return this;
        };
      }
      function checkRowIndex(matrix2, index, outer) {
        let max2 = outer ? matrix2.rows : matrix2.rows - 1;
        if (index < 0 || index > max2) {
          throw new RangeError("Row index out of range");
        }
      }
      function checkColumnIndex(matrix2, index, outer) {
        let max2 = outer ? matrix2.columns : matrix2.columns - 1;
        if (index < 0 || index > max2) {
          throw new RangeError("Column index out of range");
        }
      }
      function checkRowVector(matrix2, vector) {
        if (vector.to1DArray) {
          vector = vector.to1DArray();
        }
        if (vector.length !== matrix2.columns) {
          throw new RangeError(
            "vector size must be the same as the number of columns"
          );
        }
        return vector;
      }
      function checkColumnVector(matrix2, vector) {
        if (vector.to1DArray) {
          vector = vector.to1DArray();
        }
        if (vector.length !== matrix2.rows) {
          throw new RangeError("vector size must be the same as the number of rows");
        }
        return vector;
      }
      function checkRowIndices(matrix2, rowIndices) {
        if (!isAnyArray(rowIndices)) {
          throw new TypeError("row indices must be an array");
        }
        for (let i = 0; i < rowIndices.length; i++) {
          if (rowIndices[i] < 0 || rowIndices[i] >= matrix2.rows) {
            throw new RangeError("row indices are out of range");
          }
        }
      }
      function checkColumnIndices(matrix2, columnIndices) {
        if (!isAnyArray(columnIndices)) {
          throw new TypeError("column indices must be an array");
        }
        for (let i = 0; i < columnIndices.length; i++) {
          if (columnIndices[i] < 0 || columnIndices[i] >= matrix2.columns) {
            throw new RangeError("column indices are out of range");
          }
        }
      }
      function checkRange(matrix2, startRow, endRow, startColumn, endColumn) {
        if (arguments.length !== 5) {
          throw new RangeError("expected 4 arguments");
        }
        checkNumber("startRow", startRow);
        checkNumber("endRow", endRow);
        checkNumber("startColumn", startColumn);
        checkNumber("endColumn", endColumn);
        if (startRow > endRow || startColumn > endColumn || startRow < 0 || startRow >= matrix2.rows || endRow < 0 || endRow >= matrix2.rows || startColumn < 0 || startColumn >= matrix2.columns || endColumn < 0 || endColumn >= matrix2.columns) {
          throw new RangeError("Submatrix indices are out of range");
        }
      }
      function newArray(length, value = 0) {
        let array = [];
        for (let i = 0; i < length; i++) {
          array.push(value);
        }
        return array;
      }
      function checkNumber(name, value) {
        if (typeof value !== "number") {
          throw new TypeError(`${name} must be a number`);
        }
      }
      function checkNonEmpty(matrix2) {
        if (matrix2.isEmpty()) {
          throw new Error("Empty matrix has no elements to index");
        }
      }
      function sumByRow(matrix2) {
        let sum = newArray(matrix2.rows);
        for (let i = 0; i < matrix2.rows; ++i) {
          for (let j = 0; j < matrix2.columns; ++j) {
            sum[i] += matrix2.get(i, j);
          }
        }
        return sum;
      }
      function sumByColumn(matrix2) {
        let sum = newArray(matrix2.columns);
        for (let i = 0; i < matrix2.rows; ++i) {
          for (let j = 0; j < matrix2.columns; ++j) {
            sum[j] += matrix2.get(i, j);
          }
        }
        return sum;
      }
      function sumAll(matrix2) {
        let v = 0;
        for (let i = 0; i < matrix2.rows; i++) {
          for (let j = 0; j < matrix2.columns; j++) {
            v += matrix2.get(i, j);
          }
        }
        return v;
      }
      function productByRow(matrix2) {
        let sum = newArray(matrix2.rows, 1);
        for (let i = 0; i < matrix2.rows; ++i) {
          for (let j = 0; j < matrix2.columns; ++j) {
            sum[i] *= matrix2.get(i, j);
          }
        }
        return sum;
      }
      function productByColumn(matrix2) {
        let sum = newArray(matrix2.columns, 1);
        for (let i = 0; i < matrix2.rows; ++i) {
          for (let j = 0; j < matrix2.columns; ++j) {
            sum[j] *= matrix2.get(i, j);
          }
        }
        return sum;
      }
      function productAll(matrix2) {
        let v = 1;
        for (let i = 0; i < matrix2.rows; i++) {
          for (let j = 0; j < matrix2.columns; j++) {
            v *= matrix2.get(i, j);
          }
        }
        return v;
      }
      function varianceByRow(matrix2, unbiased, mean) {
        const rows = matrix2.rows;
        const cols = matrix2.columns;
        const variance = [];
        for (let i = 0; i < rows; i++) {
          let sum1 = 0;
          let sum2 = 0;
          let x = 0;
          for (let j = 0; j < cols; j++) {
            x = matrix2.get(i, j) - mean[i];
            sum1 += x;
            sum2 += x * x;
          }
          if (unbiased) {
            variance.push((sum2 - sum1 * sum1 / cols) / (cols - 1));
          } else {
            variance.push((sum2 - sum1 * sum1 / cols) / cols);
          }
        }
        return variance;
      }
      function varianceByColumn(matrix2, unbiased, mean) {
        const rows = matrix2.rows;
        const cols = matrix2.columns;
        const variance = [];
        for (let j = 0; j < cols; j++) {
          let sum1 = 0;
          let sum2 = 0;
          let x = 0;
          for (let i = 0; i < rows; i++) {
            x = matrix2.get(i, j) - mean[j];
            sum1 += x;
            sum2 += x * x;
          }
          if (unbiased) {
            variance.push((sum2 - sum1 * sum1 / rows) / (rows - 1));
          } else {
            variance.push((sum2 - sum1 * sum1 / rows) / rows);
          }
        }
        return variance;
      }
      function varianceAll(matrix2, unbiased, mean) {
        const rows = matrix2.rows;
        const cols = matrix2.columns;
        const size = rows * cols;
        let sum1 = 0;
        let sum2 = 0;
        let x = 0;
        for (let i = 0; i < rows; i++) {
          for (let j = 0; j < cols; j++) {
            x = matrix2.get(i, j) - mean;
            sum1 += x;
            sum2 += x * x;
          }
        }
        if (unbiased) {
          return (sum2 - sum1 * sum1 / size) / (size - 1);
        } else {
          return (sum2 - sum1 * sum1 / size) / size;
        }
      }
      function centerByRow(matrix2, mean) {
        for (let i = 0; i < matrix2.rows; i++) {
          for (let j = 0; j < matrix2.columns; j++) {
            matrix2.set(i, j, matrix2.get(i, j) - mean[i]);
          }
        }
      }
      function centerByColumn(matrix2, mean) {
        for (let i = 0; i < matrix2.rows; i++) {
          for (let j = 0; j < matrix2.columns; j++) {
            matrix2.set(i, j, matrix2.get(i, j) - mean[j]);
          }
        }
      }
      function centerAll(matrix2, mean) {
        for (let i = 0; i < matrix2.rows; i++) {
          for (let j = 0; j < matrix2.columns; j++) {
            matrix2.set(i, j, matrix2.get(i, j) - mean);
          }
        }
      }
      function getScaleByRow(matrix2) {
        const scale = [];
        for (let i = 0; i < matrix2.rows; i++) {
          let sum = 0;
          for (let j = 0; j < matrix2.columns; j++) {
            sum += matrix2.get(i, j) ** 2 / (matrix2.columns - 1);
          }
          scale.push(Math.sqrt(sum));
        }
        return scale;
      }
      function scaleByRow(matrix2, scale) {
        for (let i = 0; i < matrix2.rows; i++) {
          for (let j = 0; j < matrix2.columns; j++) {
            matrix2.set(i, j, matrix2.get(i, j) / scale[i]);
          }
        }
      }
      function getScaleByColumn(matrix2) {
        const scale = [];
        for (let j = 0; j < matrix2.columns; j++) {
          let sum = 0;
          for (let i = 0; i < matrix2.rows; i++) {
            sum += matrix2.get(i, j) ** 2 / (matrix2.rows - 1);
          }
          scale.push(Math.sqrt(sum));
        }
        return scale;
      }
      function scaleByColumn(matrix2, scale) {
        for (let i = 0; i < matrix2.rows; i++) {
          for (let j = 0; j < matrix2.columns; j++) {
            matrix2.set(i, j, matrix2.get(i, j) / scale[j]);
          }
        }
      }
      function getScaleAll(matrix2) {
        const divider = matrix2.size - 1;
        let sum = 0;
        for (let j = 0; j < matrix2.columns; j++) {
          for (let i = 0; i < matrix2.rows; i++) {
            sum += matrix2.get(i, j) ** 2 / divider;
          }
        }
        return Math.sqrt(sum);
      }
      function scaleAll(matrix2, scale) {
        for (let i = 0; i < matrix2.rows; i++) {
          for (let j = 0; j < matrix2.columns; j++) {
            matrix2.set(i, j, matrix2.get(i, j) / scale);
          }
        }
      }
      var AbstractMatrix2 = class _AbstractMatrix {
        static from1DArray(newRows, newColumns, newData) {
          let length = newRows * newColumns;
          if (length !== newData.length) {
            throw new RangeError("data length does not match given dimensions");
          }
          let newMatrix = new Matrix2(newRows, newColumns);
          for (let row = 0; row < newRows; row++) {
            for (let column = 0; column < newColumns; column++) {
              newMatrix.set(row, column, newData[row * newColumns + column]);
            }
          }
          return newMatrix;
        }
        static rowVector(newData) {
          let vector = new Matrix2(1, newData.length);
          for (let i = 0; i < newData.length; i++) {
            vector.set(0, i, newData[i]);
          }
          return vector;
        }
        static columnVector(newData) {
          let vector = new Matrix2(newData.length, 1);
          for (let i = 0; i < newData.length; i++) {
            vector.set(i, 0, newData[i]);
          }
          return vector;
        }
        static zeros(rows, columns) {
          return new Matrix2(rows, columns);
        }
        static ones(rows, columns) {
          return new Matrix2(rows, columns).fill(1);
        }
        static rand(rows, columns, options = {}) {
          if (typeof options !== "object") {
            throw new TypeError("options must be an object");
          }
          const { random = Math.random } = options;
          let matrix2 = new Matrix2(rows, columns);
          for (let i = 0; i < rows; i++) {
            for (let j = 0; j < columns; j++) {
              matrix2.set(i, j, random());
            }
          }
          return matrix2;
        }
        static randInt(rows, columns, options = {}) {
          if (typeof options !== "object") {
            throw new TypeError("options must be an object");
          }
          const { min: min2 = 0, max: max2 = 1e3, random = Math.random } = options;
          if (!Number.isInteger(min2)) throw new TypeError("min must be an integer");
          if (!Number.isInteger(max2)) throw new TypeError("max must be an integer");
          if (min2 >= max2) throw new RangeError("min must be smaller than max");
          let interval = max2 - min2;
          let matrix2 = new Matrix2(rows, columns);
          for (let i = 0; i < rows; i++) {
            for (let j = 0; j < columns; j++) {
              let value = min2 + Math.round(random() * interval);
              matrix2.set(i, j, value);
            }
          }
          return matrix2;
        }
        static eye(rows, columns, value) {
          if (columns === void 0) columns = rows;
          if (value === void 0) value = 1;
          let min2 = Math.min(rows, columns);
          let matrix2 = this.zeros(rows, columns);
          for (let i = 0; i < min2; i++) {
            matrix2.set(i, i, value);
          }
          return matrix2;
        }
        static diag(data, rows, columns) {
          let l = data.length;
          if (rows === void 0) rows = l;
          if (columns === void 0) columns = rows;
          let min2 = Math.min(l, rows, columns);
          let matrix2 = this.zeros(rows, columns);
          for (let i = 0; i < min2; i++) {
            matrix2.set(i, i, data[i]);
          }
          return matrix2;
        }
        static min(matrix1, matrix2) {
          matrix1 = this.checkMatrix(matrix1);
          matrix2 = this.checkMatrix(matrix2);
          let rows = matrix1.rows;
          let columns = matrix1.columns;
          let result = new Matrix2(rows, columns);
          for (let i = 0; i < rows; i++) {
            for (let j = 0; j < columns; j++) {
              result.set(i, j, Math.min(matrix1.get(i, j), matrix2.get(i, j)));
            }
          }
          return result;
        }
        static max(matrix1, matrix2) {
          matrix1 = this.checkMatrix(matrix1);
          matrix2 = this.checkMatrix(matrix2);
          let rows = matrix1.rows;
          let columns = matrix1.columns;
          let result = new this(rows, columns);
          for (let i = 0; i < rows; i++) {
            for (let j = 0; j < columns; j++) {
              result.set(i, j, Math.max(matrix1.get(i, j), matrix2.get(i, j)));
            }
          }
          return result;
        }
        static checkMatrix(value) {
          return _AbstractMatrix.isMatrix(value) ? value : new Matrix2(value);
        }
        static isMatrix(value) {
          return value != null && value.klass === "Matrix";
        }
        get size() {
          return this.rows * this.columns;
        }
        apply(callback) {
          if (typeof callback !== "function") {
            throw new TypeError("callback must be a function");
          }
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              callback.call(this, i, j);
            }
          }
          return this;
        }
        applyAlongAxis(callback, by) {
          if (typeof callback !== "function") {
            throw new TypeError("callback must be a function");
          }
          const result = [];
          switch (by) {
            case "row": {
              for (let i = 0; i < this.rows; i++) {
                result.push(callback.call(this, this.getRow(i), i));
              }
              break;
            }
            case "column": {
              for (let i = 0; i < this.columns; i++) {
                result.push(callback.call(this, this.getColumn(i), i));
              }
              break;
            }
            default:
              throw new Error(`invalid option: ${by}`);
          }
          return result;
        }
        to1DArray() {
          let array = [];
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              array.push(this.get(i, j));
            }
          }
          return array;
        }
        to2DArray() {
          let copy = [];
          for (let i = 0; i < this.rows; i++) {
            copy.push([]);
            for (let j = 0; j < this.columns; j++) {
              copy[i].push(this.get(i, j));
            }
          }
          return copy;
        }
        toJSON() {
          return this.to2DArray();
        }
        isRowVector() {
          return this.rows === 1;
        }
        isColumnVector() {
          return this.columns === 1;
        }
        isVector() {
          return this.rows === 1 || this.columns === 1;
        }
        isSquare() {
          return this.rows === this.columns;
        }
        isEmpty() {
          return this.rows === 0 || this.columns === 0;
        }
        isSymmetric() {
          if (this.isSquare()) {
            for (let i = 0; i < this.rows; i++) {
              for (let j = 0; j <= i; j++) {
                if (this.get(i, j) !== this.get(j, i)) {
                  return false;
                }
              }
            }
            return true;
          }
          return false;
        }
        isDistance() {
          if (!this.isSymmetric()) return false;
          for (let i = 0; i < this.rows; i++) {
            if (this.get(i, i) !== 0) return false;
          }
          return true;
        }
        isEchelonForm() {
          let i = 0;
          let j = 0;
          let previousColumn = -1;
          let isEchelonForm = true;
          let checked = false;
          while (i < this.rows && isEchelonForm) {
            j = 0;
            checked = false;
            while (j < this.columns && checked === false) {
              if (this.get(i, j) === 0) {
                j++;
              } else if (this.get(i, j) === 1 && j > previousColumn) {
                checked = true;
                previousColumn = j;
              } else {
                isEchelonForm = false;
                checked = true;
              }
            }
            i++;
          }
          return isEchelonForm;
        }
        isReducedEchelonForm() {
          let i = 0;
          let j = 0;
          let previousColumn = -1;
          let isReducedEchelonForm = true;
          let checked = false;
          while (i < this.rows && isReducedEchelonForm) {
            j = 0;
            checked = false;
            while (j < this.columns && checked === false) {
              if (this.get(i, j) === 0) {
                j++;
              } else if (this.get(i, j) === 1 && j > previousColumn) {
                checked = true;
                previousColumn = j;
              } else {
                isReducedEchelonForm = false;
                checked = true;
              }
            }
            for (let k = j + 1; k < this.rows; k++) {
              if (this.get(i, k) !== 0) {
                isReducedEchelonForm = false;
              }
            }
            i++;
          }
          return isReducedEchelonForm;
        }
        echelonForm() {
          let result = this.clone();
          let h = 0;
          let k = 0;
          while (h < result.rows && k < result.columns) {
            let iMax = h;
            for (let i = h; i < result.rows; i++) {
              if (result.get(i, k) > result.get(iMax, k)) {
                iMax = i;
              }
            }
            if (result.get(iMax, k) === 0) {
              k++;
            } else {
              result.swapRows(h, iMax);
              let tmp = result.get(h, k);
              for (let j = k; j < result.columns; j++) {
                result.set(h, j, result.get(h, j) / tmp);
              }
              for (let i = h + 1; i < result.rows; i++) {
                let factor = result.get(i, k) / result.get(h, k);
                result.set(i, k, 0);
                for (let j = k + 1; j < result.columns; j++) {
                  result.set(i, j, result.get(i, j) - result.get(h, j) * factor);
                }
              }
              h++;
              k++;
            }
          }
          return result;
        }
        reducedEchelonForm() {
          let result = this.echelonForm();
          let m = result.columns;
          let n = result.rows;
          let h = n - 1;
          while (h >= 0) {
            if (result.maxRow(h) === 0) {
              h--;
            } else {
              let p = 0;
              let pivot = false;
              while (p < n && pivot === false) {
                if (result.get(h, p) === 1) {
                  pivot = true;
                } else {
                  p++;
                }
              }
              for (let i = 0; i < h; i++) {
                let factor = result.get(i, p);
                for (let j = p; j < m; j++) {
                  let tmp = result.get(i, j) - factor * result.get(h, j);
                  result.set(i, j, tmp);
                }
              }
              h--;
            }
          }
          return result;
        }
        set() {
          throw new Error("set method is unimplemented");
        }
        get() {
          throw new Error("get method is unimplemented");
        }
        repeat(options = {}) {
          if (typeof options !== "object") {
            throw new TypeError("options must be an object");
          }
          const { rows = 1, columns = 1 } = options;
          if (!Number.isInteger(rows) || rows <= 0) {
            throw new TypeError("rows must be a positive integer");
          }
          if (!Number.isInteger(columns) || columns <= 0) {
            throw new TypeError("columns must be a positive integer");
          }
          let matrix2 = new Matrix2(this.rows * rows, this.columns * columns);
          for (let i = 0; i < rows; i++) {
            for (let j = 0; j < columns; j++) {
              matrix2.setSubMatrix(this, this.rows * i, this.columns * j);
            }
          }
          return matrix2;
        }
        fill(value) {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, value);
            }
          }
          return this;
        }
        neg() {
          return this.mulS(-1);
        }
        getRow(index) {
          checkRowIndex(this, index);
          let row = [];
          for (let i = 0; i < this.columns; i++) {
            row.push(this.get(index, i));
          }
          return row;
        }
        getRowVector(index) {
          return Matrix2.rowVector(this.getRow(index));
        }
        setRow(index, array) {
          checkRowIndex(this, index);
          array = checkRowVector(this, array);
          for (let i = 0; i < this.columns; i++) {
            this.set(index, i, array[i]);
          }
          return this;
        }
        swapRows(row1, row2) {
          checkRowIndex(this, row1);
          checkRowIndex(this, row2);
          for (let i = 0; i < this.columns; i++) {
            let temp = this.get(row1, i);
            this.set(row1, i, this.get(row2, i));
            this.set(row2, i, temp);
          }
          return this;
        }
        getColumn(index) {
          checkColumnIndex(this, index);
          let column = [];
          for (let i = 0; i < this.rows; i++) {
            column.push(this.get(i, index));
          }
          return column;
        }
        getColumnVector(index) {
          return Matrix2.columnVector(this.getColumn(index));
        }
        setColumn(index, array) {
          checkColumnIndex(this, index);
          array = checkColumnVector(this, array);
          for (let i = 0; i < this.rows; i++) {
            this.set(i, index, array[i]);
          }
          return this;
        }
        swapColumns(column1, column2) {
          checkColumnIndex(this, column1);
          checkColumnIndex(this, column2);
          for (let i = 0; i < this.rows; i++) {
            let temp = this.get(i, column1);
            this.set(i, column1, this.get(i, column2));
            this.set(i, column2, temp);
          }
          return this;
        }
        addRowVector(vector) {
          vector = checkRowVector(this, vector);
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, this.get(i, j) + vector[j]);
            }
          }
          return this;
        }
        subRowVector(vector) {
          vector = checkRowVector(this, vector);
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, this.get(i, j) - vector[j]);
            }
          }
          return this;
        }
        mulRowVector(vector) {
          vector = checkRowVector(this, vector);
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, this.get(i, j) * vector[j]);
            }
          }
          return this;
        }
        divRowVector(vector) {
          vector = checkRowVector(this, vector);
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, this.get(i, j) / vector[j]);
            }
          }
          return this;
        }
        addColumnVector(vector) {
          vector = checkColumnVector(this, vector);
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, this.get(i, j) + vector[i]);
            }
          }
          return this;
        }
        subColumnVector(vector) {
          vector = checkColumnVector(this, vector);
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, this.get(i, j) - vector[i]);
            }
          }
          return this;
        }
        mulColumnVector(vector) {
          vector = checkColumnVector(this, vector);
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, this.get(i, j) * vector[i]);
            }
          }
          return this;
        }
        divColumnVector(vector) {
          vector = checkColumnVector(this, vector);
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, this.get(i, j) / vector[i]);
            }
          }
          return this;
        }
        mulRow(index, value) {
          checkRowIndex(this, index);
          for (let i = 0; i < this.columns; i++) {
            this.set(index, i, this.get(index, i) * value);
          }
          return this;
        }
        mulColumn(index, value) {
          checkColumnIndex(this, index);
          for (let i = 0; i < this.rows; i++) {
            this.set(i, index, this.get(i, index) * value);
          }
          return this;
        }
        max(by) {
          if (this.isEmpty()) {
            return NaN;
          }
          switch (by) {
            case "row": {
              const max2 = new Array(this.rows).fill(Number.NEGATIVE_INFINITY);
              for (let row = 0; row < this.rows; row++) {
                for (let column = 0; column < this.columns; column++) {
                  if (this.get(row, column) > max2[row]) {
                    max2[row] = this.get(row, column);
                  }
                }
              }
              return max2;
            }
            case "column": {
              const max2 = new Array(this.columns).fill(Number.NEGATIVE_INFINITY);
              for (let row = 0; row < this.rows; row++) {
                for (let column = 0; column < this.columns; column++) {
                  if (this.get(row, column) > max2[column]) {
                    max2[column] = this.get(row, column);
                  }
                }
              }
              return max2;
            }
            case void 0: {
              let max2 = this.get(0, 0);
              for (let row = 0; row < this.rows; row++) {
                for (let column = 0; column < this.columns; column++) {
                  if (this.get(row, column) > max2) {
                    max2 = this.get(row, column);
                  }
                }
              }
              return max2;
            }
            default:
              throw new Error(`invalid option: ${by}`);
          }
        }
        maxIndex() {
          checkNonEmpty(this);
          let v = this.get(0, 0);
          let idx = [0, 0];
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              if (this.get(i, j) > v) {
                v = this.get(i, j);
                idx[0] = i;
                idx[1] = j;
              }
            }
          }
          return idx;
        }
        min(by) {
          if (this.isEmpty()) {
            return NaN;
          }
          switch (by) {
            case "row": {
              const min2 = new Array(this.rows).fill(Number.POSITIVE_INFINITY);
              for (let row = 0; row < this.rows; row++) {
                for (let column = 0; column < this.columns; column++) {
                  if (this.get(row, column) < min2[row]) {
                    min2[row] = this.get(row, column);
                  }
                }
              }
              return min2;
            }
            case "column": {
              const min2 = new Array(this.columns).fill(Number.POSITIVE_INFINITY);
              for (let row = 0; row < this.rows; row++) {
                for (let column = 0; column < this.columns; column++) {
                  if (this.get(row, column) < min2[column]) {
                    min2[column] = this.get(row, column);
                  }
                }
              }
              return min2;
            }
            case void 0: {
              let min2 = this.get(0, 0);
              for (let row = 0; row < this.rows; row++) {
                for (let column = 0; column < this.columns; column++) {
                  if (this.get(row, column) < min2) {
                    min2 = this.get(row, column);
                  }
                }
              }
              return min2;
            }
            default:
              throw new Error(`invalid option: ${by}`);
          }
        }
        minIndex() {
          checkNonEmpty(this);
          let v = this.get(0, 0);
          let idx = [0, 0];
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              if (this.get(i, j) < v) {
                v = this.get(i, j);
                idx[0] = i;
                idx[1] = j;
              }
            }
          }
          return idx;
        }
        maxRow(row) {
          checkRowIndex(this, row);
          if (this.isEmpty()) {
            return NaN;
          }
          let v = this.get(row, 0);
          for (let i = 1; i < this.columns; i++) {
            if (this.get(row, i) > v) {
              v = this.get(row, i);
            }
          }
          return v;
        }
        maxRowIndex(row) {
          checkRowIndex(this, row);
          checkNonEmpty(this);
          let v = this.get(row, 0);
          let idx = [row, 0];
          for (let i = 1; i < this.columns; i++) {
            if (this.get(row, i) > v) {
              v = this.get(row, i);
              idx[1] = i;
            }
          }
          return idx;
        }
        minRow(row) {
          checkRowIndex(this, row);
          if (this.isEmpty()) {
            return NaN;
          }
          let v = this.get(row, 0);
          for (let i = 1; i < this.columns; i++) {
            if (this.get(row, i) < v) {
              v = this.get(row, i);
            }
          }
          return v;
        }
        minRowIndex(row) {
          checkRowIndex(this, row);
          checkNonEmpty(this);
          let v = this.get(row, 0);
          let idx = [row, 0];
          for (let i = 1; i < this.columns; i++) {
            if (this.get(row, i) < v) {
              v = this.get(row, i);
              idx[1] = i;
            }
          }
          return idx;
        }
        maxColumn(column) {
          checkColumnIndex(this, column);
          if (this.isEmpty()) {
            return NaN;
          }
          let v = this.get(0, column);
          for (let i = 1; i < this.rows; i++) {
            if (this.get(i, column) > v) {
              v = this.get(i, column);
            }
          }
          return v;
        }
        maxColumnIndex(column) {
          checkColumnIndex(this, column);
          checkNonEmpty(this);
          let v = this.get(0, column);
          let idx = [0, column];
          for (let i = 1; i < this.rows; i++) {
            if (this.get(i, column) > v) {
              v = this.get(i, column);
              idx[0] = i;
            }
          }
          return idx;
        }
        minColumn(column) {
          checkColumnIndex(this, column);
          if (this.isEmpty()) {
            return NaN;
          }
          let v = this.get(0, column);
          for (let i = 1; i < this.rows; i++) {
            if (this.get(i, column) < v) {
              v = this.get(i, column);
            }
          }
          return v;
        }
        minColumnIndex(column) {
          checkColumnIndex(this, column);
          checkNonEmpty(this);
          let v = this.get(0, column);
          let idx = [0, column];
          for (let i = 1; i < this.rows; i++) {
            if (this.get(i, column) < v) {
              v = this.get(i, column);
              idx[0] = i;
            }
          }
          return idx;
        }
        diag() {
          let min2 = Math.min(this.rows, this.columns);
          let diag = [];
          for (let i = 0; i < min2; i++) {
            diag.push(this.get(i, i));
          }
          return diag;
        }
        norm(type = "frobenius") {
          switch (type) {
            case "max":
              return this.max();
            case "frobenius":
              return Math.sqrt(this.dot(this));
            default:
              throw new RangeError(`unknown norm type: ${type}`);
          }
        }
        cumulativeSum() {
          let sum = 0;
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              sum += this.get(i, j);
              this.set(i, j, sum);
            }
          }
          return this;
        }
        dot(vector2) {
          if (_AbstractMatrix.isMatrix(vector2)) vector2 = vector2.to1DArray();
          let vector1 = this.to1DArray();
          if (vector1.length !== vector2.length) {
            throw new RangeError("vectors do not have the same size");
          }
          let dot = 0;
          for (let i = 0; i < vector1.length; i++) {
            dot += vector1[i] * vector2[i];
          }
          return dot;
        }
        mmul(other) {
          other = Matrix2.checkMatrix(other);
          let m = this.rows;
          let n = this.columns;
          let p = other.columns;
          let result = new Matrix2(m, p);
          let Bcolj = new Float64Array(n);
          for (let j = 0; j < p; j++) {
            for (let k = 0; k < n; k++) {
              Bcolj[k] = other.get(k, j);
            }
            for (let i = 0; i < m; i++) {
              let s = 0;
              for (let k = 0; k < n; k++) {
                s += this.get(i, k) * Bcolj[k];
              }
              result.set(i, j, s);
            }
          }
          return result;
        }
        gram() {
          const rows = this.rows;
          const n = this.columns;
          const gramData = new Float64Array(n * n);
          for (let r = 0; r < rows; r++) {
            for (let i = 0; i < n; i++) {
              const value = this.get(r, i);
              if (value === 0) continue;
              const offset = i * n;
              for (let j = i; j < n; j++) {
                gramData[offset + j] += value * this.get(r, j);
              }
            }
          }
          const result = new Matrix2(n, n);
          for (let i = 0; i < n; i++) {
            const offset = i * n;
            for (let j = i; j < n; j++) {
              const value = gramData[offset + j];
              result.set(i, j, value);
              result.set(j, i, value);
            }
          }
          return result;
        }
        transposeMultiply(other) {
          other = Matrix2.checkMatrix(other);
          if (this.rows !== other.rows) {
            throw new RangeError(
              "the number of rows of the two matrices must be equal"
            );
          }
          const n = this.columns;
          const p = other.columns;
          const result = new Matrix2(n, p);
          const otherRow = new Float64Array(p);
          for (let r = 0; r < this.rows; r++) {
            for (let j = 0; j < p; j++) {
              otherRow[j] = other.get(r, j);
            }
            for (let i = 0; i < n; i++) {
              const value = this.get(r, i);
              if (value === 0) continue;
              const resultRow = result.data[i];
              for (let j = 0; j < p; j++) {
                resultRow[j] += value * otherRow[j];
              }
            }
          }
          return result;
        }
        mmulByTranspose(scale) {
          let m = this.rows;
          let n = this.columns;
          if (scale !== void 0 && scale.length !== n) {
            throw new RangeError("scale must have one value per column");
          }
          let result = new Matrix2(m, m);
          let rowj = new Float64Array(n);
          for (let j = 0; j < m; j++) {
            if (scale === void 0) {
              for (let k = 0; k < n; k++) {
                rowj[k] = this.get(j, k);
              }
            } else {
              for (let k = 0; k < n; k++) {
                rowj[k] = scale[k] * this.get(j, k);
              }
            }
            for (let i = j; i < m; i++) {
              let s = 0;
              for (let k = 0; k < n; k++) {
                s += this.get(i, k) * rowj[k];
              }
              result.set(i, j, s);
              result.set(j, i, s);
            }
          }
          return result;
        }
        mpow(scalar) {
          if (!this.isSquare()) {
            throw new RangeError("Matrix must be square");
          }
          if (!Number.isInteger(scalar) || scalar < 0) {
            throw new RangeError("Exponent must be a non-negative integer");
          }
          let result = Matrix2.eye(this.rows);
          let bb = this;
          for (let e = scalar; e >= 1; e /= 2) {
            if ((e & 1) !== 0) {
              result = result.mmul(bb);
            }
            bb = bb.mmul(bb);
          }
          return result;
        }
        strassen2x2(other) {
          other = Matrix2.checkMatrix(other);
          let result = new Matrix2(2, 2);
          const a11 = this.get(0, 0);
          const b11 = other.get(0, 0);
          const a12 = this.get(0, 1);
          const b12 = other.get(0, 1);
          const a21 = this.get(1, 0);
          const b21 = other.get(1, 0);
          const a22 = this.get(1, 1);
          const b22 = other.get(1, 1);
          const m1 = (a11 + a22) * (b11 + b22);
          const m2 = (a21 + a22) * b11;
          const m3 = a11 * (b12 - b22);
          const m4 = a22 * (b21 - b11);
          const m5 = (a11 + a12) * b22;
          const m6 = (a21 - a11) * (b11 + b12);
          const m7 = (a12 - a22) * (b21 + b22);
          const c00 = m1 + m4 - m5 + m7;
          const c01 = m3 + m5;
          const c10 = m2 + m4;
          const c11 = m1 - m2 + m3 + m6;
          result.set(0, 0, c00);
          result.set(0, 1, c01);
          result.set(1, 0, c10);
          result.set(1, 1, c11);
          return result;
        }
        strassen3x3(other) {
          other = Matrix2.checkMatrix(other);
          let result = new Matrix2(3, 3);
          const a00 = this.get(0, 0);
          const a01 = this.get(0, 1);
          const a02 = this.get(0, 2);
          const a10 = this.get(1, 0);
          const a11 = this.get(1, 1);
          const a12 = this.get(1, 2);
          const a20 = this.get(2, 0);
          const a21 = this.get(2, 1);
          const a22 = this.get(2, 2);
          const b00 = other.get(0, 0);
          const b01 = other.get(0, 1);
          const b02 = other.get(0, 2);
          const b10 = other.get(1, 0);
          const b11 = other.get(1, 1);
          const b12 = other.get(1, 2);
          const b20 = other.get(2, 0);
          const b21 = other.get(2, 1);
          const b22 = other.get(2, 2);
          const m1 = (a00 + a01 + a02 - a10 - a11 - a21 - a22) * b11;
          const m2 = (a00 - a10) * (-b01 + b11);
          const m3 = a11 * (-b00 + b01 + b10 - b11 - b12 - b20 + b22);
          const m4 = (-a00 + a10 + a11) * (b00 - b01 + b11);
          const m5 = (a10 + a11) * (-b00 + b01);
          const m6 = a00 * b00;
          const m7 = (-a00 + a20 + a21) * (b00 - b02 + b12);
          const m8 = (-a00 + a20) * (b02 - b12);
          const m9 = (a20 + a21) * (-b00 + b02);
          const m10 = (a00 + a01 + a02 - a11 - a12 - a20 - a21) * b12;
          const m11 = a21 * (-b00 + b02 + b10 - b11 - b12 - b20 + b21);
          const m12 = (-a02 + a21 + a22) * (b11 + b20 - b21);
          const m13 = (a02 - a22) * (b11 - b21);
          const m14 = a02 * b20;
          const m15 = (a21 + a22) * (-b20 + b21);
          const m16 = (-a02 + a11 + a12) * (b12 + b20 - b22);
          const m17 = (a02 - a12) * (b12 - b22);
          const m18 = (a11 + a12) * (-b20 + b22);
          const m19 = a01 * b10;
          const m20 = a12 * b21;
          const m21 = a10 * b02;
          const m22 = a20 * b01;
          const m23 = a22 * b22;
          const c00 = m6 + m14 + m19;
          const c01 = m1 + m4 + m5 + m6 + m12 + m14 + m15;
          const c02 = m6 + m7 + m9 + m10 + m14 + m16 + m18;
          const c10 = m2 + m3 + m4 + m6 + m14 + m16 + m17;
          const c11 = m2 + m4 + m5 + m6 + m20;
          const c12 = m14 + m16 + m17 + m18 + m21;
          const c20 = m6 + m7 + m8 + m11 + m12 + m13 + m14;
          const c21 = m12 + m13 + m14 + m15 + m22;
          const c22 = m6 + m7 + m8 + m9 + m23;
          result.set(0, 0, c00);
          result.set(0, 1, c01);
          result.set(0, 2, c02);
          result.set(1, 0, c10);
          result.set(1, 1, c11);
          result.set(1, 2, c12);
          result.set(2, 0, c20);
          result.set(2, 1, c21);
          result.set(2, 2, c22);
          return result;
        }
        mmulStrassen(y) {
          y = Matrix2.checkMatrix(y);
          let x = this.clone();
          let r1 = x.rows;
          let c1 = x.columns;
          let r2 = y.rows;
          let c2 = y.columns;
          if (c1 !== r2) {
            console.warn(
              `Multiplying ${r1} x ${c1} and ${r2} x ${c2} matrix: dimensions do not match.`
            );
          }
          function embed(mat, rows, cols) {
            let r3 = mat.rows;
            let c3 = mat.columns;
            if (r3 === rows && c3 === cols) {
              return mat;
            } else {
              let resultat = _AbstractMatrix.zeros(rows, cols);
              resultat = resultat.setSubMatrix(mat, 0, 0);
              return resultat;
            }
          }
          let r = Math.max(r1, r2);
          let c = Math.max(c1, c2);
          x = embed(x, r, c);
          y = embed(y, r, c);
          function blockMult(a, b, rows, cols) {
            if (rows <= 512 || cols <= 512) {
              return a.mmul(b);
            }
            if (rows % 2 === 1 && cols % 2 === 1) {
              a = embed(a, rows + 1, cols + 1);
              b = embed(b, rows + 1, cols + 1);
            } else if (rows % 2 === 1) {
              a = embed(a, rows + 1, cols);
              b = embed(b, rows + 1, cols);
            } else if (cols % 2 === 1) {
              a = embed(a, rows, cols + 1);
              b = embed(b, rows, cols + 1);
            }
            let halfRows = parseInt(a.rows / 2, 10);
            let halfCols = parseInt(a.columns / 2, 10);
            let a11 = a.subMatrix(0, halfRows - 1, 0, halfCols - 1);
            let b11 = b.subMatrix(0, halfRows - 1, 0, halfCols - 1);
            let a12 = a.subMatrix(0, halfRows - 1, halfCols, a.columns - 1);
            let b12 = b.subMatrix(0, halfRows - 1, halfCols, b.columns - 1);
            let a21 = a.subMatrix(halfRows, a.rows - 1, 0, halfCols - 1);
            let b21 = b.subMatrix(halfRows, b.rows - 1, 0, halfCols - 1);
            let a22 = a.subMatrix(halfRows, a.rows - 1, halfCols, a.columns - 1);
            let b22 = b.subMatrix(halfRows, b.rows - 1, halfCols, b.columns - 1);
            let m1 = blockMult(
              _AbstractMatrix.add(a11, a22),
              _AbstractMatrix.add(b11, b22),
              halfRows,
              halfCols
            );
            let m2 = blockMult(_AbstractMatrix.add(a21, a22), b11, halfRows, halfCols);
            let m3 = blockMult(a11, _AbstractMatrix.sub(b12, b22), halfRows, halfCols);
            let m4 = blockMult(a22, _AbstractMatrix.sub(b21, b11), halfRows, halfCols);
            let m5 = blockMult(_AbstractMatrix.add(a11, a12), b22, halfRows, halfCols);
            let m6 = blockMult(
              _AbstractMatrix.sub(a21, a11),
              _AbstractMatrix.add(b11, b12),
              halfRows,
              halfCols
            );
            let m7 = blockMult(
              _AbstractMatrix.sub(a12, a22),
              _AbstractMatrix.add(b21, b22),
              halfRows,
              halfCols
            );
            let c11 = _AbstractMatrix.add(m1, m4);
            c11.sub(m5);
            c11.add(m7);
            let c12 = _AbstractMatrix.add(m3, m5);
            let c21 = _AbstractMatrix.add(m2, m4);
            let c22 = _AbstractMatrix.sub(m1, m2);
            c22.add(m3);
            c22.add(m6);
            let result = _AbstractMatrix.zeros(2 * c11.rows, 2 * c11.columns);
            result = result.setSubMatrix(c11, 0, 0);
            result = result.setSubMatrix(c12, c11.rows, 0);
            result = result.setSubMatrix(c21, 0, c11.columns);
            result = result.setSubMatrix(c22, c11.rows, c11.columns);
            return result.subMatrix(0, rows - 1, 0, cols - 1);
          }
          return blockMult(x, y, r, c);
        }
        scaleRows(options = {}) {
          if (typeof options !== "object") {
            throw new TypeError("options must be an object");
          }
          const { min: min2 = 0, max: max2 = 1 } = options;
          if (!Number.isFinite(min2)) throw new TypeError("min must be a number");
          if (!Number.isFinite(max2)) throw new TypeError("max must be a number");
          if (min2 >= max2) throw new RangeError("min must be smaller than max");
          let newMatrix = new Matrix2(this.rows, this.columns);
          for (let i = 0; i < this.rows; i++) {
            const row = this.getRow(i);
            if (row.length > 0) {
              rescale(row, { min: min2, max: max2, output: row });
            }
            newMatrix.setRow(i, row);
          }
          return newMatrix;
        }
        scaleColumns(options = {}) {
          if (typeof options !== "object") {
            throw new TypeError("options must be an object");
          }
          const { min: min2 = 0, max: max2 = 1 } = options;
          if (!Number.isFinite(min2)) throw new TypeError("min must be a number");
          if (!Number.isFinite(max2)) throw new TypeError("max must be a number");
          if (min2 >= max2) throw new RangeError("min must be smaller than max");
          let newMatrix = new Matrix2(this.rows, this.columns);
          for (let i = 0; i < this.columns; i++) {
            const column = this.getColumn(i);
            if (column.length) {
              rescale(column, {
                min: min2,
                max: max2,
                output: column
              });
            }
            newMatrix.setColumn(i, column);
          }
          return newMatrix;
        }
        flipRows() {
          const middle = Math.ceil(this.columns / 2);
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < middle; j++) {
              let first = this.get(i, j);
              let last = this.get(i, this.columns - 1 - j);
              this.set(i, j, last);
              this.set(i, this.columns - 1 - j, first);
            }
          }
          return this;
        }
        flipColumns() {
          const middle = Math.ceil(this.rows / 2);
          for (let j = 0; j < this.columns; j++) {
            for (let i = 0; i < middle; i++) {
              let first = this.get(i, j);
              let last = this.get(this.rows - 1 - i, j);
              this.set(i, j, last);
              this.set(this.rows - 1 - i, j, first);
            }
          }
          return this;
        }
        kroneckerProduct(other) {
          other = Matrix2.checkMatrix(other);
          let m = this.rows;
          let n = this.columns;
          let p = other.rows;
          let q = other.columns;
          let result = new Matrix2(m * p, n * q);
          for (let i = 0; i < m; i++) {
            for (let j = 0; j < n; j++) {
              for (let k = 0; k < p; k++) {
                for (let l = 0; l < q; l++) {
                  result.set(p * i + k, q * j + l, this.get(i, j) * other.get(k, l));
                }
              }
            }
          }
          return result;
        }
        kroneckerSum(other) {
          other = Matrix2.checkMatrix(other);
          if (!this.isSquare() || !other.isSquare()) {
            throw new Error("Kronecker Sum needs two Square Matrices");
          }
          let m = this.rows;
          let n = other.rows;
          let AxI = this.kroneckerProduct(Matrix2.eye(n, n));
          let IxB = Matrix2.eye(m, m).kroneckerProduct(other);
          return AxI.add(IxB);
        }
        transpose() {
          let result = new Matrix2(this.columns, this.rows);
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              result.set(j, i, this.get(i, j));
            }
          }
          return result;
        }
        sortRows(compareFunction = compareNumbers) {
          for (let i = 0; i < this.rows; i++) {
            this.setRow(i, this.getRow(i).sort(compareFunction));
          }
          return this;
        }
        sortColumns(compareFunction = compareNumbers) {
          for (let i = 0; i < this.columns; i++) {
            this.setColumn(i, this.getColumn(i).sort(compareFunction));
          }
          return this;
        }
        subMatrix(startRow, endRow, startColumn, endColumn) {
          checkRange(this, startRow, endRow, startColumn, endColumn);
          let newMatrix = new Matrix2(
            endRow - startRow + 1,
            endColumn - startColumn + 1
          );
          for (let i = startRow; i <= endRow; i++) {
            for (let j = startColumn; j <= endColumn; j++) {
              newMatrix.set(i - startRow, j - startColumn, this.get(i, j));
            }
          }
          return newMatrix;
        }
        subMatrixRow(indices, startColumn, endColumn) {
          if (startColumn === void 0) startColumn = 0;
          if (endColumn === void 0) endColumn = this.columns - 1;
          if (startColumn > endColumn || startColumn < 0 || startColumn >= this.columns || endColumn < 0 || endColumn >= this.columns) {
            throw new RangeError("Argument out of range");
          }
          let newMatrix = new Matrix2(indices.length, endColumn - startColumn + 1);
          for (let i = 0; i < indices.length; i++) {
            for (let j = startColumn; j <= endColumn; j++) {
              if (indices[i] < 0 || indices[i] >= this.rows) {
                throw new RangeError(`Row index out of range: ${indices[i]}`);
              }
              newMatrix.set(i, j - startColumn, this.get(indices[i], j));
            }
          }
          return newMatrix;
        }
        subMatrixColumn(indices, startRow, endRow) {
          if (startRow === void 0) startRow = 0;
          if (endRow === void 0) endRow = this.rows - 1;
          if (startRow > endRow || startRow < 0 || startRow >= this.rows || endRow < 0 || endRow >= this.rows) {
            throw new RangeError("Argument out of range");
          }
          let newMatrix = new Matrix2(endRow - startRow + 1, indices.length);
          for (let i = 0; i < indices.length; i++) {
            for (let j = startRow; j <= endRow; j++) {
              if (indices[i] < 0 || indices[i] >= this.columns) {
                throw new RangeError(`Column index out of range: ${indices[i]}`);
              }
              newMatrix.set(j - startRow, i, this.get(j, indices[i]));
            }
          }
          return newMatrix;
        }
        setSubMatrix(matrix2, startRow, startColumn) {
          matrix2 = Matrix2.checkMatrix(matrix2);
          if (matrix2.isEmpty()) {
            return this;
          }
          let endRow = startRow + matrix2.rows - 1;
          let endColumn = startColumn + matrix2.columns - 1;
          checkRange(this, startRow, endRow, startColumn, endColumn);
          for (let i = 0; i < matrix2.rows; i++) {
            for (let j = 0; j < matrix2.columns; j++) {
              this.set(startRow + i, startColumn + j, matrix2.get(i, j));
            }
          }
          return this;
        }
        concat(other, by = "row") {
          other = Matrix2.checkMatrix(other);
          switch (by) {
            case "row": {
              if (this.columns !== other.columns) {
                throw new RangeError(
                  "both matrices must have the same number of columns"
                );
              }
              const result = new Matrix2(this.rows + other.rows, this.columns);
              result.setSubMatrix(this, 0, 0);
              result.setSubMatrix(other, this.rows, 0);
              return result;
            }
            case "column": {
              if (this.rows !== other.rows) {
                throw new RangeError(
                  "both matrices must have the same number of rows"
                );
              }
              const result = new Matrix2(this.rows, this.columns + other.columns);
              result.setSubMatrix(this, 0, 0);
              result.setSubMatrix(other, 0, this.columns);
              return result;
            }
            default:
              throw new Error(`invalid option: ${by}`);
          }
        }
        selection(rowIndices, columnIndices) {
          checkRowIndices(this, rowIndices);
          checkColumnIndices(this, columnIndices);
          let newMatrix = new Matrix2(rowIndices.length, columnIndices.length);
          for (let i = 0; i < rowIndices.length; i++) {
            let rowIndex = rowIndices[i];
            for (let j = 0; j < columnIndices.length; j++) {
              let columnIndex = columnIndices[j];
              newMatrix.set(i, j, this.get(rowIndex, columnIndex));
            }
          }
          return newMatrix;
        }
        trace() {
          let min2 = Math.min(this.rows, this.columns);
          let trace = 0;
          for (let i = 0; i < min2; i++) {
            trace += this.get(i, i);
          }
          return trace;
        }
        clone() {
          return this.constructor.copy(this, new Matrix2(this.rows, this.columns));
        }
        /**
         * @template {AbstractMatrix} M
         * @param {AbstractMatrix} from
         * @param {M} to
         * @return {M}
         */
        static copy(from, to) {
          for (const [row, column, value] of from.entries()) {
            to.set(row, column, value);
          }
          return to;
        }
        sum(by) {
          switch (by) {
            case "row":
              return sumByRow(this);
            case "column":
              return sumByColumn(this);
            case void 0:
              return sumAll(this);
            default:
              throw new Error(`invalid option: ${by}`);
          }
        }
        product(by) {
          switch (by) {
            case "row":
              return productByRow(this);
            case "column":
              return productByColumn(this);
            case void 0:
              return productAll(this);
            default:
              throw new Error(`invalid option: ${by}`);
          }
        }
        mean(by) {
          const sum = this.sum(by);
          switch (by) {
            case "row": {
              for (let i = 0; i < this.rows; i++) {
                sum[i] /= this.columns;
              }
              return sum;
            }
            case "column": {
              for (let i = 0; i < this.columns; i++) {
                sum[i] /= this.rows;
              }
              return sum;
            }
            case void 0:
              return sum / this.size;
            default:
              throw new Error(`invalid option: ${by}`);
          }
        }
        variance(by, options = {}) {
          if (typeof by === "object") {
            options = by;
            by = void 0;
          }
          if (typeof options !== "object") {
            throw new TypeError("options must be an object");
          }
          const { unbiased = true, mean = this.mean(by) } = options;
          if (typeof unbiased !== "boolean") {
            throw new TypeError("unbiased must be a boolean");
          }
          switch (by) {
            case "row": {
              if (!isAnyArray(mean)) {
                throw new TypeError("mean must be an array");
              }
              return varianceByRow(this, unbiased, mean);
            }
            case "column": {
              if (!isAnyArray(mean)) {
                throw new TypeError("mean must be an array");
              }
              return varianceByColumn(this, unbiased, mean);
            }
            case void 0: {
              if (typeof mean !== "number") {
                throw new TypeError("mean must be a number");
              }
              return varianceAll(this, unbiased, mean);
            }
            default:
              throw new Error(`invalid option: ${by}`);
          }
        }
        standardDeviation(by, options) {
          if (typeof by === "object") {
            options = by;
            by = void 0;
          }
          const variance = this.variance(by, options);
          if (by === void 0) {
            return Math.sqrt(variance);
          } else {
            for (let i = 0; i < variance.length; i++) {
              variance[i] = Math.sqrt(variance[i]);
            }
            return variance;
          }
        }
        center(by, options = {}) {
          if (typeof by === "object") {
            options = by;
            by = void 0;
          }
          if (typeof options !== "object") {
            throw new TypeError("options must be an object");
          }
          const { center = this.mean(by) } = options;
          switch (by) {
            case "row": {
              if (!isAnyArray(center)) {
                throw new TypeError("center must be an array");
              }
              centerByRow(this, center);
              return this;
            }
            case "column": {
              if (!isAnyArray(center)) {
                throw new TypeError("center must be an array");
              }
              centerByColumn(this, center);
              return this;
            }
            case void 0: {
              if (typeof center !== "number") {
                throw new TypeError("center must be a number");
              }
              centerAll(this, center);
              return this;
            }
            default:
              throw new Error(`invalid option: ${by}`);
          }
        }
        scale(by, options = {}) {
          if (typeof by === "object") {
            options = by;
            by = void 0;
          }
          if (typeof options !== "object") {
            throw new TypeError("options must be an object");
          }
          let scale = options.scale;
          switch (by) {
            case "row": {
              if (scale === void 0) {
                scale = getScaleByRow(this);
              } else if (!isAnyArray(scale)) {
                throw new TypeError("scale must be an array");
              }
              scaleByRow(this, scale);
              return this;
            }
            case "column": {
              if (scale === void 0) {
                scale = getScaleByColumn(this);
              } else if (!isAnyArray(scale)) {
                throw new TypeError("scale must be an array");
              }
              scaleByColumn(this, scale);
              return this;
            }
            case void 0: {
              if (scale === void 0) {
                scale = getScaleAll(this);
              } else if (typeof scale !== "number") {
                throw new TypeError("scale must be a number");
              }
              scaleAll(this, scale);
              return this;
            }
            default:
              throw new Error(`invalid option: ${by}`);
          }
        }
        toString(options) {
          return inspectMatrixWithOptions(this, options);
        }
        [Symbol.iterator]() {
          return this.entries();
        }
        /**
         * iterator from left to right, from top to bottom
         * yield [row, column, value]
         * @returns {Generator<[number, number, number], void, void>}
         */
        *entries() {
          for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.columns; col++) {
              yield [row, col, this.get(row, col)];
            }
          }
        }
        /**
         * iterator from left to right, from top to bottom
         * yield value
         * @returns {Generator<number, void, void>}
         */
        *values() {
          for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.columns; col++) {
              yield this.get(row, col);
            }
          }
        }
      };
      AbstractMatrix2.prototype.klass = "Matrix";
      if (typeof Symbol !== "undefined") {
        AbstractMatrix2.prototype[/* @__PURE__ */ Symbol.for("nodejs.util.inspect.custom")] = inspectMatrix;
      }
      function compareNumbers(a, b) {
        return a - b;
      }
      function isArrayOfNumbers(array) {
        return array.every((element) => {
          return typeof element === "number";
        });
      }
      AbstractMatrix2.random = AbstractMatrix2.rand;
      AbstractMatrix2.randomInt = AbstractMatrix2.randInt;
      AbstractMatrix2.diagonal = AbstractMatrix2.diag;
      AbstractMatrix2.prototype.diagonal = AbstractMatrix2.prototype.diag;
      AbstractMatrix2.identity = AbstractMatrix2.eye;
      AbstractMatrix2.prototype.negate = AbstractMatrix2.prototype.neg;
      AbstractMatrix2.prototype.tensorProduct = AbstractMatrix2.prototype.kroneckerProduct;
      var Matrix2 = class _Matrix extends AbstractMatrix2 {
        /**
         * @type {Float64Array[]}
         */
        data;
        /**
         * Init an empty matrix
         * @param {number} nRows
         * @param {number} nColumns
         */
        #initData(nRows, nColumns) {
          this.data = [];
          if (Number.isInteger(nColumns) && nColumns >= 0) {
            for (let i = 0; i < nRows; i++) {
              this.data.push(new Float64Array(nColumns));
            }
          } else {
            throw new TypeError("nColumns must be a positive integer");
          }
          this.rows = nRows;
          this.columns = nColumns;
        }
        constructor(nRows, nColumns) {
          super();
          if (_Matrix.isMatrix(nRows)) {
            this.#initData(nRows.rows, nRows.columns);
            _Matrix.copy(nRows, this);
          } else if (Number.isInteger(nRows) && nRows >= 0) {
            this.#initData(nRows, nColumns);
          } else if (isAnyArray(nRows)) {
            const arrayData = nRows;
            nRows = arrayData.length;
            nColumns = nRows ? arrayData[0].length : 0;
            if (typeof nColumns !== "number") {
              throw new TypeError(
                "Data must be a 2D array with at least one element"
              );
            }
            this.data = [];
            for (let i = 0; i < nRows; i++) {
              if (arrayData[i].length !== nColumns) {
                throw new RangeError("Inconsistent array dimensions");
              }
              if (!isArrayOfNumbers(arrayData[i])) {
                throw new TypeError("Input data contains non-numeric values");
              }
              this.data.push(Float64Array.from(arrayData[i]));
            }
            this.rows = nRows;
            this.columns = nColumns;
          } else {
            throw new TypeError(
              "First argument must be a positive number or an array"
            );
          }
        }
        set(rowIndex, columnIndex, value) {
          this.data[rowIndex][columnIndex] = value;
          return this;
        }
        get(rowIndex, columnIndex) {
          return this.data[rowIndex][columnIndex];
        }
        removeRow(index) {
          checkRowIndex(this, index);
          this.data.splice(index, 1);
          this.rows -= 1;
          return this;
        }
        addRow(index, array) {
          if (array === void 0) {
            array = index;
            index = this.rows;
          }
          checkRowIndex(this, index, true);
          array = Float64Array.from(checkRowVector(this, array));
          this.data.splice(index, 0, array);
          this.rows += 1;
          return this;
        }
        removeColumn(index) {
          checkColumnIndex(this, index);
          for (let i = 0; i < this.rows; i++) {
            const newRow = new Float64Array(this.columns - 1);
            for (let j = 0; j < index; j++) {
              newRow[j] = this.data[i][j];
            }
            for (let j = index + 1; j < this.columns; j++) {
              newRow[j - 1] = this.data[i][j];
            }
            this.data[i] = newRow;
          }
          this.columns -= 1;
          return this;
        }
        addColumn(index, array) {
          if (typeof array === "undefined") {
            array = index;
            index = this.columns;
          }
          checkColumnIndex(this, index, true);
          array = checkColumnVector(this, array);
          for (let i = 0; i < this.rows; i++) {
            const newRow = new Float64Array(this.columns + 1);
            let j = 0;
            for (; j < index; j++) {
              newRow[j] = this.data[i][j];
            }
            newRow[j++] = array[i];
            for (; j < this.columns + 1; j++) {
              newRow[j] = this.data[i][j - 1];
            }
            this.data[i] = newRow;
          }
          this.columns += 1;
          return this;
        }
      };
      installMathOperations(AbstractMatrix2, Matrix2);
      var SymmetricMatrix2 = class _SymmetricMatrix extends AbstractMatrix2 {
        /** @type {Matrix} */
        #matrix;
        get size() {
          return this.#matrix.size;
        }
        get rows() {
          return this.#matrix.rows;
        }
        get columns() {
          return this.#matrix.columns;
        }
        get diagonalSize() {
          return this.rows;
        }
        /**
         * not the same as matrix.isSymmetric()
         * Here is to check if it's instanceof SymmetricMatrix without bundling issues
         *
         * @param value
         * @returns {boolean}
         */
        static isSymmetricMatrix(value) {
          return Matrix2.isMatrix(value) && value.klassType === "SymmetricMatrix";
        }
        /**
         * @param diagonalSize
         * @return {SymmetricMatrix}
         */
        static zeros(diagonalSize) {
          return new this(diagonalSize);
        }
        /**
         * @param diagonalSize
         * @return {SymmetricMatrix}
         */
        static ones(diagonalSize) {
          return new this(diagonalSize).fill(1);
        }
        /**
         * @param {number | AbstractMatrix | ArrayLike<ArrayLike<number>>} diagonalSize
         * @return {this}
         */
        constructor(diagonalSize) {
          super();
          if (Matrix2.isMatrix(diagonalSize)) {
            if (!diagonalSize.isSymmetric()) {
              throw new TypeError("not symmetric data");
            }
            this.#matrix = Matrix2.copy(
              diagonalSize,
              new Matrix2(diagonalSize.rows, diagonalSize.rows)
            );
          } else if (Number.isInteger(diagonalSize) && diagonalSize >= 0) {
            this.#matrix = new Matrix2(diagonalSize, diagonalSize);
          } else {
            this.#matrix = new Matrix2(diagonalSize);
            if (!this.isSymmetric()) {
              throw new TypeError("not symmetric data");
            }
          }
        }
        clone() {
          const matrix2 = new _SymmetricMatrix(this.diagonalSize);
          for (const [row, col, value] of this.upperRightEntries()) {
            matrix2.set(row, col, value);
          }
          return matrix2;
        }
        toMatrix() {
          return new Matrix2(this);
        }
        get(rowIndex, columnIndex) {
          return this.#matrix.get(rowIndex, columnIndex);
        }
        set(rowIndex, columnIndex, value) {
          this.#matrix.set(rowIndex, columnIndex, value);
          this.#matrix.set(columnIndex, rowIndex, value);
          return this;
        }
        removeCross(index) {
          this.#matrix.removeRow(index);
          this.#matrix.removeColumn(index);
          return this;
        }
        addCross(index, array) {
          if (array === void 0) {
            array = index;
            index = this.diagonalSize;
          }
          const row = array.slice();
          row.splice(index, 1);
          this.#matrix.addRow(index, row);
          this.#matrix.addColumn(index, array);
          return this;
        }
        /**
         * @param {Mask[]} mask
         */
        applyMask(mask) {
          if (mask.length !== this.diagonalSize) {
            throw new RangeError("Mask size do not match with matrix size");
          }
          const sidesToRemove = [];
          for (const [index, passthroughs] of mask.entries()) {
            if (passthroughs) continue;
            sidesToRemove.push(index);
          }
          sidesToRemove.reverse();
          for (const sideIndex of sidesToRemove) {
            this.removeCross(sideIndex);
          }
          return this;
        }
        /**
         * Compact format upper-right corner of matrix
         * iterate from left to right, from top to bottom.
         *
         * ```
         *   A B C D
         * A 1 2 3 4
         * B 2 5 6 7
         * C 3 6 8 9
         * D 4 7 9 10
         * ```
         *
         * will return compact 1D array `[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]`
         *
         * length is S(i=0, n=sideSize) => 10 for a 4 sideSized matrix
         *
         * @returns {number[]}
         */
        toCompact() {
          const { diagonalSize } = this;
          const compact = new Array(diagonalSize * (diagonalSize + 1) / 2);
          for (let col = 0, row = 0, index = 0; index < compact.length; index++) {
            compact[index] = this.get(row, col);
            if (++col >= diagonalSize) col = ++row;
          }
          return compact;
        }
        /**
         * @param {number[]} compact
         * @return {SymmetricMatrix}
         */
        static fromCompact(compact) {
          const compactSize = compact.length;
          const diagonalSize = (Math.sqrt(8 * compactSize + 1) - 1) / 2;
          if (!Number.isInteger(diagonalSize)) {
            throw new TypeError(
              `This array is not a compact representation of a Symmetric Matrix, ${JSON.stringify(
                compact
              )}`
            );
          }
          const matrix2 = new _SymmetricMatrix(diagonalSize);
          for (let col = 0, row = 0, index = 0; index < compactSize; index++) {
            matrix2.set(col, row, compact[index]);
            if (++col >= diagonalSize) col = ++row;
          }
          return matrix2;
        }
        /**
         * half iterator upper-right-corner from left to right, from top to bottom
         * yield [row, column, value]
         *
         * @returns {Generator<[number, number, number], void, void>}
         */
        *upperRightEntries() {
          for (let row = 0, col = 0; row < this.diagonalSize; void 0) {
            const value = this.get(row, col);
            yield [row, col, value];
            if (++col >= this.diagonalSize) col = ++row;
          }
        }
        /**
         * half iterator upper-right-corner from left to right, from top to bottom
         * yield value
         *
         * @returns {Generator<[number, number, number], void, void>}
         */
        *upperRightValues() {
          for (let row = 0, col = 0; row < this.diagonalSize; void 0) {
            const value = this.get(row, col);
            yield value;
            if (++col >= this.diagonalSize) col = ++row;
          }
        }
      };
      SymmetricMatrix2.prototype.klassType = "SymmetricMatrix";
      var DistanceMatrix2 = class _DistanceMatrix extends SymmetricMatrix2 {
        /**
         * not the same as matrix.isSymmetric()
         * Here is to check if it's instanceof SymmetricMatrix without bundling issues
         *
         * @param value
         * @returns {boolean}
         */
        static isDistanceMatrix(value) {
          return SymmetricMatrix2.isSymmetricMatrix(value) && value.klassSubType === "DistanceMatrix";
        }
        constructor(sideSize) {
          super(sideSize);
          if (!this.isDistance()) {
            throw new TypeError("Provided arguments do no produce a distance matrix");
          }
        }
        set(rowIndex, columnIndex, value) {
          if (rowIndex === columnIndex) value = 0;
          return super.set(rowIndex, columnIndex, value);
        }
        addCross(index, array) {
          if (array === void 0) {
            array = index;
            index = this.diagonalSize;
          }
          array = array.slice();
          array[index] = 0;
          return super.addCross(index, array);
        }
        toSymmetricMatrix() {
          return new SymmetricMatrix2(this);
        }
        clone() {
          const matrix2 = new _DistanceMatrix(this.diagonalSize);
          for (const [row, col, value] of this.upperRightEntries()) {
            if (row === col) continue;
            matrix2.set(row, col, value);
          }
          return matrix2;
        }
        /**
         * Compact format upper-right corner of matrix
         * no diagonal (only zeros)
         * iterable from left to right, from top to bottom.
         *
         * ```
         *   A B C D
         * A 0 1 2 3
         * B 1 0 4 5
         * C 2 4 0 6
         * D 3 5 6 0
         * ```
         *
         * will return compact 1D array `[1, 2, 3, 4, 5, 6]`
         *
         * length is S(i=0, n=sideSize-1) => 6 for a 4 side sized matrix
         *
         * @returns {number[]}
         */
        toCompact() {
          const { diagonalSize } = this;
          const compactLength = (diagonalSize - 1) * diagonalSize / 2;
          const compact = new Array(compactLength);
          for (let col = 1, row = 0, index = 0; index < compact.length; index++) {
            compact[index] = this.get(row, col);
            if (++col >= diagonalSize) col = ++row + 1;
          }
          return compact;
        }
        /**
         * @param {number[]} compact
         */
        static fromCompact(compact) {
          const compactSize = compact.length;
          if (compactSize === 0) {
            return new this(0);
          }
          const diagonalSize = (Math.sqrt(8 * compactSize + 1) + 1) / 2;
          if (!Number.isInteger(diagonalSize)) {
            throw new TypeError(
              `This array is not a compact representation of a DistanceMatrix, ${JSON.stringify(
                compact
              )}`
            );
          }
          const matrix2 = new this(diagonalSize);
          for (let col = 1, row = 0, index = 0; index < compactSize; index++) {
            matrix2.set(col, row, compact[index]);
            if (++col >= diagonalSize) col = ++row + 1;
          }
          return matrix2;
        }
      };
      DistanceMatrix2.prototype.klassSubType = "DistanceMatrix";
      var BaseView = class extends AbstractMatrix2 {
        constructor(matrix2, rows, columns) {
          super();
          this.matrix = matrix2;
          this.rows = rows;
          this.columns = columns;
        }
      };
      var MatrixColumnView2 = class extends BaseView {
        constructor(matrix2, column) {
          checkColumnIndex(matrix2, column);
          super(matrix2, matrix2.rows, 1);
          this.column = column;
        }
        set(rowIndex, columnIndex, value) {
          this.matrix.set(rowIndex, this.column, value);
          return this;
        }
        get(rowIndex) {
          return this.matrix.get(rowIndex, this.column);
        }
      };
      var MatrixColumnSelectionView2 = class extends BaseView {
        constructor(matrix2, columnIndices) {
          checkColumnIndices(matrix2, columnIndices);
          super(matrix2, matrix2.rows, columnIndices.length);
          this.columnIndices = columnIndices;
        }
        set(rowIndex, columnIndex, value) {
          this.matrix.set(rowIndex, this.columnIndices[columnIndex], value);
          return this;
        }
        get(rowIndex, columnIndex) {
          return this.matrix.get(rowIndex, this.columnIndices[columnIndex]);
        }
      };
      var MatrixFlipColumnView2 = class extends BaseView {
        constructor(matrix2) {
          super(matrix2, matrix2.rows, matrix2.columns);
        }
        set(rowIndex, columnIndex, value) {
          this.matrix.set(rowIndex, this.columns - columnIndex - 1, value);
          return this;
        }
        get(rowIndex, columnIndex) {
          return this.matrix.get(rowIndex, this.columns - columnIndex - 1);
        }
      };
      var MatrixFlipRowView2 = class extends BaseView {
        constructor(matrix2) {
          super(matrix2, matrix2.rows, matrix2.columns);
        }
        set(rowIndex, columnIndex, value) {
          this.matrix.set(this.rows - rowIndex - 1, columnIndex, value);
          return this;
        }
        get(rowIndex, columnIndex) {
          return this.matrix.get(this.rows - rowIndex - 1, columnIndex);
        }
      };
      var MatrixRowView2 = class extends BaseView {
        constructor(matrix2, row) {
          checkRowIndex(matrix2, row);
          super(matrix2, 1, matrix2.columns);
          this.row = row;
        }
        set(rowIndex, columnIndex, value) {
          this.matrix.set(this.row, columnIndex, value);
          return this;
        }
        get(rowIndex, columnIndex) {
          return this.matrix.get(this.row, columnIndex);
        }
      };
      var MatrixRowSelectionView2 = class extends BaseView {
        constructor(matrix2, rowIndices) {
          checkRowIndices(matrix2, rowIndices);
          super(matrix2, rowIndices.length, matrix2.columns);
          this.rowIndices = rowIndices;
        }
        set(rowIndex, columnIndex, value) {
          this.matrix.set(this.rowIndices[rowIndex], columnIndex, value);
          return this;
        }
        get(rowIndex, columnIndex) {
          return this.matrix.get(this.rowIndices[rowIndex], columnIndex);
        }
      };
      var MatrixSelectionView2 = class extends BaseView {
        constructor(matrix2, rowIndices, columnIndices) {
          checkRowIndices(matrix2, rowIndices);
          checkColumnIndices(matrix2, columnIndices);
          super(matrix2, rowIndices.length, columnIndices.length);
          this.rowIndices = rowIndices;
          this.columnIndices = columnIndices;
        }
        set(rowIndex, columnIndex, value) {
          this.matrix.set(
            this.rowIndices[rowIndex],
            this.columnIndices[columnIndex],
            value
          );
          return this;
        }
        get(rowIndex, columnIndex) {
          return this.matrix.get(
            this.rowIndices[rowIndex],
            this.columnIndices[columnIndex]
          );
        }
      };
      var MatrixSubView2 = class extends BaseView {
        constructor(matrix2, startRow, endRow, startColumn, endColumn) {
          checkRange(matrix2, startRow, endRow, startColumn, endColumn);
          super(matrix2, endRow - startRow + 1, endColumn - startColumn + 1);
          this.startRow = startRow;
          this.startColumn = startColumn;
        }
        set(rowIndex, columnIndex, value) {
          this.matrix.set(
            this.startRow + rowIndex,
            this.startColumn + columnIndex,
            value
          );
          return this;
        }
        get(rowIndex, columnIndex) {
          return this.matrix.get(
            this.startRow + rowIndex,
            this.startColumn + columnIndex
          );
        }
      };
      var MatrixTransposeView2 = class extends BaseView {
        constructor(matrix2) {
          super(matrix2, matrix2.columns, matrix2.rows);
        }
        set(rowIndex, columnIndex, value) {
          this.matrix.set(columnIndex, rowIndex, value);
          return this;
        }
        get(rowIndex, columnIndex) {
          return this.matrix.get(columnIndex, rowIndex);
        }
      };
      var WrapperMatrix1D2 = class extends AbstractMatrix2 {
        constructor(data, options = {}) {
          const { rows = 1 } = options;
          if (data.length % rows !== 0) {
            throw new Error("the data length is not divisible by the number of rows");
          }
          super();
          this.rows = rows;
          this.columns = data.length / rows;
          this.data = data;
        }
        set(rowIndex, columnIndex, value) {
          let index = this._calculateIndex(rowIndex, columnIndex);
          this.data[index] = value;
          return this;
        }
        get(rowIndex, columnIndex) {
          let index = this._calculateIndex(rowIndex, columnIndex);
          return this.data[index];
        }
        _calculateIndex(row, column) {
          return row * this.columns + column;
        }
      };
      var WrapperMatrix2D2 = class extends AbstractMatrix2 {
        constructor(data) {
          super();
          this.data = data;
          this.rows = data.length;
          this.columns = data[0].length;
        }
        set(rowIndex, columnIndex, value) {
          this.data[rowIndex][columnIndex] = value;
          return this;
        }
        get(rowIndex, columnIndex) {
          return this.data[rowIndex][columnIndex];
        }
      };
      function wrap2(array, options) {
        if (isAnyArray(array)) {
          if (array[0] && isAnyArray(array[0])) {
            return new WrapperMatrix2D2(array);
          } else {
            return new WrapperMatrix1D2(array, options);
          }
        } else {
          throw new Error("the argument is not an array");
        }
      }
      var LuDecomposition2 = class {
        constructor(matrix2) {
          matrix2 = WrapperMatrix2D2.checkMatrix(matrix2);
          let lu = matrix2.clone();
          let rows = lu.rows;
          let columns = lu.columns;
          let pivotVector = new Float64Array(rows);
          let pivotSign = 1;
          let i, j, k, p, s, t, v;
          let LUcolj, kmax;
          for (i = 0; i < rows; i++) {
            pivotVector[i] = i;
          }
          LUcolj = new Float64Array(rows);
          for (j = 0; j < columns; j++) {
            for (i = 0; i < rows; i++) {
              LUcolj[i] = lu.get(i, j);
            }
            for (i = 0; i < rows; i++) {
              kmax = Math.min(i, j);
              s = 0;
              for (k = 0; k < kmax; k++) {
                s += lu.get(i, k) * LUcolj[k];
              }
              LUcolj[i] -= s;
              lu.set(i, j, LUcolj[i]);
            }
            p = j;
            for (i = j + 1; i < rows; i++) {
              if (Math.abs(LUcolj[i]) > Math.abs(LUcolj[p])) {
                p = i;
              }
            }
            if (p !== j) {
              for (k = 0; k < columns; k++) {
                t = lu.get(p, k);
                lu.set(p, k, lu.get(j, k));
                lu.set(j, k, t);
              }
              v = pivotVector[p];
              pivotVector[p] = pivotVector[j];
              pivotVector[j] = v;
              pivotSign = -pivotSign;
            }
            if (j < rows && lu.get(j, j) !== 0) {
              for (i = j + 1; i < rows; i++) {
                lu.set(i, j, lu.get(i, j) / lu.get(j, j));
              }
            }
          }
          this.LU = lu;
          this.pivotVector = pivotVector;
          this.pivotSign = pivotSign;
        }
        isSingular() {
          let data = this.LU;
          let col = data.columns;
          for (let j = 0; j < col; j++) {
            if (data.get(j, j) === 0) {
              return true;
            }
          }
          return false;
        }
        solve(value) {
          value = Matrix2.checkMatrix(value);
          let lu = this.LU;
          let rows = lu.rows;
          if (rows !== value.rows) {
            throw new Error("Invalid matrix dimensions");
          }
          if (this.isSingular()) {
            throw new Error("LU matrix is singular");
          }
          let count = value.columns;
          let X = value.subMatrixRow(this.pivotVector, 0, count - 1);
          let columns = lu.columns;
          let i, j, k;
          for (k = 0; k < columns; k++) {
            for (i = k + 1; i < columns; i++) {
              for (j = 0; j < count; j++) {
                X.set(i, j, X.get(i, j) - X.get(k, j) * lu.get(i, k));
              }
            }
          }
          for (k = columns - 1; k >= 0; k--) {
            for (j = 0; j < count; j++) {
              X.set(k, j, X.get(k, j) / lu.get(k, k));
            }
            for (i = 0; i < k; i++) {
              for (j = 0; j < count; j++) {
                X.set(i, j, X.get(i, j) - X.get(k, j) * lu.get(i, k));
              }
            }
          }
          return X;
        }
        get determinant() {
          let data = this.LU;
          if (!data.isSquare()) {
            throw new Error("Matrix must be square");
          }
          let determinant3 = this.pivotSign;
          let col = data.columns;
          for (let j = 0; j < col; j++) {
            determinant3 *= data.get(j, j);
          }
          return determinant3;
        }
        get lowerTriangularMatrix() {
          let data = this.LU;
          let rows = data.rows;
          let columns = data.columns;
          let X = new Matrix2(rows, columns);
          for (let i = 0; i < rows; i++) {
            for (let j = 0; j < columns; j++) {
              if (i > j) {
                X.set(i, j, data.get(i, j));
              } else if (i === j) {
                X.set(i, j, 1);
              } else {
                X.set(i, j, 0);
              }
            }
          }
          return X;
        }
        get upperTriangularMatrix() {
          let data = this.LU;
          let rows = data.rows;
          let columns = data.columns;
          let X = new Matrix2(rows, columns);
          for (let i = 0; i < rows; i++) {
            for (let j = 0; j < columns; j++) {
              if (i <= j) {
                X.set(i, j, data.get(i, j));
              } else {
                X.set(i, j, 0);
              }
            }
          }
          return X;
        }
        get pivotPermutationVector() {
          return Array.from(this.pivotVector);
        }
      };
      function transposeSquareInPlace(matrix2) {
        const data = matrix2.data;
        const n = matrix2.rows;
        for (let i = 0; i < n; i++) {
          const rowI = data[i];
          for (let j = i + 1; j < n; j++) {
            const tmp = rowI[j];
            rowI[j] = data[j][i];
            data[j][i] = tmp;
          }
        }
        return matrix2;
      }
      function hypotenuse(a, b) {
        let r = 0;
        if (Math.abs(a) > Math.abs(b)) {
          r = b / a;
          return Math.abs(a) * Math.sqrt(1 + r * r);
        }
        if (b !== 0) {
          r = a / b;
          return Math.abs(b) * Math.sqrt(1 + r * r);
        }
        return 0;
      }
      var QrDecomposition2 = class {
        constructor(value) {
          value = WrapperMatrix2D2.checkMatrix(value);
          let qr = value.clone();
          let m = value.rows;
          let n = value.columns;
          let rdiag = new Float64Array(n);
          let i, j, k, s;
          for (k = 0; k < n; k++) {
            let nrm = 0;
            for (i = k; i < m; i++) {
              nrm = hypotenuse(nrm, qr.get(i, k));
            }
            if (nrm !== 0) {
              if (qr.get(k, k) < 0) {
                nrm = -nrm;
              }
              for (i = k; i < m; i++) {
                qr.set(i, k, qr.get(i, k) / nrm);
              }
              qr.set(k, k, qr.get(k, k) + 1);
              for (j = k + 1; j < n; j++) {
                s = 0;
                for (i = k; i < m; i++) {
                  s += qr.get(i, k) * qr.get(i, j);
                }
                s = -s / qr.get(k, k);
                for (i = k; i < m; i++) {
                  qr.set(i, j, qr.get(i, j) + s * qr.get(i, k));
                }
              }
            }
            rdiag[k] = -nrm;
          }
          this.QR = qr;
          this.Rdiag = rdiag;
        }
        solve(value) {
          value = Matrix2.checkMatrix(value);
          let qr = this.QR;
          let m = qr.rows;
          if (value.rows !== m) {
            throw new Error("Matrix row dimensions must agree");
          }
          if (!this.isFullRank()) {
            throw new Error("Matrix is rank deficient");
          }
          let count = value.columns;
          let X = value.clone();
          let n = qr.columns;
          let i, j, k, s;
          for (k = 0; k < n; k++) {
            for (j = 0; j < count; j++) {
              s = 0;
              for (i = k; i < m; i++) {
                s += qr.get(i, k) * X.get(i, j);
              }
              s = -s / qr.get(k, k);
              for (i = k; i < m; i++) {
                X.set(i, j, X.get(i, j) + s * qr.get(i, k));
              }
            }
          }
          for (k = n - 1; k >= 0; k--) {
            for (j = 0; j < count; j++) {
              X.set(k, j, X.get(k, j) / this.Rdiag[k]);
            }
            for (i = 0; i < k; i++) {
              for (j = 0; j < count; j++) {
                X.set(i, j, X.get(i, j) - X.get(k, j) * qr.get(i, k));
              }
            }
          }
          return X.subMatrix(0, n - 1, 0, count - 1);
        }
        isFullRank() {
          let columns = this.QR.columns;
          for (let i = 0; i < columns; i++) {
            if (this.Rdiag[i] === 0) {
              return false;
            }
          }
          return true;
        }
        get upperTriangularMatrix() {
          let qr = this.QR;
          let n = qr.columns;
          let X = new Matrix2(n, n);
          let i, j;
          for (i = 0; i < n; i++) {
            for (j = 0; j < n; j++) {
              if (i < j) {
                X.set(i, j, qr.get(i, j));
              } else if (i === j) {
                X.set(i, j, this.Rdiag[i]);
              } else {
                X.set(i, j, 0);
              }
            }
          }
          return X;
        }
        get orthogonalMatrix() {
          let qr = this.QR;
          let rows = qr.rows;
          let columns = qr.columns;
          let X = new Matrix2(rows, columns);
          let i, j, k, s;
          for (k = columns - 1; k >= 0; k--) {
            for (i = 0; i < rows; i++) {
              X.set(i, k, 0);
            }
            X.set(k, k, 1);
            for (j = k; j < columns; j++) {
              if (qr.get(k, k) !== 0) {
                s = 0;
                for (i = k; i < rows; i++) {
                  s += qr.get(i, k) * X.get(i, j);
                }
                s = -s / qr.get(k, k);
                for (i = k; i < rows; i++) {
                  X.set(i, j, X.get(i, j) + s * qr.get(i, k));
                }
              }
            }
          }
          return X;
        }
      };
      var SingularValueDecomposition3 = class {
        constructor(value, options = {}) {
          value = WrapperMatrix2D2.checkMatrix(value);
          if (value.isEmpty()) {
            throw new Error("Matrix must be non-empty");
          }
          let m = value.rows;
          let n = value.columns;
          const {
            computeLeftSingularVectors = true,
            computeRightSingularVectors = true,
            autoTranspose = false
          } = options;
          let wantu = Boolean(computeLeftSingularVectors);
          let wantv = Boolean(computeRightSingularVectors);
          let swapped = false;
          let at;
          if (m < n) {
            if (!autoTranspose) {
              console.warn(
                "Computing SVD on a matrix with more columns than rows. Consider enabling autoTranspose"
              );
              at = value.transpose();
            } else {
              at = value.clone();
              m = value.columns;
              n = value.rows;
              swapped = true;
              let aux = wantu;
              wantu = wantv;
              wantv = aux;
            }
          } else {
            at = value.transpose();
          }
          let nu = Math.min(m, n);
          let ni = Math.min(m + 1, n);
          let s = new Float64Array(ni);
          let U = new Matrix2(nu, m);
          let V = new Matrix2(n, n);
          let e = new Float64Array(n);
          let work = new Float64Array(m);
          let si = new Float64Array(ni);
          for (let i = 0; i < ni; i++) si[i] = i;
          let nct = Math.min(m - 1, n);
          let nrt = Math.max(0, Math.min(n - 2, m));
          let mrc = Math.max(nct, nrt);
          for (let k = 0; k < mrc; k++) {
            if (k < nct) {
              s[k] = 0;
              for (let i = k; i < m; i++) {
                s[k] = hypotenuse(s[k], at.get(k, i));
              }
              if (s[k] !== 0) {
                if (at.get(k, k) < 0) {
                  s[k] = -s[k];
                }
                for (let i = k; i < m; i++) {
                  at.set(k, i, at.get(k, i) / s[k]);
                }
                at.set(k, k, at.get(k, k) + 1);
              }
              s[k] = -s[k];
            }
            for (let j = k + 1; j < n; j++) {
              if (k < nct && s[k] !== 0) {
                let t = 0;
                for (let i = k; i < m; i++) {
                  t += at.get(k, i) * at.get(j, i);
                }
                t = -t / at.get(k, k);
                for (let i = k; i < m; i++) {
                  at.set(j, i, at.get(j, i) + t * at.get(k, i));
                }
              }
              e[j] = at.get(j, k);
            }
            if (wantu && k < nct) {
              for (let i = k; i < m; i++) {
                U.set(k, i, at.get(k, i));
              }
            }
            if (k < nrt) {
              e[k] = 0;
              for (let i = k + 1; i < n; i++) {
                e[k] = hypotenuse(e[k], e[i]);
              }
              if (e[k] !== 0) {
                if (e[k + 1] < 0) {
                  e[k] = 0 - e[k];
                }
                for (let i = k + 1; i < n; i++) {
                  e[i] /= e[k];
                }
                e[k + 1] += 1;
              }
              e[k] = -e[k];
              if (k + 1 < m && e[k] !== 0) {
                for (let i = k + 1; i < m; i++) {
                  work[i] = 0;
                }
                for (let i = k + 1; i < m; i++) {
                  for (let j = k + 1; j < n; j++) {
                    work[i] += e[j] * at.get(j, i);
                  }
                }
                for (let j = k + 1; j < n; j++) {
                  let t = -e[j] / e[k + 1];
                  for (let i = k + 1; i < m; i++) {
                    at.set(j, i, at.get(j, i) + t * work[i]);
                  }
                }
              }
              if (wantv) {
                for (let i = k + 1; i < n; i++) {
                  V.set(k, i, e[i]);
                }
              }
            }
          }
          let p = Math.min(n, m + 1);
          if (nct < n) {
            s[nct] = at.get(nct, nct);
          }
          if (m < p) {
            s[p - 1] = 0;
          }
          if (nrt + 1 < p) {
            e[nrt] = at.get(p - 1, nrt);
          }
          e[p - 1] = 0;
          if (wantu) {
            for (let j = nct; j < nu; j++) {
              for (let i = 0; i < m; i++) {
                U.set(j, i, 0);
              }
              U.set(j, j, 1);
            }
            for (let k = nct - 1; k >= 0; k--) {
              if (s[k] !== 0) {
                for (let j = k + 1; j < nu; j++) {
                  let t = 0;
                  for (let i = k; i < m; i++) {
                    t += U.get(k, i) * U.get(j, i);
                  }
                  t = -t / U.get(k, k);
                  for (let i = k; i < m; i++) {
                    U.set(j, i, U.get(j, i) + t * U.get(k, i));
                  }
                }
                for (let i = k; i < m; i++) {
                  U.set(k, i, -U.get(k, i));
                }
                U.set(k, k, 1 + U.get(k, k));
                for (let i = 0; i < k - 1; i++) {
                  U.set(k, i, 0);
                }
              } else {
                for (let i = 0; i < m; i++) {
                  U.set(k, i, 0);
                }
                U.set(k, k, 1);
              }
            }
          }
          if (wantv) {
            for (let k = n - 1; k >= 0; k--) {
              if (k < nrt && e[k] !== 0) {
                for (let j = k + 1; j < n; j++) {
                  let t = 0;
                  for (let i = k + 1; i < n; i++) {
                    t += V.get(k, i) * V.get(j, i);
                  }
                  t = -t / V.get(k, k + 1);
                  for (let i = k + 1; i < n; i++) {
                    V.set(j, i, V.get(j, i) + t * V.get(k, i));
                  }
                }
              }
              for (let i = 0; i < n; i++) {
                V.set(k, i, 0);
              }
              V.set(k, k, 1);
            }
          }
          let pp = p - 1;
          let eps = Number.EPSILON;
          while (p > 0) {
            let k, kase;
            for (k = p - 2; k >= -1; k--) {
              if (k === -1) {
                break;
              }
              const alpha = Number.MIN_VALUE + eps * Math.abs(s[k] + Math.abs(s[k + 1]));
              if (Math.abs(e[k]) <= alpha || Number.isNaN(e[k])) {
                e[k] = 0;
                break;
              }
            }
            if (k === p - 2) {
              kase = 4;
            } else {
              let ks;
              for (ks = p - 1; ks >= k; ks--) {
                if (ks === k) {
                  break;
                }
                let t = (ks !== p ? Math.abs(e[ks]) : 0) + (ks !== k + 1 ? Math.abs(e[ks - 1]) : 0);
                if (Math.abs(s[ks]) <= eps * t) {
                  s[ks] = 0;
                  break;
                }
              }
              if (ks === k) {
                kase = 3;
              } else if (ks === p - 1) {
                kase = 1;
              } else {
                kase = 2;
                k = ks;
              }
            }
            k++;
            switch (kase) {
              case 1: {
                let f = e[p - 2];
                e[p - 2] = 0;
                for (let j = p - 2; j >= k; j--) {
                  let t = hypotenuse(s[j], f);
                  let cs = s[j] / t;
                  let sn = f / t;
                  s[j] = t;
                  if (j !== k) {
                    f = -sn * e[j - 1];
                    e[j - 1] = cs * e[j - 1];
                  }
                  if (wantv) {
                    for (let i = 0; i < n; i++) {
                      t = cs * V.get(j, i) + sn * V.get(p - 1, i);
                      V.set(p - 1, i, -sn * V.get(j, i) + cs * V.get(p - 1, i));
                      V.set(j, i, t);
                    }
                  }
                }
                break;
              }
              case 2: {
                let f = e[k - 1];
                e[k - 1] = 0;
                for (let j = k; j < p; j++) {
                  let t = hypotenuse(s[j], f);
                  let cs = s[j] / t;
                  let sn = f / t;
                  s[j] = t;
                  f = -sn * e[j];
                  e[j] = cs * e[j];
                  if (wantu) {
                    for (let i = 0; i < m; i++) {
                      t = cs * U.get(j, i) + sn * U.get(k - 1, i);
                      U.set(k - 1, i, -sn * U.get(j, i) + cs * U.get(k - 1, i));
                      U.set(j, i, t);
                    }
                  }
                }
                break;
              }
              case 3: {
                const scale = Math.max(
                  Math.abs(s[p - 1]),
                  Math.abs(s[p - 2]),
                  Math.abs(e[p - 2]),
                  Math.abs(s[k]),
                  Math.abs(e[k])
                );
                const sp = s[p - 1] / scale;
                const spm1 = s[p - 2] / scale;
                const epm1 = e[p - 2] / scale;
                const sk = s[k] / scale;
                const ek = e[k] / scale;
                const b = ((spm1 + sp) * (spm1 - sp) + epm1 * epm1) / 2;
                const c = sp * epm1 * (sp * epm1);
                let shift = 0;
                if (b !== 0 || c !== 0) {
                  if (b < 0) {
                    shift = 0 - Math.sqrt(b * b + c);
                  } else {
                    shift = Math.sqrt(b * b + c);
                  }
                  shift = c / (b + shift);
                }
                let f = (sk + sp) * (sk - sp) + shift;
                let g = sk * ek;
                for (let j = k; j < p - 1; j++) {
                  let t = hypotenuse(f, g);
                  if (t === 0) t = Number.MIN_VALUE;
                  let cs = f / t;
                  let sn = g / t;
                  if (j !== k) {
                    e[j - 1] = t;
                  }
                  f = cs * s[j] + sn * e[j];
                  e[j] = cs * e[j] - sn * s[j];
                  g = sn * s[j + 1];
                  s[j + 1] = cs * s[j + 1];
                  if (wantv) {
                    for (let i = 0; i < n; i++) {
                      t = cs * V.get(j, i) + sn * V.get(j + 1, i);
                      V.set(j + 1, i, -sn * V.get(j, i) + cs * V.get(j + 1, i));
                      V.set(j, i, t);
                    }
                  }
                  t = hypotenuse(f, g);
                  if (t === 0) t = Number.MIN_VALUE;
                  cs = f / t;
                  sn = g / t;
                  s[j] = t;
                  f = cs * e[j] + sn * s[j + 1];
                  s[j + 1] = -sn * e[j] + cs * s[j + 1];
                  g = sn * e[j + 1];
                  e[j + 1] = cs * e[j + 1];
                  if (wantu && j < m - 1) {
                    for (let i = 0; i < m; i++) {
                      t = cs * U.get(j, i) + sn * U.get(j + 1, i);
                      U.set(j + 1, i, -sn * U.get(j, i) + cs * U.get(j + 1, i));
                      U.set(j, i, t);
                    }
                  }
                }
                e[p - 2] = f;
                break;
              }
              case 4: {
                if (s[k] <= 0) {
                  s[k] = s[k] < 0 ? -s[k] : 0;
                  if (wantv) {
                    for (let i = 0; i <= pp; i++) {
                      V.set(k, i, -V.get(k, i));
                    }
                  }
                }
                while (k < pp) {
                  if (s[k] >= s[k + 1]) {
                    break;
                  }
                  let t = s[k];
                  s[k] = s[k + 1];
                  s[k + 1] = t;
                  if (wantv && k < n - 1) {
                    for (let i = 0; i < n; i++) {
                      t = V.get(k + 1, i);
                      V.set(k + 1, i, V.get(k, i));
                      V.set(k, i, t);
                    }
                  }
                  if (wantu && k < m - 1) {
                    for (let i = 0; i < m; i++) {
                      t = U.get(k + 1, i);
                      U.set(k + 1, i, U.get(k, i));
                      U.set(k, i, t);
                    }
                  }
                  k++;
                }
                p--;
                break;
              }
            }
          }
          U = U.isSquare() ? transposeSquareInPlace(U) : U.transpose();
          V = transposeSquareInPlace(V);
          if (swapped) {
            let tmp = V;
            V = U;
            U = tmp;
          }
          this.m = m;
          this.n = n;
          this.s = s;
          this.U = U;
          this.V = V;
        }
        solve(value) {
          let Y = value;
          let e = this.threshold;
          let scols = this.s.length;
          let Ls = Matrix2.zeros(scols, scols);
          for (let i = 0; i < scols; i++) {
            if (Math.abs(this.s[i]) <= e) {
              Ls.set(i, i, 0);
            } else {
              Ls.set(i, i, 1 / this.s[i]);
            }
          }
          let U = this.U;
          let V = this.rightSingularVectors;
          let VL = V.mmul(Ls);
          let vrows = V.rows;
          let urows = U.rows;
          let VLU = Matrix2.zeros(vrows, urows);
          for (let i = 0; i < vrows; i++) {
            for (let j = 0; j < urows; j++) {
              let sum = 0;
              for (let k = 0; k < scols; k++) {
                sum += VL.get(i, k) * U.get(j, k);
              }
              VLU.set(i, j, sum);
            }
          }
          return VLU.mmul(Y);
        }
        solveForDiagonal(value) {
          return this.solve(Matrix2.diag(value));
        }
        inverse() {
          let V = this.V;
          let e = this.threshold;
          let vrows = V.rows;
          let vcols = V.columns;
          let X = new Matrix2(vrows, this.s.length);
          for (let i = 0; i < vrows; i++) {
            for (let j = 0; j < vcols; j++) {
              if (Math.abs(this.s[j]) > e) {
                X.set(i, j, V.get(i, j) / this.s[j]);
              }
            }
          }
          let U = this.U;
          let urows = U.rows;
          let ucols = U.columns;
          let Y = new Matrix2(vrows, urows);
          for (let i = 0; i < vrows; i++) {
            for (let j = 0; j < urows; j++) {
              let sum = 0;
              for (let k = 0; k < ucols; k++) {
                sum += X.get(i, k) * U.get(j, k);
              }
              Y.set(i, j, sum);
            }
          }
          return Y;
        }
        get condition() {
          return this.s[0] / this.s[Math.min(this.m, this.n) - 1];
        }
        get norm2() {
          return this.s[0];
        }
        get rank() {
          let tol = Math.max(this.m, this.n) * this.s[0] * Number.EPSILON;
          let r = 0;
          let s = this.s;
          for (let i = 0, ii = s.length; i < ii; i++) {
            if (s[i] > tol) {
              r++;
            }
          }
          return r;
        }
        get diagonal() {
          return Array.from(this.s);
        }
        get threshold() {
          return Number.EPSILON / 2 * Math.max(this.m, this.n) * this.s[0];
        }
        get leftSingularVectors() {
          return this.U;
        }
        get rightSingularVectors() {
          return this.V;
        }
        get diagonalMatrix() {
          return Matrix2.diag(this.s);
        }
      };
      function inverse3(matrix2, useSVD = false) {
        matrix2 = WrapperMatrix2D2.checkMatrix(matrix2);
        if (useSVD) {
          return new SingularValueDecomposition3(matrix2).inverse();
        } else {
          return solve2(matrix2, Matrix2.eye(matrix2.rows));
        }
      }
      function solve2(leftHandSide, rightHandSide, useSVD = false) {
        leftHandSide = WrapperMatrix2D2.checkMatrix(leftHandSide);
        rightHandSide = WrapperMatrix2D2.checkMatrix(rightHandSide);
        if (useSVD) {
          return new SingularValueDecomposition3(leftHandSide).solve(rightHandSide);
        } else {
          return leftHandSide.isSquare() ? new LuDecomposition2(leftHandSide).solve(rightHandSide) : new QrDecomposition2(leftHandSide).solve(rightHandSide);
        }
      }
      function determinant2(matrix2) {
        matrix2 = Matrix2.checkMatrix(matrix2);
        if (matrix2.isSquare()) {
          if (matrix2.columns === 0) {
            return 1;
          }
          let a, b, c, d;
          if (matrix2.columns === 2) {
            a = matrix2.get(0, 0);
            b = matrix2.get(0, 1);
            c = matrix2.get(1, 0);
            d = matrix2.get(1, 1);
            return a * d - b * c;
          } else if (matrix2.columns === 3) {
            let subMatrix0, subMatrix1, subMatrix2;
            subMatrix0 = new MatrixSelectionView2(matrix2, [1, 2], [1, 2]);
            subMatrix1 = new MatrixSelectionView2(matrix2, [1, 2], [0, 2]);
            subMatrix2 = new MatrixSelectionView2(matrix2, [1, 2], [0, 1]);
            a = matrix2.get(0, 0);
            b = matrix2.get(0, 1);
            c = matrix2.get(0, 2);
            return a * determinant2(subMatrix0) - b * determinant2(subMatrix1) + c * determinant2(subMatrix2);
          } else {
            return new LuDecomposition2(matrix2).determinant;
          }
        } else {
          throw Error("determinant can only be calculated for a square matrix");
        }
      }
      function xrange(n, exception) {
        let range = [];
        for (let i = 0; i < n; i++) {
          if (i !== exception) {
            range.push(i);
          }
        }
        return range;
      }
      function dependenciesOneRow(error, matrix2, index, thresholdValue = 1e-9, thresholdError = 1e-9) {
        if (error > thresholdError) {
          return new Array(matrix2.rows + 1).fill(0);
        } else {
          let returnArray = matrix2.addRow(index, [0]);
          for (let i = 0; i < returnArray.rows; i++) {
            if (Math.abs(returnArray.get(i, 0)) < thresholdValue) {
              returnArray.set(i, 0, 0);
            }
          }
          return returnArray.to1DArray();
        }
      }
      function linearDependencies2(matrix2, options = {}) {
        const { thresholdValue = 1e-9, thresholdError = 1e-9 } = options;
        matrix2 = Matrix2.checkMatrix(matrix2);
        let n = matrix2.rows;
        let results = new Matrix2(n, n);
        for (let i = 0; i < n; i++) {
          let b = Matrix2.columnVector(matrix2.getRow(i));
          let Abis = matrix2.subMatrixRow(xrange(n, i)).transpose();
          let svd = new SingularValueDecomposition3(Abis);
          let x = svd.solve(b);
          let scale = Matrix2.abs(b).max() || 1;
          let error = Matrix2.sub(b, Abis.mmul(x)).abs().max() / scale;
          results.setRow(
            i,
            dependenciesOneRow(error, x, i, thresholdValue, thresholdError)
          );
        }
        return results;
      }
      function pseudoInverse3(matrix2, threshold = Number.EPSILON) {
        matrix2 = Matrix2.checkMatrix(matrix2);
        if (matrix2.isEmpty()) {
          return matrix2.transpose();
        }
        let svdSolution = new SingularValueDecomposition3(matrix2, { autoTranspose: true });
        let U = svdSolution.leftSingularVectors;
        let V = svdSolution.rightSingularVectors;
        let s = svdSolution.diagonal;
        const cutoff = threshold * Math.max(matrix2.rows, matrix2.columns) * s[0];
        for (let i = 0; i < s.length; i++) {
          if (Math.abs(s[i]) > cutoff) {
            s[i] = 1 / s[i];
          } else {
            s[i] = 0;
          }
        }
        return V.mmul(Matrix2.diag(s).mmul(U.transpose()));
      }
      function covariance2(xMatrix, yMatrix = xMatrix, options = {}) {
        xMatrix = new Matrix2(xMatrix);
        let yIsSame = false;
        if (typeof yMatrix === "object" && !Matrix2.isMatrix(yMatrix) && !isAnyArray(yMatrix)) {
          options = yMatrix;
          yMatrix = xMatrix;
          yIsSame = true;
        } else {
          yMatrix = new Matrix2(yMatrix);
        }
        if (xMatrix.rows !== yMatrix.rows) {
          throw new TypeError("Both matrices must have the same number of rows");
        }
        const { center = true } = options;
        if (center) {
          xMatrix = xMatrix.center("column");
          if (!yIsSame) {
            yMatrix = yMatrix.center("column");
          }
        }
        const cov = xMatrix.transposeMultiply(yMatrix);
        for (let i = 0; i < cov.rows; i++) {
          for (let j = 0; j < cov.columns; j++) {
            cov.set(i, j, cov.get(i, j) * (1 / (xMatrix.rows - 1)));
          }
        }
        return cov;
      }
      function correlation2(xMatrix, yMatrix = xMatrix, options = {}) {
        xMatrix = new Matrix2(xMatrix);
        let yIsSame = false;
        if (typeof yMatrix === "object" && !Matrix2.isMatrix(yMatrix) && !isAnyArray(yMatrix)) {
          options = yMatrix;
          yMatrix = xMatrix;
          yIsSame = true;
        } else {
          yMatrix = new Matrix2(yMatrix);
        }
        if (xMatrix.rows !== yMatrix.rows) {
          throw new TypeError("Both matrices must have the same number of rows");
        }
        const { center = true, scale = true } = options;
        if (center) {
          xMatrix.center("column");
          if (!yIsSame) {
            yMatrix.center("column");
          }
        }
        if (scale) {
          xMatrix.scale("column");
          if (!yIsSame) {
            yMatrix.scale("column");
          }
        }
        const sdx = xMatrix.standardDeviation("column", { unbiased: true });
        const sdy = yIsSame ? sdx : yMatrix.standardDeviation("column", { unbiased: true });
        const corr = xMatrix.transposeMultiply(yMatrix);
        for (let i = 0; i < corr.rows; i++) {
          for (let j = 0; j < corr.columns; j++) {
            corr.set(
              i,
              j,
              corr.get(i, j) * (1 / (sdx[i] * sdy[j])) * (1 / (xMatrix.rows - 1))
            );
          }
        }
        return corr;
      }
      var EigenvalueDecomposition2 = class {
        constructor(matrix2, options = {}) {
          const { assumeSymmetric = false } = options;
          matrix2 = WrapperMatrix2D2.checkMatrix(matrix2);
          if (!matrix2.isSquare()) {
            throw new Error("Matrix is not a square matrix");
          }
          if (matrix2.isEmpty()) {
            throw new Error("Matrix must be non-empty");
          }
          let n = matrix2.columns;
          let V = new Matrix2(n, n);
          let d = new Float64Array(n);
          let e = new Float64Array(n);
          let value = matrix2;
          let i, j;
          let isSymmetric = false;
          if (assumeSymmetric) {
            isSymmetric = true;
          } else {
            isSymmetric = matrix2.isSymmetric();
          }
          if (isSymmetric) {
            for (i = 0; i < n; i++) {
              for (j = 0; j < n; j++) {
                V.set(j, i, value.get(i, j));
              }
            }
            tred2(n, e, d, V);
            tql2(n, e, d, V);
            transposeSquareInPlace(V);
          } else {
            let H = new Matrix2(n, n);
            let ort = new Float64Array(n);
            for (j = 0; j < n; j++) {
              for (i = 0; i < n; i++) {
                H.set(i, j, value.get(i, j));
              }
            }
            orthes(n, H, ort, V);
            hqr2(n, e, d, V, H);
          }
          this.n = n;
          this.e = e;
          this.d = d;
          this.V = V;
        }
        get realEigenvalues() {
          return Array.from(this.d);
        }
        get imaginaryEigenvalues() {
          return Array.from(this.e);
        }
        get eigenvectorMatrix() {
          return this.V;
        }
        get diagonalMatrix() {
          let n = this.n;
          let e = this.e;
          let d = this.d;
          let X = new Matrix2(n, n);
          let i, j;
          for (i = 0; i < n; i++) {
            for (j = 0; j < n; j++) {
              X.set(i, j, 0);
            }
            X.set(i, i, d[i]);
            if (e[i] > 0) {
              X.set(i, i + 1, e[i]);
            } else if (e[i] < 0) {
              X.set(i, i - 1, e[i]);
            }
          }
          return X;
        }
      };
      function tred2(n, e, d, V) {
        let f, g, h, i, j, k, hh, scale;
        for (j = 0; j < n; j++) {
          d[j] = V.get(j, n - 1);
        }
        for (i = n - 1; i > 0; i--) {
          scale = 0;
          h = 0;
          for (k = 0; k < i; k++) {
            scale = scale + Math.abs(d[k]);
          }
          if (scale === 0) {
            e[i] = d[i - 1];
            for (j = 0; j < i; j++) {
              d[j] = V.get(j, i - 1);
              V.set(j, i, 0);
              V.set(i, j, 0);
            }
          } else {
            for (k = 0; k < i; k++) {
              d[k] /= scale;
              h += d[k] * d[k];
            }
            f = d[i - 1];
            g = Math.sqrt(h);
            if (f > 0) {
              g = -g;
            }
            e[i] = scale * g;
            h = h - f * g;
            d[i - 1] = f - g;
            for (j = 0; j < i; j++) {
              e[j] = 0;
            }
            for (j = 0; j < i; j++) {
              f = d[j];
              V.set(i, j, f);
              g = e[j] + V.get(j, j) * f;
              for (k = j + 1; k <= i - 1; k++) {
                g += V.get(j, k) * d[k];
                e[k] += V.get(j, k) * f;
              }
              e[j] = g;
            }
            f = 0;
            for (j = 0; j < i; j++) {
              e[j] /= h;
              f += e[j] * d[j];
            }
            hh = f / (h + h);
            for (j = 0; j < i; j++) {
              e[j] -= hh * d[j];
            }
            for (j = 0; j < i; j++) {
              f = d[j];
              g = e[j];
              for (k = j; k <= i - 1; k++) {
                V.set(j, k, V.get(j, k) - (f * e[k] + g * d[k]));
              }
              d[j] = V.get(j, i - 1);
              V.set(j, i, 0);
            }
          }
          d[i] = h;
        }
        for (i = 0; i < n - 1; i++) {
          V.set(i, n - 1, V.get(i, i));
          V.set(i, i, 1);
          h = d[i + 1];
          if (h !== 0) {
            for (k = 0; k <= i; k++) {
              d[k] = V.get(i + 1, k) / h;
            }
            for (j = 0; j <= i; j++) {
              g = 0;
              for (k = 0; k <= i; k++) {
                g += V.get(i + 1, k) * V.get(j, k);
              }
              for (k = 0; k <= i; k++) {
                V.set(j, k, V.get(j, k) - g * d[k]);
              }
            }
          }
          for (k = 0; k <= i; k++) {
            V.set(i + 1, k, 0);
          }
        }
        for (j = 0; j < n; j++) {
          d[j] = V.get(j, n - 1);
          V.set(j, n - 1, 0);
        }
        V.set(n - 1, n - 1, 1);
        e[0] = 0;
      }
      function tql2(n, e, d, V) {
        let g, h, i, j, k, l, m, p, r, dl1, c, c2, c3, el1, s, s2;
        for (i = 1; i < n; i++) {
          e[i - 1] = e[i];
        }
        e[n - 1] = 0;
        let f = 0;
        let tst1 = 0;
        let eps = Number.EPSILON;
        for (l = 0; l < n; l++) {
          tst1 = Math.max(tst1, Math.abs(d[l]) + Math.abs(e[l]));
          m = l;
          while (m < n) {
            if (Math.abs(e[m]) <= eps * tst1) {
              break;
            }
            m++;
          }
          if (m > l) {
            do {
              g = d[l];
              p = (d[l + 1] - g) / (2 * e[l]);
              r = hypotenuse(p, 1);
              if (p < 0) {
                r = -r;
              }
              d[l] = e[l] / (p + r);
              d[l + 1] = e[l] * (p + r);
              dl1 = d[l + 1];
              h = g - d[l];
              for (i = l + 2; i < n; i++) {
                d[i] -= h;
              }
              f = f + h;
              p = d[m];
              c = 1;
              c2 = c;
              c3 = c;
              el1 = e[l + 1];
              s = 0;
              s2 = 0;
              for (i = m - 1; i >= l; i--) {
                c3 = c2;
                c2 = c;
                s2 = s;
                g = c * e[i];
                h = c * p;
                r = hypotenuse(p, e[i]);
                e[i + 1] = s * r;
                s = e[i] / r;
                c = p / r;
                p = c * d[i] - s * g;
                d[i + 1] = h + s * (c * g + s * d[i]);
                for (k = 0; k < n; k++) {
                  h = V.get(i + 1, k);
                  V.set(i + 1, k, s * V.get(i, k) + c * h);
                  V.set(i, k, c * V.get(i, k) - s * h);
                }
              }
              p = -s * s2 * c3 * el1 * e[l] / dl1;
              e[l] = s * p;
              d[l] = c * p;
            } while (Math.abs(e[l]) > eps * tst1);
          }
          d[l] = d[l] + f;
          e[l] = 0;
        }
        for (i = 0; i < n - 1; i++) {
          k = i;
          p = d[i];
          for (j = i + 1; j < n; j++) {
            if (d[j] < p) {
              k = j;
              p = d[j];
            }
          }
          if (k !== i) {
            d[k] = d[i];
            d[i] = p;
            for (j = 0; j < n; j++) {
              p = V.get(i, j);
              V.set(i, j, V.get(k, j));
              V.set(k, j, p);
            }
          }
        }
      }
      function orthes(n, H, ort, V) {
        let low = 0;
        let high = n - 1;
        let f, g, h, i, j, m;
        let scale;
        for (m = low + 1; m <= high - 1; m++) {
          scale = 0;
          for (i = m; i <= high; i++) {
            scale = scale + Math.abs(H.get(i, m - 1));
          }
          if (scale !== 0) {
            h = 0;
            for (i = high; i >= m; i--) {
              ort[i] = H.get(i, m - 1) / scale;
              h += ort[i] * ort[i];
            }
            g = Math.sqrt(h);
            if (ort[m] > 0) {
              g = -g;
            }
            h = h - ort[m] * g;
            ort[m] = ort[m] - g;
            for (j = m; j < n; j++) {
              f = 0;
              for (i = high; i >= m; i--) {
                f += ort[i] * H.get(i, j);
              }
              f = f / h;
              for (i = m; i <= high; i++) {
                H.set(i, j, H.get(i, j) - f * ort[i]);
              }
            }
            for (i = 0; i <= high; i++) {
              f = 0;
              for (j = high; j >= m; j--) {
                f += ort[j] * H.get(i, j);
              }
              f = f / h;
              for (j = m; j <= high; j++) {
                H.set(i, j, H.get(i, j) - f * ort[j]);
              }
            }
            ort[m] = scale * ort[m];
            H.set(m, m - 1, scale * g);
          }
        }
        for (i = 0; i < n; i++) {
          for (j = 0; j < n; j++) {
            V.set(i, j, i === j ? 1 : 0);
          }
        }
        for (m = high - 1; m >= low + 1; m--) {
          if (H.get(m, m - 1) !== 0) {
            for (i = m + 1; i <= high; i++) {
              ort[i] = H.get(i, m - 1);
            }
            for (j = m; j <= high; j++) {
              g = 0;
              for (i = m; i <= high; i++) {
                g += ort[i] * V.get(i, j);
              }
              g = g / ort[m] / H.get(m, m - 1);
              for (i = m; i <= high; i++) {
                V.set(i, j, V.get(i, j) + g * ort[i]);
              }
            }
          }
        }
      }
      function hqr2(nn, e, d, V, H) {
        let n = nn - 1;
        let low = 0;
        let high = nn - 1;
        let eps = Number.EPSILON;
        let exshift = 0;
        let norm = 0;
        let p = 0;
        let q = 0;
        let r = 0;
        let s = 0;
        let z = 0;
        let iter = 0;
        let i, j, k, l, m, t, w, x, y;
        let ra, sa, vr, vi;
        let notlast, cdivres;
        for (i = 0; i < nn; i++) {
          if (i < low || i > high) {
            d[i] = H.get(i, i);
            e[i] = 0;
          }
          for (j = Math.max(i - 1, 0); j < nn; j++) {
            norm = norm + Math.abs(H.get(i, j));
          }
        }
        while (n >= low) {
          l = n;
          while (l > low) {
            s = Math.abs(H.get(l - 1, l - 1)) + Math.abs(H.get(l, l));
            if (s === 0) {
              s = norm;
            }
            if (Math.abs(H.get(l, l - 1)) < eps * s) {
              break;
            }
            l--;
          }
          if (l === n) {
            H.set(n, n, H.get(n, n) + exshift);
            d[n] = H.get(n, n);
            e[n] = 0;
            n--;
            iter = 0;
          } else if (l === n - 1) {
            w = H.get(n, n - 1) * H.get(n - 1, n);
            p = (H.get(n - 1, n - 1) - H.get(n, n)) / 2;
            q = p * p + w;
            z = Math.sqrt(Math.abs(q));
            H.set(n, n, H.get(n, n) + exshift);
            H.set(n - 1, n - 1, H.get(n - 1, n - 1) + exshift);
            x = H.get(n, n);
            if (q >= 0) {
              z = p >= 0 ? p + z : p - z;
              d[n - 1] = x + z;
              d[n] = d[n - 1];
              if (z !== 0) {
                d[n] = x - w / z;
              }
              e[n - 1] = 0;
              e[n] = 0;
              x = H.get(n, n - 1);
              s = Math.abs(x) + Math.abs(z);
              p = x / s;
              q = z / s;
              r = Math.sqrt(p * p + q * q);
              p = p / r;
              q = q / r;
              for (j = n - 1; j < nn; j++) {
                z = H.get(n - 1, j);
                H.set(n - 1, j, q * z + p * H.get(n, j));
                H.set(n, j, q * H.get(n, j) - p * z);
              }
              for (i = 0; i <= n; i++) {
                z = H.get(i, n - 1);
                H.set(i, n - 1, q * z + p * H.get(i, n));
                H.set(i, n, q * H.get(i, n) - p * z);
              }
              for (i = low; i <= high; i++) {
                z = V.get(i, n - 1);
                V.set(i, n - 1, q * z + p * V.get(i, n));
                V.set(i, n, q * V.get(i, n) - p * z);
              }
            } else {
              d[n - 1] = x + p;
              d[n] = x + p;
              e[n - 1] = z;
              e[n] = -z;
            }
            n = n - 2;
            iter = 0;
          } else {
            x = H.get(n, n);
            y = 0;
            w = 0;
            if (l < n) {
              y = H.get(n - 1, n - 1);
              w = H.get(n, n - 1) * H.get(n - 1, n);
            }
            if (iter === 10) {
              exshift += x;
              for (i = low; i <= n; i++) {
                H.set(i, i, H.get(i, i) - x);
              }
              s = Math.abs(H.get(n, n - 1)) + Math.abs(H.get(n - 1, n - 2));
              x = y = 0.75 * s;
              w = -0.4375 * s * s;
            }
            if (iter === 30) {
              s = (y - x) / 2;
              s = s * s + w;
              if (s > 0) {
                s = Math.sqrt(s);
                if (y < x) {
                  s = -s;
                }
                s = x - w / ((y - x) / 2 + s);
                for (i = low; i <= n; i++) {
                  H.set(i, i, H.get(i, i) - s);
                }
                exshift += s;
                x = y = w = 0.964;
              }
            }
            iter = iter + 1;
            m = n - 2;
            while (m >= l) {
              z = H.get(m, m);
              r = x - z;
              s = y - z;
              p = (r * s - w) / H.get(m + 1, m) + H.get(m, m + 1);
              q = H.get(m + 1, m + 1) - z - r - s;
              r = H.get(m + 2, m + 1);
              s = Math.abs(p) + Math.abs(q) + Math.abs(r);
              p = p / s;
              q = q / s;
              r = r / s;
              if (m === l) {
                break;
              }
              if (Math.abs(H.get(m, m - 1)) * (Math.abs(q) + Math.abs(r)) < eps * (Math.abs(p) * (Math.abs(H.get(m - 1, m - 1)) + Math.abs(z) + Math.abs(H.get(m + 1, m + 1))))) {
                break;
              }
              m--;
            }
            for (i = m + 2; i <= n; i++) {
              H.set(i, i - 2, 0);
              if (i > m + 2) {
                H.set(i, i - 3, 0);
              }
            }
            for (k = m; k <= n - 1; k++) {
              notlast = k !== n - 1;
              if (k !== m) {
                p = H.get(k, k - 1);
                q = H.get(k + 1, k - 1);
                r = notlast ? H.get(k + 2, k - 1) : 0;
                x = Math.abs(p) + Math.abs(q) + Math.abs(r);
                if (x !== 0) {
                  p = p / x;
                  q = q / x;
                  r = r / x;
                }
              }
              if (x === 0) {
                break;
              }
              s = Math.sqrt(p * p + q * q + r * r);
              if (p < 0) {
                s = -s;
              }
              if (s !== 0) {
                if (k !== m) {
                  H.set(k, k - 1, -s * x);
                } else if (l !== m) {
                  H.set(k, k - 1, -H.get(k, k - 1));
                }
                p = p + s;
                x = p / s;
                y = q / s;
                z = r / s;
                q = q / p;
                r = r / p;
                for (j = k; j < nn; j++) {
                  p = H.get(k, j) + q * H.get(k + 1, j);
                  if (notlast) {
                    p = p + r * H.get(k + 2, j);
                    H.set(k + 2, j, H.get(k + 2, j) - p * z);
                  }
                  H.set(k, j, H.get(k, j) - p * x);
                  H.set(k + 1, j, H.get(k + 1, j) - p * y);
                }
                for (i = 0; i <= Math.min(n, k + 3); i++) {
                  p = x * H.get(i, k) + y * H.get(i, k + 1);
                  if (notlast) {
                    p = p + z * H.get(i, k + 2);
                    H.set(i, k + 2, H.get(i, k + 2) - p * r);
                  }
                  H.set(i, k, H.get(i, k) - p);
                  H.set(i, k + 1, H.get(i, k + 1) - p * q);
                }
                for (i = low; i <= high; i++) {
                  p = x * V.get(i, k) + y * V.get(i, k + 1);
                  if (notlast) {
                    p = p + z * V.get(i, k + 2);
                    V.set(i, k + 2, V.get(i, k + 2) - p * r);
                  }
                  V.set(i, k, V.get(i, k) - p);
                  V.set(i, k + 1, V.get(i, k + 1) - p * q);
                }
              }
            }
          }
        }
        if (norm === 0) {
          return;
        }
        for (n = nn - 1; n >= 0; n--) {
          p = d[n];
          q = e[n];
          if (q === 0) {
            l = n;
            H.set(n, n, 1);
            for (i = n - 1; i >= 0; i--) {
              w = H.get(i, i) - p;
              r = 0;
              for (j = l; j <= n; j++) {
                r = r + H.get(i, j) * H.get(j, n);
              }
              if (e[i] < 0) {
                z = w;
                s = r;
              } else {
                l = i;
                if (e[i] === 0) {
                  H.set(i, n, w !== 0 ? -r / w : -r / (eps * norm));
                } else {
                  x = H.get(i, i + 1);
                  y = H.get(i + 1, i);
                  q = (d[i] - p) * (d[i] - p) + e[i] * e[i];
                  t = (x * s - z * r) / q;
                  H.set(i, n, t);
                  H.set(
                    i + 1,
                    n,
                    Math.abs(x) > Math.abs(z) ? (-r - w * t) / x : (-s - y * t) / z
                  );
                }
                t = Math.abs(H.get(i, n));
                if (eps * t * t > 1) {
                  for (j = i; j <= n; j++) {
                    H.set(j, n, H.get(j, n) / t);
                  }
                }
              }
            }
          } else if (q < 0) {
            l = n - 1;
            if (Math.abs(H.get(n, n - 1)) > Math.abs(H.get(n - 1, n))) {
              H.set(n - 1, n - 1, q / H.get(n, n - 1));
              H.set(n - 1, n, -(H.get(n, n) - p) / H.get(n, n - 1));
            } else {
              cdivres = cdiv(0, -H.get(n - 1, n), H.get(n - 1, n - 1) - p, q);
              H.set(n - 1, n - 1, cdivres[0]);
              H.set(n - 1, n, cdivres[1]);
            }
            H.set(n, n - 1, 0);
            H.set(n, n, 1);
            for (i = n - 2; i >= 0; i--) {
              ra = 0;
              sa = 0;
              for (j = l; j <= n; j++) {
                ra = ra + H.get(i, j) * H.get(j, n - 1);
                sa = sa + H.get(i, j) * H.get(j, n);
              }
              w = H.get(i, i) - p;
              if (e[i] < 0) {
                z = w;
                r = ra;
                s = sa;
              } else {
                l = i;
                if (e[i] === 0) {
                  cdivres = cdiv(-ra, -sa, w, q);
                  H.set(i, n - 1, cdivres[0]);
                  H.set(i, n, cdivres[1]);
                } else {
                  x = H.get(i, i + 1);
                  y = H.get(i + 1, i);
                  vr = (d[i] - p) * (d[i] - p) + e[i] * e[i] - q * q;
                  vi = (d[i] - p) * 2 * q;
                  if (vr === 0 && vi === 0) {
                    vr = eps * norm * (Math.abs(w) + Math.abs(q) + Math.abs(x) + Math.abs(y) + Math.abs(z));
                  }
                  cdivres = cdiv(
                    x * r - z * ra + q * sa,
                    x * s - z * sa - q * ra,
                    vr,
                    vi
                  );
                  H.set(i, n - 1, cdivres[0]);
                  H.set(i, n, cdivres[1]);
                  if (Math.abs(x) > Math.abs(z) + Math.abs(q)) {
                    H.set(
                      i + 1,
                      n - 1,
                      (-ra - w * H.get(i, n - 1) + q * H.get(i, n)) / x
                    );
                    H.set(
                      i + 1,
                      n,
                      (-sa - w * H.get(i, n) - q * H.get(i, n - 1)) / x
                    );
                  } else {
                    cdivres = cdiv(
                      -r - y * H.get(i, n - 1),
                      -s - y * H.get(i, n),
                      z,
                      q
                    );
                    H.set(i + 1, n - 1, cdivres[0]);
                    H.set(i + 1, n, cdivres[1]);
                  }
                }
                t = Math.max(Math.abs(H.get(i, n - 1)), Math.abs(H.get(i, n)));
                if (eps * t * t > 1) {
                  for (j = i; j <= n; j++) {
                    H.set(j, n - 1, H.get(j, n - 1) / t);
                    H.set(j, n, H.get(j, n) / t);
                  }
                }
              }
            }
          }
        }
        for (i = 0; i < nn; i++) {
          if (i < low || i > high) {
            for (j = i; j < nn; j++) {
              V.set(i, j, H.get(i, j));
            }
          }
        }
        for (j = nn - 1; j >= low; j--) {
          for (i = low; i <= high; i++) {
            z = 0;
            for (k = low; k <= Math.min(j, high); k++) {
              z = z + V.get(i, k) * H.get(k, j);
            }
            V.set(i, j, z);
          }
        }
      }
      function cdiv(xr, xi, yr, yi) {
        let r, d;
        if (Math.abs(yr) > Math.abs(yi)) {
          r = yi / yr;
          d = yr + r * yi;
          return [(xr + r * xi) / d, (xi - r * xr) / d];
        } else {
          r = yr / yi;
          d = yi + r * yr;
          return [(r * xr + xi) / d, (r * xi - xr) / d];
        }
      }
      var CholeskyDecomposition2 = class {
        constructor(value) {
          value = WrapperMatrix2D2.checkMatrix(value);
          if (!value.isSymmetric()) {
            throw new Error("Matrix is not symmetric");
          }
          let a = value;
          let dimension = a.rows;
          let l = new Matrix2(dimension, dimension);
          let positiveDefinite = true;
          let i, j, k;
          for (j = 0; j < dimension; j++) {
            let d = 0;
            for (k = 0; k < j; k++) {
              let s = 0;
              for (i = 0; i < k; i++) {
                s += l.get(k, i) * l.get(j, i);
              }
              s = (a.get(j, k) - s) / l.get(k, k);
              l.set(j, k, s);
              d = d + s * s;
            }
            d = a.get(j, j) - d;
            positiveDefinite &&= d > 0;
            l.set(j, j, Math.sqrt(Math.max(d, 0)));
            for (k = j + 1; k < dimension; k++) {
              l.set(j, k, 0);
            }
          }
          this.L = l;
          this.positiveDefinite = positiveDefinite;
        }
        isPositiveDefinite() {
          return this.positiveDefinite;
        }
        solve(value) {
          value = WrapperMatrix2D2.checkMatrix(value);
          let l = this.L;
          let dimension = l.rows;
          if (value.rows !== dimension) {
            throw new Error("Matrix dimensions do not match");
          }
          if (this.isPositiveDefinite() === false) {
            throw new Error("Matrix is not positive definite");
          }
          let count = value.columns;
          let B = value.clone();
          let i, j, k;
          for (k = 0; k < dimension; k++) {
            for (j = 0; j < count; j++) {
              for (i = 0; i < k; i++) {
                B.set(k, j, B.get(k, j) - B.get(i, j) * l.get(k, i));
              }
              B.set(k, j, B.get(k, j) / l.get(k, k));
            }
          }
          for (k = dimension - 1; k >= 0; k--) {
            for (j = 0; j < count; j++) {
              for (i = k + 1; i < dimension; i++) {
                B.set(k, j, B.get(k, j) - B.get(i, j) * l.get(i, k));
              }
              B.set(k, j, B.get(k, j) / l.get(k, k));
            }
          }
          return B;
        }
        get lowerTriangularMatrix() {
          return this.L;
        }
      };
      var nipals = class {
        constructor(X, options = {}) {
          X = WrapperMatrix2D2.checkMatrix(X);
          let { Y } = options;
          const {
            scaleScores = false,
            maxIterations = 1e3,
            terminationCriteria = 1e-10
          } = options;
          let u;
          if (Y) {
            if (isAnyArray(Y) && typeof Y[0] === "number") {
              Y = Matrix2.columnVector(Y);
            } else {
              Y = WrapperMatrix2D2.checkMatrix(Y);
            }
            if (Y.rows !== X.rows) {
              throw new Error("Y should have the same number of rows as X");
            }
            u = Y.getColumnVector(0);
          } else {
            u = X.getColumnVector(0);
          }
          let diff = 1;
          let t, q, w, tOld;
          for (let counter = 0; counter < maxIterations && diff > terminationCriteria; counter++) {
            w = X.transpose().mmul(u).div(u.transpose().mmul(u).get(0, 0));
            w = w.div(w.norm());
            t = X.mmul(w).div(w.transpose().mmul(w).get(0, 0));
            if (counter > 0) {
              diff = t.clone().sub(tOld).pow(2).sum();
            }
            tOld = t.clone();
            if (Y) {
              q = Y.transpose().mmul(t).div(t.transpose().mmul(t).get(0, 0));
              q = q.div(q.norm());
              u = Y.mmul(q).div(q.transpose().mmul(q).get(0, 0));
            } else {
              u = t;
            }
          }
          if (Y) {
            let p = X.transpose().mmul(t).div(t.transpose().mmul(t).get(0, 0));
            p = p.div(p.norm());
            let xResidual = X.clone().sub(t.clone().mmul(p.transpose()));
            let residual = u.transpose().mmul(t).div(t.transpose().mmul(t).get(0, 0));
            let yResidual = Y.clone().sub(
              t.clone().mulS(residual.get(0, 0)).mmul(q.transpose())
            );
            this.t = t;
            this.p = p.transpose();
            this.w = w.transpose();
            this.q = q;
            this.u = u;
            this.s = t.transpose().mmul(t);
            this.xResidual = xResidual;
            this.yResidual = yResidual;
            this.betas = residual;
          } else {
            this.w = w.transpose();
            this.s = t.transpose().mmul(t).sqrt();
            if (scaleScores) {
              this.t = t.clone().div(this.s.get(0, 0));
            } else {
              this.t = t;
            }
            this.xResidual = X.sub(t.mmul(w.transpose()));
          }
        }
      };
      exports.AbstractMatrix = AbstractMatrix2;
      exports.CHO = CholeskyDecomposition2;
      exports.CholeskyDecomposition = CholeskyDecomposition2;
      exports.DistanceMatrix = DistanceMatrix2;
      exports.EVD = EigenvalueDecomposition2;
      exports.EigenvalueDecomposition = EigenvalueDecomposition2;
      exports.LU = LuDecomposition2;
      exports.LuDecomposition = LuDecomposition2;
      exports.Matrix = Matrix2;
      exports.MatrixColumnSelectionView = MatrixColumnSelectionView2;
      exports.MatrixColumnView = MatrixColumnView2;
      exports.MatrixFlipColumnView = MatrixFlipColumnView2;
      exports.MatrixFlipRowView = MatrixFlipRowView2;
      exports.MatrixRowSelectionView = MatrixRowSelectionView2;
      exports.MatrixRowView = MatrixRowView2;
      exports.MatrixSelectionView = MatrixSelectionView2;
      exports.MatrixSubView = MatrixSubView2;
      exports.MatrixTransposeView = MatrixTransposeView2;
      exports.NIPALS = nipals;
      exports.Nipals = nipals;
      exports.QR = QrDecomposition2;
      exports.QrDecomposition = QrDecomposition2;
      exports.SVD = SingularValueDecomposition3;
      exports.SingularValueDecomposition = SingularValueDecomposition3;
      exports.SymmetricMatrix = SymmetricMatrix2;
      exports.WrapperMatrix1D = WrapperMatrix1D2;
      exports.WrapperMatrix2D = WrapperMatrix2D2;
      exports.correlation = correlation2;
      exports.covariance = covariance2;
      exports.default = Matrix2;
      exports.determinant = determinant2;
      exports.inverse = inverse3;
      exports.linearDependencies = linearDependencies2;
      exports.pseudoInverse = pseudoInverse3;
      exports.solve = solve2;
      exports.wrap = wrap2;
    }
  });

  // build/entry.js
  var entry_exports = {};
  __export(entry_exports, {
    GcpTransformer: () => GcpTransformer
  });

  // node_modules/@allmaps/stdlib/dist/main.js
  function isEqualArray(array0, array1, isEqualObject = (t0, t1) => t0 == t1) {
    if (array0 === array1)
      return true;
    if (!array0 || !array1)
      return false;
    if (array0.length !== array1.length) {
      return false;
    }
    for (let i = 0; i < array0.length; i++) {
      if (!isEqualObject(array0[i], array1[i])) {
        return false;
      }
    }
    return true;
  }

  // node_modules/@turf/clone/dist/esm/index.js
  function clone(geojson) {
    if (!geojson) {
      throw new Error("geojson is required");
    }
    switch (geojson.type) {
      case "Feature":
        return cloneFeature(geojson);
      case "FeatureCollection":
        return cloneFeatureCollection(geojson);
      case "Point":
      case "LineString":
      case "Polygon":
      case "MultiPoint":
      case "MultiLineString":
      case "MultiPolygon":
      case "GeometryCollection":
        return cloneGeometry(geojson);
      default:
        throw new Error("unknown GeoJSON type");
    }
  }
  function cloneFeature(geojson) {
    const cloned = { type: "Feature" };
    Object.keys(geojson).forEach((key) => {
      switch (key) {
        case "type":
        case "properties":
        case "geometry":
          return;
        default:
          cloned[key] = geojson[key];
      }
    });
    cloned.properties = cloneProperties(geojson.properties);
    if (geojson.geometry == null) {
      cloned.geometry = null;
    } else {
      cloned.geometry = cloneGeometry(geojson.geometry);
    }
    return cloned;
  }
  function cloneProperties(properties) {
    const cloned = {};
    if (!properties) {
      return cloned;
    }
    Object.keys(properties).forEach((key) => {
      const value = properties[key];
      if (typeof value === "object") {
        if (value === null) {
          cloned[key] = null;
        } else if (Array.isArray(value)) {
          cloned[key] = value.map((item) => {
            return item;
          });
        } else {
          cloned[key] = cloneProperties(value);
        }
      } else {
        cloned[key] = value;
      }
    });
    return cloned;
  }
  function cloneFeatureCollection(geojson) {
    const cloned = { type: "FeatureCollection" };
    Object.keys(geojson).forEach((key) => {
      switch (key) {
        case "type":
        case "features":
          return;
        default:
          cloned[key] = geojson[key];
      }
    });
    cloned.features = geojson.features.map((feature) => {
      return cloneFeature(feature);
    });
    return cloned;
  }
  function cloneGeometry(geometry) {
    const geom = { type: geometry.type };
    if (geometry.bbox) {
      geom.bbox = geometry.bbox;
    }
    if (geometry.type === "GeometryCollection") {
      geom.geometries = geometry.geometries.map((g) => {
        return cloneGeometry(g);
      });
      return geom;
    }
    geom.coordinates = deepSlice(geometry.coordinates);
    return geom;
  }
  function deepSlice(coords) {
    const cloned = coords;
    if (typeof cloned[0] !== "object") {
      return cloned.slice();
    }
    return cloned.map((coord) => {
      return deepSlice(coord);
    });
  }

  // node_modules/@turf/helpers/dist/esm/index.js
  var earthRadius = 63710088e-1;
  var factors = {
    centimeters: earthRadius * 100,
    centimetres: earthRadius * 100,
    cm: earthRadius * 100,
    degrees: 360 / (2 * Math.PI),
    deg: 360 / (2 * Math.PI),
    feet: earthRadius * 3.28084,
    ft: earthRadius * 3.28084,
    inches: earthRadius * 39.37,
    in: earthRadius * 39.37,
    kilometers: earthRadius / 1e3,
    kilometres: earthRadius / 1e3,
    km: earthRadius / 1e3,
    meters: earthRadius,
    metres: earthRadius,
    m: earthRadius,
    miles: earthRadius / 1609.344,
    mi: earthRadius / 1609.344,
    millimeters: earthRadius * 1e3,
    millimetres: earthRadius * 1e3,
    mm: earthRadius * 1e3,
    nauticalmiles: earthRadius / 1852,
    nmi: earthRadius / 1852,
    radians: 1,
    rad: 1,
    yards: earthRadius * 1.0936,
    yd: earthRadius * 1.0936
  };
  function featureCollection(features, options = {}) {
    const fc = { type: "FeatureCollection" };
    if (options.id) {
      fc.id = options.id;
    }
    if (options.bbox) {
      fc.bbox = options.bbox;
    }
    fc.features = features;
    return fc;
  }
  function isObject(input) {
    return input !== null && typeof input === "object" && !Array.isArray(input);
  }

  // node_modules/@turf/invariant/dist/esm/index.js
  function getCoords(coords) {
    if (Array.isArray(coords)) {
      return coords;
    }
    if (coords.type === "Feature") {
      if (coords.geometry !== null) {
        return coords.geometry.coordinates;
      }
    } else {
      if (coords.coordinates) {
        return coords.coordinates;
      }
    }
    throw new Error(
      "coords must be GeoJSON Feature, Geometry Object or an Array"
    );
  }

  // node_modules/@turf/boolean-clockwise/dist/esm/index.js
  function booleanClockwise(line) {
    const ring = getCoords(line);
    let sum = 0;
    let i = 1;
    let prev;
    let cur;
    while (i < ring.length) {
      prev = cur || ring[0];
      cur = ring[i];
      sum += (cur[0] - prev[0]) * (cur[1] + prev[1]);
      i++;
    }
    return sum > 0;
  }

  // node_modules/@turf/meta/dist/esm/index.js
  function featureEach(geojson, callback) {
    if (geojson.type === "Feature") {
      callback(geojson, 0);
    } else if (geojson.type === "FeatureCollection") {
      for (var i = 0; i < geojson.features.length; i++) {
        if (callback(geojson.features[i], i) === false) break;
      }
    }
  }
  function geomEach(geojson, callback) {
    var i, j, g, geometry, stopG, geometryMaybeCollection, isGeometryCollection, featureProperties, featureBBox, featureId, featureIndex = 0, isFeatureCollection = geojson.type === "FeatureCollection", isFeature = geojson.type === "Feature", stop = isFeatureCollection ? geojson.features.length : 1;
    for (i = 0; i < stop; i++) {
      geometryMaybeCollection = isFeatureCollection ? (
        // @ts-expect-error: Known type conflict
        geojson.features[i].geometry
      ) : isFeature ? (
        // @ts-expect-error: Known type conflict
        geojson.geometry
      ) : geojson;
      featureProperties = isFeatureCollection ? (
        // @ts-expect-error: Known type conflict
        geojson.features[i].properties
      ) : isFeature ? (
        // @ts-expect-error: Known type conflict
        geojson.properties
      ) : {};
      featureBBox = isFeatureCollection ? (
        // @ts-expect-error: Known type conflict
        geojson.features[i].bbox
      ) : isFeature ? (
        // @ts-expect-error: Known type conflict
        geojson.bbox
      ) : void 0;
      featureId = isFeatureCollection ? (
        // @ts-expect-error: Known type conflict
        geojson.features[i].id
      ) : isFeature ? (
        // @ts-expect-error: Known type conflict
        geojson.id
      ) : void 0;
      isGeometryCollection = geometryMaybeCollection ? geometryMaybeCollection.type === "GeometryCollection" : false;
      stopG = isGeometryCollection ? geometryMaybeCollection.geometries.length : 1;
      for (g = 0; g < stopG; g++) {
        geometry = isGeometryCollection ? geometryMaybeCollection.geometries[g] : geometryMaybeCollection;
        if (geometry === null) {
          if (
            // @ts-expect-error: Known type conflict
            callback(
              // @ts-expect-error: Known type conflict
              null,
              featureIndex,
              featureProperties,
              featureBBox,
              featureId
            ) === false
          )
            return false;
          continue;
        }
        switch (geometry.type) {
          case "Point":
          case "LineString":
          case "MultiPoint":
          case "Polygon":
          case "MultiLineString":
          case "MultiPolygon": {
            if (
              // @ts-expect-error: Known type conflict
              callback(
                geometry,
                featureIndex,
                featureProperties,
                featureBBox,
                featureId
              ) === false
            )
              return false;
            break;
          }
          case "GeometryCollection": {
            for (j = 0; j < geometry.geometries.length; j++) {
              if (
                // @ts-expect-error: Known type conflict
                callback(
                  geometry.geometries[j],
                  featureIndex,
                  featureProperties,
                  featureBBox,
                  featureId
                ) === false
              )
                return false;
            }
            break;
          }
          default:
            throw new Error("Unknown Geometry Type");
        }
      }
      featureIndex++;
    }
  }

  // node_modules/@turf/rewind/dist/esm/index.js
  function rewind(geojson, options = {}) {
    var _a, _b;
    options = options || {};
    if (!isObject(options)) throw new Error("options is invalid");
    const mutate = (_a = options.mutate) != null ? _a : false;
    const reverse = (_b = options.reverse) != null ? _b : false;
    if (!geojson) throw new Error("<geojson> is required");
    if (typeof reverse !== "boolean")
      throw new Error("<reverse> must be a boolean");
    if (typeof mutate !== "boolean")
      throw new Error("<mutate> must be a boolean");
    if (!mutate && geojson.type !== "Point" && geojson.type !== "MultiPoint") {
      geojson = clone(geojson);
    }
    const results = [];
    switch (geojson.type) {
      case "GeometryCollection":
        geomEach(geojson, function(geometry) {
          rewindFeature(geometry, reverse);
        });
        return geojson;
      case "FeatureCollection":
        featureEach(geojson, function(feature) {
          const rewoundFeature = rewindFeature(feature, reverse);
          featureEach(rewoundFeature, function(result) {
            results.push(result);
          });
        });
        return featureCollection(results);
    }
    return rewindFeature(geojson, reverse);
  }
  function rewindFeature(geojson, reverse) {
    const type = geojson.type === "Feature" ? geojson.geometry.type : geojson.type;
    switch (type) {
      case "GeometryCollection":
        geomEach(geojson, function(geometry) {
          rewindFeature(geometry, reverse);
        });
        return geojson;
      case "LineString":
        rewindLineString(getCoords(geojson), reverse);
        return geojson;
      case "Polygon":
        rewindPolygon(getCoords(geojson), reverse);
        return geojson;
      case "MultiLineString":
        getCoords(geojson).forEach(function(lineCoords) {
          rewindLineString(lineCoords, reverse);
        });
        return geojson;
      case "MultiPolygon":
        getCoords(geojson).forEach(function(lineCoords) {
          rewindPolygon(lineCoords, reverse);
        });
        return geojson;
      case "Point":
      case "MultiPoint":
        return geojson;
    }
  }
  function rewindLineString(coords, reverse) {
    if (booleanClockwise(coords) === reverse) coords.reverse();
  }
  function rewindPolygon(coords, reverse) {
    if (booleanClockwise(coords[0]) !== reverse) {
      coords[0].reverse();
    }
    for (let i = 1; i < coords.length; i++) {
      if (booleanClockwise(coords[i]) === reverse) {
        coords[i].reverse();
      }
    }
  }

  // node_modules/@allmaps/stdlib/dist/geometry.js
  function isPoint(input) {
    return Array.isArray(input) && input.length >= 2 && typeof input[0] === "number" && typeof input[1] === "number";
  }
  function isLineString(input) {
    return Array.isArray(input) && input.every(isPoint);
  }
  function isRing(input) {
    return Array.isArray(input) && input.every(isPoint);
  }
  function isPolygon(input) {
    return Array.isArray(input) && input.every(isRing);
  }
  function isMultiPoint(input) {
    return Array.isArray(input) && input.every(isPoint);
  }
  function isMultiLineString(input) {
    return Array.isArray(input) && input.every(isLineString);
  }
  function isMultiPolygon(input) {
    return Array.isArray(input) && input.every(isPolygon);
  }
  function isGeometry(input) {
    return isPoint(input) || isLineString(input) || isPolygon(input) || isMultiPoint(input) || isMultiLineString(input) || isMultiPolygon(input);
  }
  function closeRing(ring) {
    return [...ring, ring[0]];
  }
  function uncloseRing(ring) {
    ring.splice(-1);
    return ring;
  }
  function closePolygon(polygon) {
    return polygon.map((ring) => closeRing(ring));
  }
  function closeMultiPolygon(multiPolygon) {
    return multiPolygon.map((polygon) => closePolygon(polygon));
  }
  function conformLineString(lineString) {
    lineString = lineString.filter(function(point, i, originalLineString) {
      return i === 0 || !isEqualPoint(point, originalLineString[i - 1]);
    });
    if (lineString.length < 2) {
      throw new Error("LineString should contain at least 2 points");
    }
    return lineString;
  }
  function conformRing(ring) {
    ring = ring.filter(function(point, i, originalRing) {
      return i === 0 || !isEqualPoint(point, originalRing[i - 1]);
    });
    if (isClosed(ring)) {
      uncloseRing(ring);
    }
    if (ring.length < 3) {
      throw new Error("Ring should contain at least 3 points");
    }
    return ring;
  }
  function conformPolygon(polygon) {
    return polygon.map((ring) => {
      return conformRing(ring);
    });
  }
  function conformMultiLineString(multiLineString) {
    return multiLineString.map((lineString) => conformLineString(lineString));
  }
  function conformMultiPolygon(multiPolygon) {
    return multiPolygon.map((polygon) => conformPolygon(polygon));
  }
  function pointToGeojsonPoint(point) {
    return {
      type: "Point",
      coordinates: point
    };
  }
  function lineStringToGeojsonLineString(lineString) {
    return {
      type: "LineString",
      coordinates: lineString
    };
  }
  function polygonToGeojsonPolygon(polygon, close = true) {
    const geometry = {
      type: "Polygon",
      coordinates: close ? closePolygon(polygon) : polygon
    };
    return rewind(geometry);
  }
  function multiPointToGeojsonMultiPoint(multiPoint) {
    return {
      type: "MultiPoint",
      coordinates: multiPoint
    };
  }
  function multiLineStringToGeojsonMultiLineString(multiLineString) {
    return {
      type: "MultiLineString",
      coordinates: multiLineString
    };
  }
  function multiPolygonToGeojsonMultiPolygon(multiPolygon, close = true) {
    const geometry = {
      type: "MultiPolygon",
      coordinates: close ? closeMultiPolygon(multiPolygon) : multiPolygon
    };
    return rewind(geometry);
  }
  function geometryToGeojsonGeometry(geometry, options) {
    if (!options || !options.isMultiGeometry) {
      if (isPoint(geometry)) {
        return pointToGeojsonPoint(geometry);
      } else if (isLineString(geometry)) {
        return lineStringToGeojsonLineString(geometry);
      } else if (isPolygon(geometry)) {
        return polygonToGeojsonPolygon(geometry);
      } else {
        throw new Error("Geometry type not supported");
      }
    } else {
      if (isMultiPoint(geometry)) {
        return multiPointToGeojsonMultiPoint(geometry);
      } else if (isMultiLineString(geometry)) {
        return multiLineStringToGeojsonMultiLineString(geometry);
      } else if (isMultiPolygon(geometry)) {
        return multiPolygonToGeojsonMultiPolygon(geometry);
      } else {
        throw new Error("Geometry type not supported");
      }
    }
  }
  function pointToSvgCircle(point) {
    return {
      type: "circle",
      coordinates: point
    };
  }
  function lineStringToSvgPolyLine(lineString) {
    return {
      type: "polyline",
      coordinates: lineString
    };
  }
  function polygonToSvgPolygon(polygon) {
    return {
      type: "polygon",
      coordinates: polygon[0]
    };
  }
  function geometryToSvgGeometry(geometry) {
    if (isPoint(geometry)) {
      return pointToSvgCircle(geometry);
    } else if (isLineString(geometry)) {
      return lineStringToSvgPolyLine(geometry);
    } else if (isPolygon(geometry)) {
      return polygonToSvgPolygon(geometry);
    } else {
      throw new Error(`Unsupported GeoJSON Geometry`);
    }
  }
  function geometryToPoints(geometry) {
    if (isPoint(geometry)) {
      return [geometry];
    }
    if (isLineString(geometry)) {
      return geometry;
    }
    if (isPolygon(geometry)) {
      return geometry.flat();
    }
    if (isMultiPoint(geometry)) {
      return geometry;
    }
    if (isMultiLineString(geometry)) {
      return geometry.flat();
    }
    if (isMultiPolygon(geometry)) {
      return geometry.flat(2);
    } else {
      throw new Error(`Unsupported Geometry`);
    }
  }
  function isClosed(input) {
    return Array.isArray(input) && input.length >= 2 && isEqualPoint(input[0], input[input.length - 1]);
  }
  function isEqualPoint(point0, point1) {
    if (point0 === point1)
      return true;
    if (point0 === null || point1 === null)
      return false;
    return point0[0] === point1[0] && point0[1] === point1[1];
  }
  function flipY(point) {
    return [point[0], -point[1]];
  }
  function midPoint(...points) {
    const result = [0, 0];
    for (let i = 0; i < points.length; i++) {
      result[0] += points[i][0];
      result[1] += points[i][1];
    }
    result[0] = result[0] / points.length;
    result[1] = result[1] / points.length;
    return result;
  }
  function distance(from, to) {
    return Math.sqrt(squaredDistance(from, to));
  }
  function squaredDistance(from, to = [0, 0]) {
    return (to[0] - from[0]) ** 2 + (to[1] - from[1]) ** 2;
  }
  function rms(from, to) {
    if (from.length !== to.length) {
      throw new Error("Arrays need to be of same length");
    }
    const squaredDistances = from.map((fromPoint, index) => squaredDistance(fromPoint, to[index]));
    const meanSquaredDistances = squaredDistances.reduce((sum, squaredDistace) => sum + squaredDistace, 0) / squaredDistances.length;
    const rootMeanSquaredDistances = Math.sqrt(meanSquaredDistances);
    return rootMeanSquaredDistances;
  }

  // node_modules/@allmaps/stdlib/dist/geojson.js
  function isGeojsonPointCoordinates(input) {
    return Array.isArray(input) && input.length >= 2 && input.every((item) => typeof item === "number");
  }
  function isGeojsonLineStringCoordinates(input) {
    return Array.isArray(input) && input.every(isGeojsonPointCoordinates);
  }
  function isGeojsonRingCoordinates(input) {
    return Array.isArray(input) && input.every(isGeojsonPointCoordinates);
  }
  function isGeojsonPolygonCoordinates(input) {
    return Array.isArray(input) && input.every(isGeojsonRingCoordinates);
  }
  function isGeojsonMultiPointCoordinates(input) {
    return Array.isArray(input) && input.every(isGeojsonPointCoordinates);
  }
  function isGeojsonMultiLineStringCoordinates(input) {
    return Array.isArray(input) && input.every(isGeojsonLineStringCoordinates);
  }
  function isGeojsonMultiPolygonCoordinates(input) {
    return Array.isArray(input) && input.every(isGeojsonPolygonCoordinates);
  }
  function isGeojsonPoint(input) {
    return typeof input === "object" && input !== null && "type" in input && input.type === "Point" && "coordinates" in input && isGeojsonPointCoordinates(input.coordinates);
  }
  function isGeojsonLineString(input) {
    return typeof input === "object" && input !== null && "type" in input && input.type === "LineString" && "coordinates" in input && isGeojsonLineStringCoordinates(input.coordinates);
  }
  function isGeojsonPolygon(input) {
    return typeof input === "object" && input !== null && "type" in input && input.type === "Polygon" && "coordinates" in input && Array.isArray(input.coordinates) && isGeojsonPolygonCoordinates(input.coordinates);
  }
  function isGeojsonMultiPoint(input) {
    return typeof input === "object" && input !== null && "type" in input && input.type === "MultiPoint" && "coordinates" in input && isGeojsonMultiPointCoordinates(input.coordinates);
  }
  function isGeojsonMultiLineString(input) {
    return typeof input === "object" && input !== null && "type" in input && input.type === "MultiLineString" && "coordinates" in input && isGeojsonMultiLineStringCoordinates(input.coordinates);
  }
  function isGeojsonMultiPolygon(input) {
    return typeof input === "object" && input !== null && "type" in input && input.type === "MultiPolygon" && "coordinates" in input && Array.isArray(input.coordinates) && isGeojsonMultiPolygonCoordinates(input.coordinates);
  }
  function isGeojsonGeometry(obj) {
    const isObject2 = typeof obj === "object" && obj !== null;
    const hasStringType = isObject2 && "type" in obj && typeof obj.type === "string";
    const isValidType = hasStringType && (obj.type === "Point" || obj.type === "LineString" || obj.type === "Polygon" || obj.type === "MultiPoint" || obj.type === "MultiLineString" || obj.type === "MultiPolygon");
    const hasCoordinatesArray = isObject2 && "coordinates" in obj && Array.isArray(obj.coordinates);
    return isValidType && hasCoordinatesArray;
  }
  function geojsonPointCoordinatesToPoint(geojsonPointCoordinates) {
    return geojsonPointCoordinates.slice(0, 2);
  }
  function geojsonPointToPoint(geojsonPoint) {
    return geojsonPointCoordinatesToPoint(geojsonPoint.coordinates);
  }
  function geojsonLineStringToLineString(geojsonLineString) {
    return conformLineString(geojsonLineString.coordinates.map(geojsonPointCoordinatesToPoint));
  }
  function geojsonPolygonToPolygon(geojsonPolygon, close = false) {
    const polygon = conformPolygon(geojsonPolygon.coordinates.map((ring) => ring.map(geojsonPointCoordinatesToPoint)));
    return close ? polygon.map((ring) => [...ring, ring[0]]) : polygon;
  }
  function geojsonMultiPointToMultiPoint(geojsonMultiPoint) {
    return geojsonMultiPoint.coordinates.map(geojsonPointCoordinatesToPoint);
  }
  function geojsonMultiLineStringToMultiLineString(geojsonMultiLineString) {
    return conformMultiLineString(geojsonMultiLineString.coordinates.map((l) => l.map(geojsonPointCoordinatesToPoint)));
  }
  function geojsonMultiPolygonToMultiPolygon(geojsonMultiPolygon, close = false) {
    const multipolygon = conformMultiPolygon(geojsonMultiPolygon.coordinates.map((p) => p.map((l) => l.map(geojsonPointCoordinatesToPoint))));
    return close ? multipolygon.map((polygon) => polygon.map((ring) => [...ring, ring[0]])) : multipolygon;
  }
  function geojsonGeometryToGeometry(geojsonGeometry) {
    if (isGeojsonPoint(geojsonGeometry)) {
      return geojsonPointToPoint(geojsonGeometry);
    } else if (isGeojsonLineString(geojsonGeometry)) {
      return geojsonLineStringToLineString(geojsonGeometry);
    } else if (isGeojsonPolygon(geojsonGeometry)) {
      return geojsonPolygonToPolygon(geojsonGeometry);
    } else if (isGeojsonMultiPoint(geojsonGeometry)) {
      return geojsonMultiPointToMultiPoint(geojsonGeometry);
    } else if (isGeojsonMultiLineString(geojsonGeometry)) {
      return geojsonMultiLineStringToMultiLineString(geojsonGeometry);
    } else if (isGeojsonMultiPolygon(geojsonGeometry)) {
      return geojsonMultiPolygonToMultiPolygon(geojsonGeometry);
    } else {
      throw new Error("Geometry type not supported");
    }
  }
  function geojsonGeometryToPoints(geoJsonGeometry) {
    return geometryToPoints(geojsonGeometryToGeometry(geoJsonGeometry));
  }
  function geojsonGeometryToGeojsonFeature(geojsonGeometry, properties) {
    return {
      type: "Feature",
      properties: properties ? properties : {},
      geometry: geojsonGeometry
    };
  }
  function geojsonGeometriesToGeojsonFeatureCollection(geojsonGeometries, properties) {
    return {
      type: "FeatureCollection",
      features: geojsonGeometries.map((geometry, i) => properties ? geojsonGeometryToGeojsonFeature(geometry, properties[i]) : geojsonGeometryToGeojsonFeature(geometry))
    };
  }
  function geojsonFeatureToGeojsonGeometry(geojsonFeature) {
    return geojsonFeature.geometry;
  }
  function geojsonFeatureCollectionToGeojsonGeometries(geojsonFeatureCollection) {
    return geojsonFeatureCollection.features.map(geojsonFeatureToGeojsonGeometry);
  }

  // node_modules/@allmaps/stdlib/dist/bbox.js
  function computeMinMax(values) {
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;
    for (const value of values) {
      if (min === void 0) {
        if (value >= value)
          min = max = value;
      } else {
        if (min > value)
          min = value;
        if (max < value)
          max = value;
      }
    }
    return [min, max];
  }
  function computeBbox(geometry) {
    let points;
    if (isGeometry(geometry)) {
      points = geometryToPoints(geometry);
    } else if (isGeojsonGeometry(geometry)) {
      points = geojsonGeometryToPoints(geometry);
    } else {
      throw new Error(`Unsupported Geometry`);
    }
    const xs = points.map((point) => point[0]);
    const ys = points.map((point) => point[1]);
    const [minX, maxX] = computeMinMax(xs);
    const [minY, maxY] = computeMinMax(ys);
    return [minX, minY, maxX, maxY];
  }
  function bboxToRectangle(bbox) {
    return [
      [bbox[0], bbox[1]],
      [bbox[2], bbox[1]],
      [bbox[2], bbox[3]],
      [bbox[0], bbox[3]]
    ];
  }

  // node_modules/hex-rgb/index.js
  var hexCharacters = "a-f\\d";
  var match3or4Hex = `#?[${hexCharacters}]{3}[${hexCharacters}]?`;
  var match6or8Hex = `#?[${hexCharacters}]{6}([${hexCharacters}]{2})?`;
  var nonHexChars = new RegExp(`[^#${hexCharacters}]`, "gi");
  var validHexSize = new RegExp(`^${match3or4Hex}$|^${match6or8Hex}$`, "i");

  // node_modules/@allmaps/stdlib/dist/matrix.js
  function newArrayMatrix(rows, cols, value = 0) {
    if (rows <= 0 || cols <= 0) {
      throw new Error("Empty ArrayMatrix not supported");
    }
    const result = new Array(rows);
    for (let i = 0; i < rows; i++) {
      const row = new Array(cols);
      for (let j = 0; j < cols; j++) {
        row[j] = value;
      }
      result[i] = row;
    }
    return result;
  }
  function arrayMatrixSize(arrayMatrix) {
    return [arrayMatrix.length, arrayMatrix[0].length];
  }
  function shallowCopyArrayMatrix(arrayMatrix) {
    const rows = arrayMatrix.length;
    const result = new Array(rows);
    for (let i = 0; i < rows; i++) {
      result[i] = arrayMatrix[i].slice();
    }
    return result;
  }
  function pasteArrayMatrix(arrayMatrix, rowsStart, colsStart, subArrayMatrix2) {
    const subSize = arrayMatrixSize(subArrayMatrix2);
    const result = shallowCopyArrayMatrix(arrayMatrix);
    for (let i = 0; i < subSize[0]; i++) {
      for (let j = 0; j < subSize[1]; j++) {
        result[rowsStart + i][colsStart + j] = subArrayMatrix2[i][j];
      }
    }
    return result;
  }
  function transposeArrayMatrix(arrayMatrix) {
    const rows = arrayMatrix.length;
    const cols = arrayMatrix[0].length;
    const result = new Array(cols);
    for (let j = 0; j < cols; j++) {
      const newRow = new Array(rows);
      for (let i = 0; i < rows; i++) {
        newRow[i] = arrayMatrix[i][j];
      }
      result[j] = newRow;
    }
    return result;
  }
  function newBlockArrayMatrix(blocks, emptyValue = 0) {
    const size = arrayMatrixSize(blocks);
    const sizesArrayMatrix = blocks.map((row) => row.map((block) => arrayMatrixSize(block)));
    const rowsArrayMatrix = sizesArrayMatrix.map((row) => row.map((dims) => dims[0]));
    const transposedRowsArrayMatrix = transposeArrayMatrix(rowsArrayMatrix);
    const rowsArray = transposedRowsArrayMatrix[0];
    if (!transposedRowsArrayMatrix.every((array) => isEqualArray(array, transposedRowsArrayMatrix[0]))) {
      throw new Error("The blocks, by block column, must have the same sequence of rows.");
    }
    const rowsTrailingCumulativeArray = [];
    let sum = 0;
    rowsArray.forEach((e) => {
      rowsTrailingCumulativeArray.push(sum);
      sum = sum + e;
    });
    const rowsCumulative = sum;
    const colsArrayMatrix = sizesArrayMatrix.map((row) => row.map((dims) => dims[1]));
    const colsArray = colsArrayMatrix[0];
    if (!colsArrayMatrix.every((array) => isEqualArray(array, colsArray))) {
      throw new Error("The blocks, by block row, must have the same sequence of columns.");
    }
    const colsTrailingCumulativeArray = [];
    sum = 0;
    colsArrayMatrix[0].forEach((e) => {
      colsTrailingCumulativeArray.push(sum);
      sum = sum + e;
    });
    const colsCumulative = sum;
    let result = newArrayMatrix(rowsCumulative, colsCumulative, emptyValue);
    for (let i = 0; i < size[0]; i++) {
      for (let j = 0; j < size[1]; j++) {
        result = pasteArrayMatrix(result, rowsTrailingCumulativeArray[i], rowsTrailingCumulativeArray[j], blocks[i][j]);
      }
    }
    return result;
  }

  // node_modules/@allmaps/stdlib/dist/options.js
  function mergeOptions(baseOptions, ...additionalPartialOptions) {
    const len = additionalPartialOptions.length;
    if (len === 0) {
      return baseOptions;
    }
    if (len === 1) {
      const only = additionalPartialOptions[0];
      if (only == null)
        return baseOptions;
      return { ...baseOptions, ...only };
    }
    let hasAdditional = false;
    for (let i = 0; i < len; i++) {
      if (additionalPartialOptions[i] != null) {
        hasAdditional = true;
        break;
      }
    }
    if (!hasAdditional)
      return baseOptions;
    return {
      ...baseOptions,
      ...mergePartialOptions(...additionalPartialOptions)
    };
  }
  function mergePartialOptions(...partialOptions) {
    const definedPartialOptionsArray = partialOptions.filter((partialOptions2) => partialOptions2 !== void 0 && partialOptions2 !== null);
    if (definedPartialOptionsArray.length === 0) {
      return {};
    } else if (definedPartialOptionsArray.length === 1) {
      return definedPartialOptionsArray[0];
    } else {
      return Object.assign({}, ...definedPartialOptionsArray);
    }
  }

  // node_modules/svg-parser/dist/svg-parser.esm.js
  function getLocator(source, options) {
    if (options === void 0) options = {};
    var offsetLine = options.offsetLine || 0;
    var offsetColumn = options.offsetColumn || 0;
    var originalLines = source.split("\n");
    var start = 0;
    var lineRanges = originalLines.map(function(line, i2) {
      var end = start + line.length + 1;
      var range = {
        start,
        end,
        line: i2
      };
      start = end;
      return range;
    });
    var i = 0;
    function rangeContains(range, index) {
      return range.start <= index && index < range.end;
    }
    function getLocation(range, index) {
      return {
        line: offsetLine + range.line,
        column: offsetColumn + index - range.start,
        character: index
      };
    }
    function locate2(search, startIndex) {
      if (typeof search === "string") search = source.indexOf(search, startIndex || 0);
      var range = lineRanges[i];
      var d = search >= range.end ? 1 : -1;
      while (range) {
        if (rangeContains(range, search)) return getLocation(range, search);
        i += d;
        range = lineRanges[i];
      }
    }
    return locate2;
  }
  function locate(source, search, options) {
    if (typeof options === "number") throw new Error("locate takes a { startIndex, offsetLine, offsetColumn } object as the third argument");
    return getLocator(source, options)(search, options && options.startIndex);
  }
  var validNameCharacters = /[a-zA-Z0-9:_-]/;
  var whitespace = /[\s\t\r\n]/;
  var quotemark = /['"]/;
  var MAX_SNIPPET_WIDTH = 80;
  var SNIPPET_CONTEXT_LINES = 1;
  function repeat(str, i) {
    let result = "";
    while (i--) result += str;
    return result;
  }
  function cropLine(line, column) {
    const expandedLine = line.replace(/\t/g, "  ");
    const expandedColumn = line.slice(0, column).replace(/\t/g, "  ").length;
    if (expandedLine.length <= MAX_SNIPPET_WIDTH && expandedColumn < MAX_SNIPPET_WIDTH) return {
      line: expandedLine,
      column: expandedColumn
    };
    const contentWidth = 78;
    const start = Math.max(0, Math.min(expandedColumn - Math.floor(contentWidth / 2), expandedLine.length - contentWidth));
    const end = start + contentWidth;
    const prefix = start > 0 ? "\u2026" : "";
    const suffix = end < expandedLine.length ? "\u2026" : "";
    return {
      line: `${prefix}${expandedLine.slice(start, end)}${suffix}`,
      column: prefix.length + expandedColumn - start
    };
  }
  function getSnippet(source, line, column) {
    const lines = source.split("\n");
    const firstLine = Math.max(0, line - SNIPPET_CONTEXT_LINES);
    const lastLine = Math.min(lines.length - 1, line + SNIPPET_CONTEXT_LINES);
    const snippet = [];
    if (firstLine > 0) snippet.push("\u2026");
    for (let lineIndex = firstLine; lineIndex <= lastLine; lineIndex += 1) {
      const cropped = cropLine(lines[lineIndex].replace(/\r$/, ""), lineIndex === line ? column : 0);
      snippet.push(cropped.line);
      if (lineIndex === line) snippet.push(`${repeat(" ", cropped.column)}^`);
    }
    if (lastLine < lines.length - 1) snippet.push("\u2026");
    return snippet.join("\n");
  }
  function parse(source) {
    if (!/\S/.test(source)) throw new Error("SVG input is empty");
    let header = "";
    let stack = [];
    let state = metadata;
    let currentElement = null;
    let root = null;
    function error(message) {
      const { line, column } = locate(source, i);
      const snippet = getSnippet(source, line, column);
      throw Object.assign(/* @__PURE__ */ new Error(`${message} (${line}:${column})

${snippet}`), {
        line,
        column,
        snippet
      });
    }
    function metadata() {
      while (i < source.length && source[i] !== "<" || !validNameCharacters.test(source[i + 1])) header += source[i++];
      return neutral();
    }
    function neutral() {
      let text = "";
      while (i < source.length && source[i] !== "<") text += source[i++];
      if (/\S/.test(text)) currentElement.children.push({
        type: "text",
        value: text
      });
      if (source[i] === "<") return tag;
      return neutral;
    }
    function tag() {
      const char = source[i];
      if (char === "?") return neutral;
      if (char === "!") {
        if (source.slice(i + 1, i + 3) === "--") return comment;
        if (source.slice(i + 1, i + 8) === "[CDATA[") return cdata;
        if (/doctype/i.test(source.slice(i + 1, i + 8))) return neutral;
      }
      if (char === "/") return closingTag;
      const element = {
        type: "element",
        tagName: getName(),
        properties: {},
        children: []
      };
      if (currentElement) currentElement.children.push(element);
      else root = element;
      let attribute;
      while (i < source.length && (attribute = getAttribute())) element.properties[attribute.name] = attribute.value;
      let selfClosing = false;
      if (source[i] === "/") {
        i += 1;
        selfClosing = true;
      }
      if (source[i] !== ">") error("Expected >");
      if (!selfClosing) {
        currentElement = element;
        stack.push(element);
      }
      return neutral;
    }
    function comment() {
      const index = source.indexOf("-->", i);
      if (!~index) error("expected -->");
      i = index + 2;
      return neutral;
    }
    function cdata() {
      const index = source.indexOf("]]>", i);
      if (!~index) error("expected ]]>");
      currentElement.children.push(source.slice(i + 7, index));
      i = index + 2;
      return neutral;
    }
    function closingTag() {
      const tagName = getName();
      if (!tagName) error("Expected tag name");
      if (tagName !== currentElement.tagName) error(`Expected closing tag </${tagName}> to match opening tag <${currentElement.tagName}>`);
      allowSpaces();
      if (source[i] !== ">") error("Expected >");
      stack.pop();
      currentElement = stack[stack.length - 1];
      return neutral;
    }
    function getName() {
      let name = "";
      while (i < source.length && validNameCharacters.test(source[i])) name += source[i++];
      return name;
    }
    function getAttribute() {
      if (!whitespace.test(source[i])) return null;
      allowSpaces();
      const name = getName();
      if (!name) return null;
      let value = true;
      allowSpaces();
      if (source[i] === "=") {
        i += 1;
        allowSpaces();
        value = getAttributeValue();
        if (!isNaN(value) && value.trim() !== "") value = +value;
      }
      return {
        name,
        value
      };
    }
    function getAttributeValue() {
      return quotemark.test(source[i]) ? getQuotedAttributeValue() : getUnquotedAttributeValue();
    }
    function getUnquotedAttributeValue() {
      let value = "";
      do {
        const char = source[i];
        if (char === " " || char === ">" || char === "/") return value;
        value += char;
        i += 1;
      } while (i < source.length);
      return value;
    }
    function getQuotedAttributeValue() {
      const quotemark2 = source[i++];
      let value = "";
      let escaped = false;
      while (i < source.length) {
        const char = source[i++];
        if (char === quotemark2 && !escaped) return value;
        if (char === "\\" && !escaped) escaped = true;
        value += escaped ? `\\${char}` : char;
        escaped = false;
      }
    }
    function allowSpaces() {
      while (i < source.length && whitespace.test(source[i])) i += 1;
    }
    let i = metadata.length;
    while (i < source.length) {
      if (!state) error("Unexpected character");
      state = state();
      i += 1;
    }
    if (state !== neutral) error("Unexpected end of input");
    if (root.tagName === "svg") root.metadata = header;
    return {
      type: "root",
      children: [root]
    };
  }

  // node_modules/@allmaps/stdlib/dist/svg.js
  function isSvgCircle(input) {
    return input.type === "circle";
  }
  function isSvgLine(input) {
    return input.type === "line";
  }
  function isSvgPolyLine(input) {
    return input.type === "polyline";
  }
  function isSvgRect(input) {
    return input.type === "rect";
  }
  function isSvgPolygon(input) {
    return input.type === "polygon";
  }
  function* stringToSvgGeometriesGenerator(svg) {
    function* helper(node) {
      if ("children" in node) {
        for (const childNode of node.children) {
          if (typeof childNode !== "string") {
            yield* helper(childNode);
          }
        }
      }
      yield node;
    }
    const parsedSvg = parse(svg);
    for (const node of helper(parsedSvg)) {
      if ("tagName" in node) {
        if (node.tagName !== "svg" && node.tagName !== "g") {
          const geometry = getNodeSvgGeometry(node);
          if (geometry) {
            yield geometry;
          }
        }
      }
    }
  }
  function getNodeSvgGeometry(node) {
    const tag = node?.tagName?.toLowerCase();
    if (tag === "circle") {
      return {
        type: "circle",
        coordinates: [
          getNodeNumberProperty(node, "cx"),
          getNodeNumberProperty(node, "cy")
        ]
      };
    } else if (tag === "line") {
      return {
        type: "line",
        coordinates: [
          [getNodeNumberProperty(node, "x1"), getNodeNumberProperty(node, "y1")],
          [getNodeNumberProperty(node, "x2"), getNodeNumberProperty(node, "y2")]
        ]
      };
    } else if (tag === "polyline") {
      return {
        type: "polyline",
        coordinates: getNodePoints(node)
      };
    } else if (tag === "polygon") {
      return {
        type: "polygon",
        coordinates: getNodePoints(node)
      };
    } else if (tag === "rect") {
      return {
        type: "rect",
        coordinates: [
          [getNodeNumberProperty(node, "x"), getNodeNumberProperty(node, "y")],
          [
            getNodeNumberProperty(node, "x") + getNodeNumberProperty(node, "width"),
            getNodeNumberProperty(node, "y")
          ],
          [
            getNodeNumberProperty(node, "x") + getNodeNumberProperty(node, "width"),
            getNodeNumberProperty(node, "y") + getNodeNumberProperty(node, "height")
          ],
          [
            getNodeNumberProperty(node, "x"),
            getNodeNumberProperty(node, "y") + getNodeNumberProperty(node, "height")
          ],
          [getNodeNumberProperty(node, "x"), getNodeNumberProperty(node, "y")]
        ]
      };
    } else {
      throw new Error(`Unsupported SVG element: ${tag}`);
    }
  }
  function getNodeNumberProperty(node, prop) {
    const value = node?.properties?.[prop];
    return Number(value) || 0;
  }
  function getNodePoints(node) {
    const points = node?.properties?.points;
    if (points) {
      return String(points).trim().split(/\s+/).map((coordStr) => {
        const coord = coordStr.split(",").map((numberStr) => Number(numberStr));
        return [coord[0], coord[1]];
      });
    }
    return [];
  }
  function pointsToString(coordinates) {
    return coordinates.map((coordinate) => coordinate.join(",")).join(" ");
  }
  function svgGeometriesToSvgString(geometries) {
    return `<svg xmlns="http://www.w3.org/2000/svg">
  ${geometries.map(svgGeometryToString).join("\n")}
</svg>`;
  }
  function svgGeometryToString(geometry) {
    if (geometry.type === "circle") {
      return elementToString("circle", {
        ...geometry.attributes,
        cx: geometry.coordinates[0],
        cy: geometry.coordinates[1]
      });
    } else if (geometry.type === "line") {
      return elementToString("line", {
        ...geometry.attributes,
        x1: geometry.coordinates[0][0],
        y1: geometry.coordinates[0][1],
        x2: geometry.coordinates[1][0],
        y2: geometry.coordinates[1][1]
      });
    } else if (geometry.type === "polyline") {
      return elementToString("polyline", {
        ...geometry.attributes,
        points: pointsToString(geometry.coordinates)
      });
    } else if (geometry.type === "polygon") {
      return elementToString("polygon", {
        ...geometry.attributes,
        points: pointsToString(geometry.coordinates)
      });
    } else if (geometry.type === "rect") {
      return elementToString("rect", {
        ...geometry.attributes,
        x: geometry.coordinates[0][0],
        y: geometry.coordinates[0][1],
        width: geometry.coordinates[1][0] - geometry.coordinates[0][0],
        height: geometry.coordinates[2][1] - geometry.coordinates[0][1]
      });
    } else {
      throw new Error("Unknown SVG element");
    }
  }
  function elementToString(tag, attributes) {
    const attributeStrings = Object.entries(attributes).map(([key, value]) => `${key}="${value}"`);
    return `<${tag} ${attributeStrings.join(" ")} />`;
  }
  function svgGeometryToGeometry(svgGeometry) {
    if (isSvgCircle(svgGeometry)) {
      return svgGeometry.coordinates;
    } else if (isSvgLine(svgGeometry)) {
      return svgGeometry.coordinates;
    } else if (isSvgPolyLine(svgGeometry)) {
      return svgGeometry.coordinates;
    } else if (isSvgRect(svgGeometry)) {
      return [svgGeometry.coordinates];
    } else if (isSvgPolygon(svgGeometry)) {
      return [svgGeometry.coordinates];
    } else {
      throw new Error(`Unsupported SVG geometry`);
    }
  }

  // node_modules/@allmaps/transform/dist/shared/distortion.js
  var supportedDistortionMeasures = [
    "log2sigma",
    "twoOmega",
    "airyKavr",
    "signDetJ",
    "thetaa"
  ];
  function computeDistortionsFromPartialDerivatives(distortionMeasures, partialDerivativeX, partialDerivativeY, referenceScale = 1) {
    if (distortionMeasures.length === 0) {
      return /* @__PURE__ */ new Map();
    }
    if (!partialDerivativeX || !partialDerivativeY) {
      return new Map(distortionMeasures.map((distortionMeasure) => [distortionMeasure, 0]));
    }
    const { E, F, a, b } = computeDistortionIntermediates(partialDerivativeX, partialDerivativeY);
    return new Map(distortionMeasures.map((distortionMeasure) => {
      if (supportedDistortionMeasures.indexOf(distortionMeasure) === -1) {
        throw new Error("Distortion " + distortionMeasure + " not supported");
      }
      switch (supportedDistortionMeasures.indexOf(distortionMeasure)) {
        case 0:
          return [distortionMeasure, log2sigma(a, b, referenceScale)];
        case 1:
          return [distortionMeasure, twoOmega(a, b)];
        case 2:
          return [distortionMeasure, airyKavr(a, b, referenceScale)];
        case 3:
          return [
            distortionMeasure,
            signDetJ(partialDerivativeX, partialDerivativeY)
          ];
        case 4:
          return [distortionMeasure, thetaa(partialDerivativeX, a, b, E, F)];
        default:
          return [distortionMeasure, 0];
      }
    }));
  }
  function computeDistortionIntermediates(partialDerivativeX, partialDerivativeY) {
    const E = partialDerivativeX[0] ** 2 + partialDerivativeX[1] ** 2;
    const F = partialDerivativeX[0] * partialDerivativeY[0] + partialDerivativeX[1] * partialDerivativeY[1];
    const G = partialDerivativeY[0] ** 2 + partialDerivativeY[1] ** 2;
    const a = Math.sqrt(0.5 * (E + G + Math.sqrt((E - G) ** 2 + 4 * F ** 2)));
    const b = Math.sqrt(0.5 * (E + G - Math.sqrt((E - G) ** 2 + 4 * F ** 2)));
    return { E, F, G, a, b };
  }
  function log2sigma(a, b, referenceScale = 1) {
    return (Math.log(a * b) - 2 * Math.log(referenceScale)) / Math.log(2);
  }
  function twoOmega(a, b) {
    return 2 * Math.asin((a - b) / (a + b));
  }
  function airyKavr(a, b, referenceScale = 1) {
    return 0.5 * (Math.log(a / referenceScale) ** 2 + Math.log(b / referenceScale) ** 2);
  }
  function signDetJ(partialDerivativeX, partialDerivativeY) {
    return Math.sign(partialDerivativeX[0] * partialDerivativeY[1] - partialDerivativeX[1] * partialDerivativeY[0]);
  }
  function thetaa(partialDerivativeX, a, b, E, F) {
    const thetaxp = Math.atan(partialDerivativeX[1] / partialDerivativeX[0]);
    const alphap = Math.sign(-F) * Math.asin(Math.sqrt((1 - a ** 2 / E) / (1 - (a / b) ** 2)));
    return thetaxp - alphap;
  }

  // node_modules/@allmaps/transform/dist/transformation-types/BaseTransformation.js
  var BaseTransformation = class {
    sourcePoints;
    destinationPoints;
    destinationTransformedSourcePoints;
    type;
    pointCount;
    pointCountMinimum;
    errors;
    destinationRmse;
    /**
     * Create a transformation
     *
     * @param sourcePoints - The source points
     * @param destinationPoints - The destination points
     * @param type - The transformation type
     * @param pointCountMinimum - The minimum number of points for the transformation type
     */
    constructor(sourcePoints, destinationPoints, type, pointCountMinimum) {
      this.sourcePoints = sourcePoints;
      this.destinationPoints = destinationPoints;
      this.pointCount = this.sourcePoints.length;
      this.type = type;
      this.pointCountMinimum = pointCountMinimum;
      if (this.pointCount < this.pointCountMinimum) {
        throw new Error("Not enough control points. A " + this.type + " transformation requires a minimum of " + this.pointCountMinimum + " points, but " + this.pointCount + " are given.");
      }
    }
    /**
     * Set weights.
     *
     * The weights might be obtained in other ways then through solving
     * (e.g. through solving multiple transformation together when staping).
     * This function can be used to set weights computed elsewhere.
     */
    setWeightsArrays(weightsArrays) {
      this.weightsArrays = weightsArrays;
      this.processWeightsArrays();
    }
    processWeightsArrays() {
      return;
    }
    /**
     * Get the destination-transformed source points.
     *
     * @returns source points, transformed to destination domain
     */
    getDestinationTransformedSourcePoints() {
      if (!this.destinationTransformedSourcePoints) {
        this.destinationTransformedSourcePoints = this.sourcePoints.map((sourcePoint) => this.evaluateFunction(sourcePoint));
      }
      return this.destinationTransformedSourcePoints;
    }
    getMeasures() {
      return {};
    }
    getErrors() {
      if (!this.errors) {
        const destinationTransformedSourcePoints = this.getDestinationTransformedSourcePoints();
        this.errors = this.destinationPoints.map((destinationPoint, index) => distance(destinationPoint, destinationTransformedSourcePoints[index]));
      }
      return this.errors;
    }
    getDestinationRmse() {
      if (!this.destinationRmse) {
        const destinationTransformedSourcePoints = this.getDestinationTransformedSourcePoints();
        if (!this.destinationTransformedSourcePoints) {
          this.getDestinationTransformedSourcePoints();
        }
        this.destinationRmse = rms(this.destinationPoints, destinationTransformedSourcePoints);
      }
      return this.destinationRmse;
    }
  };

  // node_modules/@allmaps/transform/dist/transformation-types/BaseLinearWeightsTransformation.js
  var BaseLinearWeightsTransformation = class extends BaseTransformation {
    destinationPointsArrays;
    constructor(sourcePoints, destinationPoints, type, pointCountMinimum) {
      super(sourcePoints, destinationPoints, type, pointCountMinimum);
      this.destinationPointsArrays = this.getDestinationPointsArrays();
    }
  };

  // node_modules/ml-matrix/matrix.mjs
  var matrix = __toESM(require_matrix(), 1);
  var SingularValueDecomposition2 = matrix.SingularValueDecomposition;
  var matrix_default = matrix.default.Matrix ? matrix.default.Matrix : matrix.Matrix;
  var inverse2 = matrix.inverse;
  var pseudoInverse2 = matrix.pseudoInverse;

  // node_modules/@allmaps/transform/dist/shared/solve-functions.js
  function solveJointlyPseudoInverse(coefsArrayMatrices, destinationPointsArrays) {
    const coefsMatrix = new matrix_default([
      ...coefsArrayMatrices[0],
      ...coefsArrayMatrices[1]
    ]);
    const destinationPointsMatrix = matrix_default.columnVector([
      ...destinationPointsArrays[0],
      ...destinationPointsArrays[1]
    ]);
    const pseudoInverseCoefsMatrix = pseudoInverse2(coefsMatrix);
    const weightsMatrix = pseudoInverseCoefsMatrix.mmul(destinationPointsMatrix);
    const weightsArray = weightsMatrix.to1DArray();
    return weightsArray;
  }
  function solveIndependentlyPseudoInverse(coefsArrayMatrix, destinationPointsArrays) {
    const coefsMatrix = new matrix_default(coefsArrayMatrix);
    const destinationPointsMatrices = [
      matrix_default.columnVector(destinationPointsArrays[0]),
      matrix_default.columnVector(destinationPointsArrays[1])
    ];
    const pseudoInverseCoefsMatrix = pseudoInverse2(coefsMatrix);
    const weightsMatrices = [
      pseudoInverseCoefsMatrix.mmul(destinationPointsMatrices[0]),
      pseudoInverseCoefsMatrix.mmul(destinationPointsMatrices[1])
    ];
    const weightsArrays = weightsMatrices.map((matrix2) => matrix2.to1DArray());
    return weightsArrays;
  }
  function solveIndependentlyInverse(coefsArrayMatrix, destinationPointsArrays) {
    const coefsMatrix = new matrix_default(coefsArrayMatrix);
    const destinationPointsMatrices = [
      matrix_default.columnVector(destinationPointsArrays[0]),
      matrix_default.columnVector(destinationPointsArrays[1])
    ];
    const inverseCoefsMatrix = inverse2(coefsMatrix);
    const weightsMatrices = [
      inverseCoefsMatrix.mmul(destinationPointsMatrices[0]),
      inverseCoefsMatrix.mmul(destinationPointsMatrices[1])
    ];
    const weightsArrays = weightsMatrices.map((matrix2) => matrix2.to1DArray());
    return weightsArrays;
  }
  function solveJointlySvd(coefsArrayMatrices, pointCount) {
    const coefsMatrix = [];
    for (let i = 0; i < pointCount; i++) {
      coefsMatrix.push(coefsArrayMatrices[0][i]);
      coefsMatrix.push(coefsArrayMatrices[1][i]);
    }
    const svdCoefsMatrix = new SingularValueDecomposition2(coefsMatrix);
    const weightsMatrix = matrix_default.from1DArray(3, 3, svdCoefsMatrix.rightSingularVectors.getColumn(8)).transpose();
    const weightsArrays = weightsMatrix.to2DArray();
    return weightsArrays;
  }

  // node_modules/@allmaps/transform/dist/transformation-types/Helmert.js
  var Helmert = class extends BaseLinearWeightsTransformation {
    coefsArrayMatrices;
    coefsArrayMatricesSize;
    weightsArray;
    weightsArrays;
    constructor(sourcePoints, destinationPoints) {
      super(sourcePoints, destinationPoints, "helmert", 2);
      this.coefsArrayMatrices = this.getCoefsArrayMatrices();
      this.coefsArrayMatricesSize = this.coefsArrayMatrices.map((coefsArrayMatrix) => arrayMatrixSize(coefsArrayMatrix));
    }
    getDestinationPointsArrays() {
      return [
        this.destinationPoints.map((value) => value[0]),
        this.destinationPoints.map((value) => value[1])
      ];
    }
    getCoefsArrayMatrices() {
      let coefsArrayMatrix0 = newArrayMatrix(this.pointCount, 4, 0);
      let coefsArrayMatrix1 = newArrayMatrix(this.pointCount, 4, 0);
      for (let i = 0; i < this.pointCount; i++) {
        const sourcePointCoefsArrays = this.getSourcePointCoefsArrays(this.sourcePoints[i]);
        coefsArrayMatrix0 = pasteArrayMatrix(coefsArrayMatrix0, i, 0, [
          sourcePointCoefsArrays[0]
        ]);
        coefsArrayMatrix1 = pasteArrayMatrix(coefsArrayMatrix1, i, 0, [
          sourcePointCoefsArrays[1]
        ]);
      }
      return [coefsArrayMatrix0, coefsArrayMatrix1];
    }
    /**
     * Get two 1x4 coefsArrays, populating the 2Nx4 coefsArrayMatrices
     * 1 0 x0 -y0
     * 1 0 x1 -y1
     * ...
     * 0 1 y0 x0
     * 0 1 y1 x1
     * ...
     *
     * @param sourcePoint
     */
    getSourcePointCoefsArrays(sourcePoint) {
      return [
        [1, 0, sourcePoint[0], -sourcePoint[1]],
        [0, 1, sourcePoint[1], sourcePoint[0]]
      ];
    }
    solve() {
      this.weightsArray = solveJointlyPseudoInverse(this.coefsArrayMatrices, this.destinationPointsArrays);
      this.weightsArrays = [this.weightsArray, this.weightsArray];
    }
    getMeasures() {
      if (!this.weightsArrays) {
        this.solve();
      }
      if (!this.weightsArray) {
        throw new Error("Helmert weights not computed");
      }
      const measures = {};
      measures.scale = Math.sqrt(this.weightsArray[2] ** 2 + this.weightsArray[3] ** 2);
      measures.rotation = Math.atan2(this.weightsArray[3], this.weightsArray[2]);
      measures.translation = [this.weightsArray[0], this.weightsArray[1]];
      return measures;
    }
    evaluateFunction(newSourcePoint) {
      if (!this.weightsArrays) {
        this.solve();
      }
      if (!this.weightsArray) {
        throw new Error("Helmert weights not computed");
      }
      const newDestinationPoint = [
        this.weightsArray[0] + this.weightsArray[2] * newSourcePoint[0] - this.weightsArray[3] * newSourcePoint[1],
        this.weightsArray[1] + this.weightsArray[2] * newSourcePoint[1] + this.weightsArray[3] * newSourcePoint[0]
      ];
      return newDestinationPoint;
    }
    evaluatePartialDerivativeX(_newSourcePoint) {
      if (!this.weightsArrays) {
        this.solve();
      }
      if (!this.weightsArray) {
        throw new Error("Helmert weights not computed");
      }
      const newDestinationPointPartDerX = [
        this.weightsArray[2],
        this.weightsArray[3]
      ];
      return newDestinationPointPartDerX;
    }
    evaluatePartialDerivativeY(_newSourcePoint) {
      if (!this.weightsArrays) {
        this.solve();
      }
      if (!this.weightsArray) {
        throw new Error("Helmert weights not computed");
      }
      const newDestinationPointPartDerY = [
        -this.weightsArray[3],
        this.weightsArray[2]
      ];
      return newDestinationPointPartDerY;
    }
    getTransformationDataAsFloat64Array() {
      if (!this.weightsArray) {
        this.solve();
      }
      if (!this.weightsArray) {
        throw new Error("Helmert weights not computed");
      }
      return {
        weights: new Float64Array(this.weightsArray),
        sourcePoints: new Float64Array(0)
      };
    }
  };

  // node_modules/@allmaps/transform/dist/transformation-types/Straight.js
  var Straight = class extends BaseTransformation {
    weightsArrays;
    constructor(sourcePoints, destinationPoints) {
      super(sourcePoints, destinationPoints, "straight", 2);
    }
    /** Solve the x and y components jointly.
     *
     * This computes the corresponding Helmert transform and get the scale from it.
     */
    solve() {
      const helmertTransformation = new Helmert(this.sourcePoints, this.destinationPoints);
      const scale = helmertTransformation.getMeasures().scale;
      const sourcePointsCenter = this.sourcePoints.reduce((center, point) => [center[0] + point[0], center[1] + point[1]]).map((coordinate) => coordinate / this.pointCount);
      const destinationPointsCenter = this.destinationPoints.reduce((center, point) => [center[0] + point[0], center[1] + point[1]]).map((coordinate) => coordinate / this.pointCount);
      const translation = destinationPointsCenter.map((coord, i) => coord - sourcePointsCenter[i] * scale);
      this.weightsArrays = {
        scale,
        sourcePointsCenter,
        destinationPointsCenter,
        translation
      };
    }
    // Evaluate the transformation function at a new point
    evaluateFunction(newSourcePoint) {
      if (!this.weightsArrays) {
        this.solve();
      }
      if (!this.weightsArrays) {
        throw new Error("Weights not computed");
      }
      const newDestinationPoint = [
        this.weightsArrays.translation[0] + this.weightsArrays.scale * newSourcePoint[0],
        this.weightsArrays.translation[1] + this.weightsArrays.scale * newSourcePoint[1]
      ];
      return newDestinationPoint;
    }
    // Evaluate the transformation function's partial derivative to x at a new point
    evaluatePartialDerivativeX(_newSourcePoint) {
      if (!this.weightsArrays) {
        this.solve();
      }
      if (!this.weightsArrays) {
        throw new Error("Weights not computed");
      }
      const newDestinationPointPartDerX = [this.weightsArrays.scale, 0];
      return newDestinationPointPartDerX;
    }
    // Evaluate the transformation function's partial derivative to y at a new point
    evaluatePartialDerivativeY(_newSourcePoint) {
      if (!this.weightsArrays) {
        this.solve();
      }
      if (!this.weightsArrays) {
        throw new Error("Weights not computed");
      }
      const newDestinationPointPartDerY = [0, this.weightsArrays.scale];
      return newDestinationPointPartDerY;
    }
    getTransformationDataAsFloat64Array() {
      if (!this.weightsArrays) {
        this.solve();
      }
      if (!this.weightsArrays) {
        throw new Error("Weights not computed");
      }
      return {
        weights: new Float64Array([
          this.weightsArrays.translation[0],
          this.weightsArrays.translation[1],
          this.weightsArrays.scale
        ]),
        sourcePoints: new Float64Array(0)
      };
    }
  };

  // node_modules/@allmaps/transform/dist/transformation-types/BaseIndependentLinearWeightsTransformation.js
  var BaseIndependentLinearWeightsTransformation = class extends BaseLinearWeightsTransformation {
    constructor(sourcePoints, destinationPoints, type, pointCountMinimum) {
      super(sourcePoints, destinationPoints, type, pointCountMinimum);
    }
    getCoefsArrayMatrices() {
      const coefsArrayMatrix = this.getCoefsArrayMatrix();
      return [coefsArrayMatrix, coefsArrayMatrix];
    }
    getSourcePointCoefsArrays(sourcePoint) {
      const sourcePointCoefsArray = this.getSourcePointCoefsArray(sourcePoint);
      return [sourcePointCoefsArray, sourcePointCoefsArray];
    }
  };

  // node_modules/@allmaps/transform/dist/transformation-types/BasePolynomialTransformation.js
  var BasePolynomialTransformation = class extends BaseIndependentLinearWeightsTransformation {
    coefsArrayMatrices;
    coefsArrayMatrix;
    coefsArrayMatricesSize;
    coefsArrayMatrixSize;
    order;
    weightsArrays;
    constructor(sourcePoints, destinationPoints, order) {
      order = order || 1;
      const pointsCountMinimum = (order + 1) * (order + 2) / 2;
      super(sourcePoints, destinationPoints, "polynomial" + order, pointsCountMinimum);
      this.order = order;
      if (this.order < 1 || this.order > 3) {
        throw new Error("Only polynomial transformations of order 1, 2 or 3 are supported");
      }
      this.coefsArrayMatrices = this.getCoefsArrayMatrices();
      this.coefsArrayMatrix = this.coefsArrayMatrices[0];
      this.coefsArrayMatricesSize = this.coefsArrayMatrices.map((coefsArrayMatrix) => arrayMatrixSize(coefsArrayMatrix));
      this.coefsArrayMatrixSize = arrayMatrixSize(this.coefsArrayMatrix);
    }
    getDestinationPointsArrays() {
      return [
        this.destinationPoints.map((value) => value[0]),
        this.destinationPoints.map((value) => value[1])
      ];
    }
    getCoefsArrayMatrix() {
      let coefsArrayArray = newArrayMatrix(this.pointCount, this.pointCountMinimum, 0);
      for (let i = 0; i < this.pointCount; i++) {
        coefsArrayArray = pasteArrayMatrix(coefsArrayArray, i, 0, [
          this.getSourcePointCoefsArray(this.sourcePoints[i])
        ]);
      }
      return coefsArrayArray;
    }
    solve() {
      this.weightsArrays = solveIndependentlyPseudoInverse(this.coefsArrayMatrix, this.destinationPointsArrays);
    }
    getTransformationDataAsFloat64Array() {
      if (!this.weightsArrays) {
        this.solve();
      }
      if (!this.weightsArrays) {
        throw new Error("Polynomial transformation weights not computed");
      }
      return {
        weights: new Float64Array([
          ...this.weightsArrays[0],
          ...this.weightsArrays[1]
        ]),
        sourcePoints: new Float64Array(0)
      };
    }
  };

  // node_modules/@allmaps/transform/dist/transformation-types/Polynomial1.js
  var Polynomial1 = class _Polynomial1 extends BasePolynomialTransformation {
    constructor(sourcePoints, destinationPoints) {
      super(sourcePoints, destinationPoints, 1);
    }
    getSourcePointCoefsArray(sourcePoint) {
      return _Polynomial1.getPolynomial1SourcePointCoefsArray(sourcePoint);
    }
    /**
     * Get 1x3 coefsArray, populating the Nx3 coefsArrayMatrix
     * 1 x0 y0
     * 1 x1 y1
     * 1 x2 y2
     * ...
     *
     * @param sourcePoint
     */
    static getPolynomial1SourcePointCoefsArray(sourcePoint) {
      return [1, sourcePoint[0], sourcePoint[1]];
    }
    getHomogeneousTransform() {
      if (!this.weightsArrays) {
        return void 0;
      }
      return [
        this.weightsArrays[0][1],
        this.weightsArrays[1][1],
        this.weightsArrays[0][2],
        this.weightsArrays[1][2],
        this.weightsArrays[0][0],
        this.weightsArrays[1][0]
      ];
    }
    setWeightsArraysFromHomogeneousTransform(homogeneousTransform) {
      this.weightsArrays = [
        [
          homogeneousTransform[4],
          homogeneousTransform[0],
          homogeneousTransform[2]
        ],
        [
          homogeneousTransform[5],
          homogeneousTransform[1],
          homogeneousTransform[3]
        ]
      ];
    }
    getMeasures() {
      if (!this.weightsArrays) {
        this.solve();
      }
      if (!this.weightsArrays) {
        throw new Error("Weights not computed");
      }
      const measures = {};
      measures.translation = [this.weightsArrays[0][0], this.weightsArrays[1][0]];
      const a = this.weightsArrays[0][1];
      const b = this.weightsArrays[1][1];
      const c = this.weightsArrays[0][2];
      const d = this.weightsArrays[1][2];
      const delta = a * d - b * c;
      if (a != 0 || b != 0) {
        const r = Math.sqrt(a * a + b * b);
        measures.rotation = b > 0 ? Math.acos(a / r) : -Math.acos(a / r);
        measures.scales = [r, delta / r];
        measures.shears = [Math.atan((a * c + b * d) / (r * r)), 0];
      } else if (c != 0 || d != 0) {
        const s = Math.sqrt(c * c + d * d);
        measures.rotation = Math.PI / 2 - (d > 0 ? Math.acos(-c / s) : -Math.acos(c / s));
        measures.scales = [delta / s, s];
        measures.shears = [0, Math.atan((a * c + b * d) / (s * s))];
      } else {
      }
      return measures;
    }
    evaluateFunction(newSourcePoint) {
      if (!this.weightsArrays) {
        this.solve();
      }
      if (!this.weightsArrays) {
        throw new Error("Weights not computed");
      }
      const newDestinationPoint = [0, 0];
      for (let i = 0; i < 2; i++) {
        newDestinationPoint[i] += this.weightsArrays[i][0] + this.weightsArrays[i][1] * newSourcePoint[0] + this.weightsArrays[i][2] * newSourcePoint[1];
      }
      return newDestinationPoint;
    }
    evaluatePartialDerivativeX(_newSourcePoint) {
      if (!this.weightsArrays) {
        this.solve();
      }
      if (!this.weightsArrays) {
        throw new Error("Weights not computed");
      }
      const newDestinationPointPartDerX = [0, 0];
      for (let i = 0; i < 2; i++) {
        newDestinationPointPartDerX[i] += this.weightsArrays[i][1];
      }
      return newDestinationPointPartDerX;
    }
    evaluatePartialDerivativeY(_newSourcePoint) {
      if (!this.weightsArrays) {
        this.solve();
      }
      if (!this.weightsArrays) {
        throw new Error("Weights not computed");
      }
      const newDestinationPointPartDerY = [0, 0];
      for (let i = 0; i < 2; i++) {
        newDestinationPointPartDerY[i] += this.weightsArrays[i][2];
      }
      return newDestinationPointPartDerY;
    }
  };

  // node_modules/@allmaps/transform/dist/transformation-types/Polynomial2.js
  var Polynomial2 = class _Polynomial2 extends BasePolynomialTransformation {
    constructor(sourcePoints, destinationPoints) {
      super(sourcePoints, destinationPoints, 2);
    }
    getSourcePointCoefsArray(sourcePoint) {
      return _Polynomial2.getPolynomial2SourcePointCoefsArray(sourcePoint);
    }
    /**
     * Get 1x3 coefsArray, populating the Nx3 coefsArrayMatrix
     * 1 x0 y0 x0^2 y0^2 x0*y0
     * ...
     *
     * @param sourcePoint
     */
    static getPolynomial2SourcePointCoefsArray(sourcePoint) {
      return [
        1,
        sourcePoint[0],
        sourcePoint[1],
        sourcePoint[0] ** 2,
        sourcePoint[1] ** 2,
        sourcePoint[0] * sourcePoint[1]
      ];
    }
    // Evaluate the transformation function at a new point
    evaluateFunction(newSourcePoint) {
      if (!this.weightsArrays) {
        this.solve();
      }
      if (!this.weightsArrays) {
        throw new Error("Weights not computed");
      }
      const newDestinationPoint = [0, 0];
      for (let i = 0; i < 2; i++) {
        newDestinationPoint[i] += this.weightsArrays[i][0] + this.weightsArrays[i][1] * newSourcePoint[0] + this.weightsArrays[i][2] * newSourcePoint[1] + this.weightsArrays[i][3] * newSourcePoint[0] ** 2 + this.weightsArrays[i][4] * newSourcePoint[1] ** 2 + this.weightsArrays[i][5] * newSourcePoint[0] * newSourcePoint[1];
      }
      return newDestinationPoint;
    }
    // Evaluate the transformation function's partial derivative to x at a new point
    evaluatePartialDerivativeX(newSourcePoint) {
      if (!this.weightsArrays) {
        this.solve();
      }
      if (!this.weightsArrays) {
        throw new Error("Weights not computed");
      }
      const newDestinationPointPartDerX = [0, 0];
      for (let i = 0; i < 2; i++) {
        newDestinationPointPartDerX[i] += this.weightsArrays[i][1] + 2 * this.weightsArrays[i][3] * newSourcePoint[0] + this.weightsArrays[i][5] * newSourcePoint[1];
      }
      return newDestinationPointPartDerX;
    }
    // Evaluate the transformation function's partial derivative to x at a new point
    evaluatePartialDerivativeY(newSourcePoint) {
      if (!this.weightsArrays) {
        this.solve();
      }
      if (!this.weightsArrays) {
        throw new Error("Weights not computed");
      }
      const newDestinationPointPartDerY = [0, 0];
      for (let i = 0; i < 2; i++) {
        newDestinationPointPartDerY[i] += this.weightsArrays[i][2] + 2 * this.weightsArrays[i][4] * newSourcePoint[1] + this.weightsArrays[i][5] * newSourcePoint[0];
      }
      return newDestinationPointPartDerY;
    }
  };

  // node_modules/@allmaps/transform/dist/transformation-types/Polynomial3.js
  var Polynomial3 = class _Polynomial3 extends BasePolynomialTransformation {
    constructor(sourcePoints, destinationPoints) {
      super(sourcePoints, destinationPoints, 3);
    }
    getSourcePointCoefsArray(sourcePoint) {
      return _Polynomial3.getPolynomial3SourcePointCoefsArray(sourcePoint);
    }
    /**
     * Get 1x3 coefsArray, populating the Nx3 coefsArrayMatrix
     * 1 x0 y0 x0^2 y0^2 x0*y0 x0^3 y0^3 x0^2*y0 x0*y0^2
     * ...
     *
     * @param sourcePoint
     */
    static getPolynomial3SourcePointCoefsArray(sourcePoint) {
      return [
        1,
        sourcePoint[0],
        sourcePoint[1],
        sourcePoint[0] ** 2,
        sourcePoint[1] ** 2,
        sourcePoint[0] * sourcePoint[1],
        sourcePoint[0] ** 3,
        sourcePoint[1] ** 3,
        sourcePoint[0] ** 2 * sourcePoint[1],
        sourcePoint[0] * sourcePoint[1] ** 2
      ];
    }
    // Evaluate the transformation function at a new point
    evaluateFunction(newSourcePoint) {
      if (!this.weightsArrays) {
        this.solve();
      }
      if (!this.weightsArrays) {
        throw new Error("Weights not computed");
      }
      const newDestinationPoint = [0, 0];
      for (let i = 0; i < 2; i++) {
        newDestinationPoint[i] += this.weightsArrays[i][0] + this.weightsArrays[i][1] * newSourcePoint[0] + this.weightsArrays[i][2] * newSourcePoint[1] + this.weightsArrays[i][3] * newSourcePoint[0] ** 2 + this.weightsArrays[i][4] * newSourcePoint[1] ** 2 + this.weightsArrays[i][5] * newSourcePoint[0] * newSourcePoint[1] + this.weightsArrays[i][6] * newSourcePoint[0] ** 3 + this.weightsArrays[i][7] * newSourcePoint[1] ** 3 + this.weightsArrays[i][8] * newSourcePoint[0] ** 2 * newSourcePoint[1] + this.weightsArrays[i][9] * newSourcePoint[0] * newSourcePoint[1] ** 2;
      }
      return newDestinationPoint;
    }
    // Evaluate the transformation function's partial derivative to x at a new point
    evaluatePartialDerivativeX(newSourcePoint) {
      if (!this.weightsArrays) {
        this.solve();
      }
      if (!this.weightsArrays) {
        throw new Error("Weights not computed");
      }
      const newDestinationPointPartDerX = [0, 0];
      for (let i = 0; i < 2; i++) {
        newDestinationPointPartDerX[i] += this.weightsArrays[i][1] + 2 * this.weightsArrays[i][3] * newSourcePoint[0] + this.weightsArrays[i][5] * newSourcePoint[1] + 3 * this.weightsArrays[i][6] * newSourcePoint[0] ** 2 + 2 * this.weightsArrays[i][8] * newSourcePoint[0] * newSourcePoint[1] + this.weightsArrays[i][9] * newSourcePoint[1] ** 2;
      }
      return newDestinationPointPartDerX;
    }
    // Evaluate the transformation function's partial derivative to x at a new point
    evaluatePartialDerivativeY(newSourcePoint) {
      if (!this.weightsArrays) {
        this.solve();
      }
      if (!this.weightsArrays) {
        throw new Error("Weights not computed");
      }
      const newDestinationPointPartDerY = [0, 0];
      for (let i = 0; i < 2; i++) {
        newDestinationPointPartDerY[i] += this.weightsArrays[i][2] + 2 * this.weightsArrays[i][4] * newSourcePoint[1] + this.weightsArrays[i][5] * newSourcePoint[0] + 3 * this.weightsArrays[i][7] * newSourcePoint[1] ** 2 + this.weightsArrays[i][8] * newSourcePoint[0] ** 2 + 2 * this.weightsArrays[i][9] * newSourcePoint[0] * newSourcePoint[1];
      }
      return newDestinationPointPartDerY;
    }
  };

  // node_modules/@allmaps/transform/dist/transformation-types/Projective.js
  var Projective = class extends BaseTransformation {
    coefsArrayMatrices;
    weightsArrays;
    constructor(sourcePoints, destinationPoints) {
      super(sourcePoints, destinationPoints, "projective", 4);
      this.coefsArrayMatrices = [
        newArrayMatrix(this.pointCount, 9, 0),
        newArrayMatrix(this.pointCount, 9, 0)
      ];
      for (let i = 0; i < this.pointCount; i++) {
        this.coefsArrayMatrices[0][i][0] = -sourcePoints[i][0];
        this.coefsArrayMatrices[0][i][1] = -sourcePoints[i][1];
        this.coefsArrayMatrices[0][i][2] = -1;
        this.coefsArrayMatrices[0][i][3] = 0;
        this.coefsArrayMatrices[0][i][4] = 0;
        this.coefsArrayMatrices[0][i][5] = 0;
        this.coefsArrayMatrices[0][i][6] = destinationPoints[i][0] * sourcePoints[i][0];
        this.coefsArrayMatrices[0][i][7] = destinationPoints[i][0] * sourcePoints[i][1];
        this.coefsArrayMatrices[0][i][8] = destinationPoints[i][0];
        this.coefsArrayMatrices[1][i][0] = 0;
        this.coefsArrayMatrices[1][i][1] = 0;
        this.coefsArrayMatrices[1][i][2] = 0;
        this.coefsArrayMatrices[1][i][3] = -sourcePoints[i][0];
        this.coefsArrayMatrices[1][i][4] = -sourcePoints[i][1];
        this.coefsArrayMatrices[1][i][5] = -1;
        this.coefsArrayMatrices[1][i][6] = destinationPoints[i][1] * sourcePoints[i][0];
        this.coefsArrayMatrices[1][i][7] = destinationPoints[i][1] * sourcePoints[i][1];
        this.coefsArrayMatrices[1][i][8] = destinationPoints[i][1];
      }
    }
    solve() {
      this.weightsArrays = solveJointlySvd(this.coefsArrayMatrices, this.pointCount);
    }
    evaluateFunction(newSourcePoint) {
      if (!this.weightsArrays) {
        this.solve();
      }
      if (!this.weightsArrays) {
        throw new Error("Weights not computed");
      }
      const c = this.weightsArrays[0][2] * newSourcePoint[0] + this.weightsArrays[1][2] * newSourcePoint[1] + this.weightsArrays[2][2];
      const num1 = this.weightsArrays[0][0] * newSourcePoint[0] + this.weightsArrays[1][0] * newSourcePoint[1] + this.weightsArrays[2][0];
      const num2 = this.weightsArrays[0][1] * newSourcePoint[0] + this.weightsArrays[1][1] * newSourcePoint[1] + this.weightsArrays[2][1];
      const newDestinationPoint = [num1 / c, num2 / c];
      return newDestinationPoint;
    }
    evaluatePartialDerivativeX(newSourcePoint) {
      if (!this.weightsArrays) {
        this.solve();
      }
      if (!this.weightsArrays) {
        throw new Error("Weights not computed");
      }
      const c = this.weightsArrays[0][2] * newSourcePoint[0] + this.weightsArrays[1][2] * newSourcePoint[1] + this.weightsArrays[2][2];
      const num1 = this.weightsArrays[0][0] * newSourcePoint[0] + this.weightsArrays[1][0] * newSourcePoint[1] + this.weightsArrays[2][0];
      const num2 = this.weightsArrays[0][1] * newSourcePoint[0] + this.weightsArrays[1][1] * newSourcePoint[1] + this.weightsArrays[2][1];
      const newDestinationPointPartDerX = [
        (c * this.weightsArrays[0][0] - this.weightsArrays[0][2] * num1) / c ** 2,
        (c * this.weightsArrays[0][1] - this.weightsArrays[0][2] * num2) / c ** 2
      ];
      return newDestinationPointPartDerX;
    }
    evaluatePartialDerivativeY(newSourcePoint) {
      if (!this.weightsArrays) {
        this.solve();
      }
      if (!this.weightsArrays) {
        throw new Error("Weights not computed");
      }
      const c = this.weightsArrays[0][2] * newSourcePoint[0] + this.weightsArrays[1][2] * newSourcePoint[1] + this.weightsArrays[2][2];
      const num1 = this.weightsArrays[0][0] * newSourcePoint[0] + this.weightsArrays[1][0] * newSourcePoint[1] + this.weightsArrays[2][0];
      const num2 = this.weightsArrays[0][1] * newSourcePoint[0] + this.weightsArrays[1][1] * newSourcePoint[1] + this.weightsArrays[2][1];
      const newDestinationPointPartDerY = [
        (c * this.weightsArrays[1][0] - this.weightsArrays[1][2] * num1) / c ** 2,
        (c * this.weightsArrays[1][1] - this.weightsArrays[1][2] * num2) / c ** 2
      ];
      return newDestinationPointPartDerY;
    }
    getTransformationDataAsFloat64Array() {
      if (!this.weightsArrays) {
        this.solve();
      }
      if (!this.weightsArrays) {
        throw new Error("Projective transformation weights not computed");
      }
      const flatWeights = [];
      for (let col = 0; col < 3; col++) {
        for (let row = 0; row < 3; row++) {
          flatWeights.push(this.weightsArrays[col][row]);
        }
      }
      return {
        weights: new Float64Array(flatWeights),
        sourcePoints: new Float64Array(0)
      };
    }
  };

  // node_modules/@allmaps/transform/dist/transformation-types/RBF.js
  var RBF = class extends BaseIndependentLinearWeightsTransformation {
    kernelFunction;
    normFunction;
    epsilon;
    coefsArrayMatrices;
    coefsArrayMatrix;
    coefsArrayMatricesSize;
    coefsArrayMatrixSize;
    weightsArrays;
    rbfWeightsArrays;
    affineWeightsArrays;
    constructor(sourcePoints, destinationPoints, kernelFunction, normFunction, type, epsilon) {
      super(sourcePoints, destinationPoints, type, 3);
      this.kernelFunction = kernelFunction;
      this.normFunction = normFunction;
      this.epsilon = epsilon;
      this.coefsArrayMatrices = this.getCoefsArrayMatrices();
      this.coefsArrayMatrix = this.coefsArrayMatrices[0];
      this.coefsArrayMatricesSize = this.coefsArrayMatrices.map((coefsArrayMatrix) => arrayMatrixSize(coefsArrayMatrix));
      this.coefsArrayMatrixSize = arrayMatrixSize(this.coefsArrayMatrix);
    }
    getDestinationPointsArrays() {
      return [
        [...this.destinationPoints, [0, 0], [0, 0], [0, 0]].map((value) => value[0]),
        [...this.destinationPoints, [0, 0], [0, 0], [0, 0]].map((value) => value[1])
      ];
    }
    getCoefsArrayMatrix() {
      const normsArrayMatrix = newArrayMatrix(this.pointCount, this.pointCount, 0);
      for (let i = 0; i < this.pointCount; i++) {
        for (let j = 0; j < this.pointCount; j++) {
          normsArrayMatrix[i][j] = this.normFunction(this.sourcePoints[i], this.sourcePoints[j]);
        }
      }
      if (this.epsilon === void 0) {
        const normsSum = normsArrayMatrix.map((row) => row.reduce((a, c) => a + c, 0)).reduce((a, c) => a + c, 0);
        this.epsilon = normsSum / (Math.pow(this.pointCount, 2) - this.pointCount);
      }
      const kernelCoefsArrayMatrix = newArrayMatrix(this.pointCount, this.pointCount, 0);
      for (let i = 0; i < this.pointCount; i++) {
        for (let j = 0; j < this.pointCount; j++) {
          kernelCoefsArrayMatrix[i][j] = this.kernelFunction(normsArrayMatrix[i][j], {
            epsilon: this.epsilon
          });
        }
      }
      let affineCoefsArrayMatrix = newArrayMatrix(this.pointCount, 3, 0);
      for (let i = 0; i < this.pointCount; i++) {
        affineCoefsArrayMatrix = pasteArrayMatrix(affineCoefsArrayMatrix, i, 0, [
          Polynomial1.getPolynomial1SourcePointCoefsArray(this.sourcePoints[i])
        ]);
      }
      const zerosArrayMatrix = newArrayMatrix(3, 3, 0);
      const coefsArrayMatrix = newBlockArrayMatrix([
        [kernelCoefsArrayMatrix, affineCoefsArrayMatrix],
        [transposeArrayMatrix(affineCoefsArrayMatrix), zerosArrayMatrix]
      ]);
      return coefsArrayMatrix;
    }
    /**
     * Get 1x(N+3) coefsArray, populating the (N+3)x(N+3) coefsArrayMatrix
     *
     * The coefsArray has a 1xN kernel part and a 1x3 affine part.
     *
     * @param sourcePoint
     */
    getSourcePointCoefsArray(sourcePoint) {
      return [
        ...this.getRbfKernelSourcePointCoefsArray(sourcePoint),
        ...Polynomial1.getPolynomial1SourcePointCoefsArray(sourcePoint)
      ];
    }
    getRbfKernelSourcePointCoefsArray(sourcePoint) {
      const kernelSourcePointCoefsArray = [];
      for (let i = 0; i < this.pointCount; i++) {
        kernelSourcePointCoefsArray.push(this.kernelFunction(this.normFunction(this.sourcePoints[i], sourcePoint), {
          epsilon: this.epsilon
        }));
      }
      return kernelSourcePointCoefsArray;
    }
    setWeightsArrays(weightsArrays, epsilon) {
      if (epsilon) {
        this.epsilon = epsilon;
      }
      super.setWeightsArrays(weightsArrays);
    }
    /**
     * Solve the x and y components independently.
     *
     * This uses the exact inverse to compute (for each component, using the same coefs for both)
     * the exact solution for the system of linear equations
     * which is (in general) invertable to an exact solution.
     *
     * This wil result in a weights array for each component with rbf weights and affine weights.
     */
    solve() {
      this.weightsArrays = solveIndependentlyInverse(this.coefsArrayMatrix, this.destinationPointsArrays);
      this.processWeightsArrays();
    }
    processWeightsArrays() {
      if (!this.weightsArrays) {
        throw new Error("Weights not computed");
      }
      this.rbfWeightsArrays = this.weightsArrays.map((array) => array.slice(0, this.pointCount));
      this.affineWeightsArrays = this.weightsArrays.map((array) => array.slice(this.pointCount));
    }
    evaluateFunction(newSourcePoint) {
      if (!this.weightsArrays) {
        this.solve();
      }
      if (!this.rbfWeightsArrays || !this.affineWeightsArrays) {
        throw new Error("RBF weights not computed");
      }
      const rbfWeights = this.rbfWeightsArrays;
      const affineWeights = this.affineWeightsArrays;
      const newDistances = this.sourcePoints.map((sourcePoint) => this.normFunction(newSourcePoint, sourcePoint));
      const newDestinationPoint = [0, 0];
      for (let i = 0; i < 2; i++) {
        newDestinationPoint[i] = newDistances.reduce((sum, dist, index) => sum + this.kernelFunction(dist, { epsilon: this.epsilon }) * rbfWeights[i][index], 0);
        newDestinationPoint[i] += affineWeights[i][0] + affineWeights[i][1] * newSourcePoint[0] + affineWeights[i][2] * newSourcePoint[1];
      }
      return newDestinationPoint;
    }
    evaluatePartialDerivativeX(newSourcePoint) {
      if (!this.weightsArrays) {
        this.solve();
      }
      if (!this.rbfWeightsArrays || !this.affineWeightsArrays) {
        throw new Error("RBF weights not computed");
      }
      const rbfWeights = this.rbfWeightsArrays;
      const affineWeights = this.affineWeightsArrays;
      const newDistances = this.sourcePoints.map((sourcePoint) => this.normFunction(newSourcePoint, sourcePoint));
      const newDestinationPointPartDerX = [0, 0];
      for (let i = 0; i < 2; i++) {
        newDestinationPointPartDerX[i] = newDistances.reduce((sum, dist, index) => sum + (dist === 0 ? 0 : this.kernelFunction(dist, {
          derivative: 1,
          epsilon: this.epsilon
        }) * ((newSourcePoint[0] - this.sourcePoints[index][0]) / dist) * rbfWeights[i][index]), 0);
        newDestinationPointPartDerX[i] += affineWeights[i][1];
      }
      return newDestinationPointPartDerX;
    }
    evaluatePartialDerivativeY(newSourcePoint) {
      if (!this.weightsArrays) {
        this.solve();
      }
      if (!this.rbfWeightsArrays || !this.affineWeightsArrays) {
        throw new Error("RBF weights not computed");
      }
      const rbfWeights = this.rbfWeightsArrays;
      const affineWeights = this.affineWeightsArrays;
      const newDistances = this.sourcePoints.map((sourcePoint) => this.normFunction(newSourcePoint, sourcePoint));
      const newDestinationPointPartDerY = [0, 0];
      for (let i = 0; i < 2; i++) {
        newDestinationPointPartDerY[i] = newDistances.reduce((sum, dist, index) => sum + (dist === 0 ? 0 : this.kernelFunction(dist, {
          derivative: 1,
          epsilon: this.epsilon
        }) * ((newSourcePoint[1] - this.sourcePoints[index][1]) / dist) * rbfWeights[i][index]), 0);
        newDestinationPointPartDerY[i] += affineWeights[i][2];
      }
      return newDestinationPointPartDerY;
    }
    getTransformationDataAsFloat64Array() {
      if (!this.weightsArrays) {
        this.solve();
      }
      if (!this.rbfWeightsArrays || !this.affineWeightsArrays) {
        throw new Error("ThinPlateSpline transformation weights not computed");
      }
      const n = this.sourcePoints.length;
      const weights = new Float64Array(1 + 2 * n + 6);
      weights[0] = n;
      for (let i = 0; i < n; i++) {
        weights[1 + i] = this.rbfWeightsArrays[0][i];
      }
      for (let i = 0; i < n; i++) {
        weights[1 + n + i] = this.rbfWeightsArrays[1][i];
      }
      for (let i = 0; i < 3; i++) {
        weights[1 + 2 * n + i] = this.affineWeightsArrays[0][i];
      }
      for (let i = 0; i < 3; i++) {
        weights[1 + 2 * n + 3 + i] = this.affineWeightsArrays[1][i];
      }
      const flatSourcePoints = new Float64Array(n * 2);
      for (let i = 0; i < n; i++) {
        flatSourcePoints[i * 2] = this.sourcePoints[i][0];
        flatSourcePoints[i * 2 + 1] = this.sourcePoints[i][1];
      }
      return {
        weights,
        sourcePoints: flatSourcePoints
      };
    }
  };

  // node_modules/@allmaps/transform/dist/shared/kernel-functions.js
  function linearKernel(r, options) {
    if (!options.derivative) {
      return r;
    } else if (options.derivative === 1) {
      return 1;
    } else {
      throw new Error("Derivate of order " + options.derivative + " not implemented");
    }
  }
  function thinPlateKernel(r, options) {
    if (!options.derivative) {
      if (r === 0) {
        return 0;
      }
      return Math.pow(r, 2) * Math.log(r);
    } else if (options.derivative === 1) {
      if (r === 0) {
        return 0;
      }
      return r + 2 * r * Math.log(r);
    } else {
      throw new Error("Derivate of order " + options.derivative + " not implemented");
    }
  }

  // node_modules/@allmaps/transform/dist/shared/norm-functions.js
  function euclideanNorm(point0, point1) {
    const dx = point1[0] - point0[0];
    const dy = point1[1] - point0[1];
    return Math.sqrt(dx * dx + dy * dy);
  }

  // node_modules/@allmaps/transform/dist/shared/refinement-functions.js
  var defaultRefinementOptions = {
    maxDepth: 0,
    minSourceDistance: 0,
    minDestinationDistance: 0,
    minOffsetRatio: 0,
    minOffsetDistance: Infinity,
    sourceMidPointFunction: midPoint,
    destinationMidPointFunction: midPoint
  };
  function refineLineString(lineString, refinementFunction, refinementOptions) {
    lineString = conformLineString(lineString);
    const gcps = lineString.map((point) => ({
      source: point,
      destination: refinementFunction(point)
    }));
    const gcpLines = gcpsToGcpLines(gcps, false);
    const refinedGcpLines = gcpLines.map((gcpLine) => splitGcpLineRecursively(gcpLine, refinementFunction, refinementOptions, 0)).flat(1);
    return gcpLinesToGcps(refinedGcpLines, true);
  }
  function refineRing(ring, refinementFunction, refinementOptions) {
    ring = conformRing(ring);
    const gcps = ring.map((point) => ({
      source: point,
      destination: refinementFunction(point)
    }));
    const gcpLines = gcpsToGcpLines(gcps, true);
    const refinedGcpLines = gcpLines.map((line) => splitGcpLineRecursively(line, refinementFunction, refinementOptions, 0)).flat(1);
    return gcpLinesToGcps(refinedGcpLines, false);
  }
  function splitGcpLineRecursively(gcpLine, refinementFunction, refinementOptions, depth) {
    const newMidGcp = newMidGcpIfShouldSplitGcpLine(gcpLine, refinementFunction, refinementOptions, depth);
    if (newMidGcp) {
      return [
        splitGcpLineRecursively([gcpLine[0], newMidGcp], refinementFunction, refinementOptions, depth + 1),
        splitGcpLineRecursively([newMidGcp, gcpLine[1]], refinementFunction, refinementOptions, depth + 1)
      ].flat(1);
    } else {
      return [gcpLine];
    }
  }
  function newMidGcpIfShouldSplitGcpLine(gcpLine, refinementFunction, refinementOptions, depth) {
    if (depth >= refinementOptions.maxDepth || refinementOptions.maxDepth <= 0 || distance(gcpLine[0].source, gcpLine[1].source) < refinementOptions.minSourceDistance || distance(gcpLine[0].destination, gcpLine[1].destination) < refinementOptions.minDestinationDistance) {
      return void 0;
    }
    const { sourceMidPoint, destinationMidPointFromRefinementFunction, destinationMidPointsDistance, destinationLineDistance } = splitGcpLinePointInfo(gcpLine, refinementFunction, refinementOptions);
    const shouldSplit = shouldSplitGcpLine({
      destinationMidPointsDistance,
      destinationLineDistance
    }, refinementOptions);
    return shouldSplit ? {
      source: sourceMidPoint,
      destination: destinationMidPointFromRefinementFunction
    } : void 0;
  }
  function splitGcpLinePointInfo(gcpLine, refinementFunction, refinementOptions) {
    const sourceMidPoint = refinementOptions.sourceMidPointFunction(gcpLine[0].source, gcpLine[1].source);
    const destinationMidPoint = refinementOptions.destinationMidPointFunction(gcpLine[0].destination, gcpLine[1].destination);
    const destinationMidPointFromRefinementFunction = refinementFunction(sourceMidPoint);
    const destinationMidPointsDistance = distance(destinationMidPoint, destinationMidPointFromRefinementFunction);
    const destinationLineDistance = distance(gcpLine[0].destination, gcpLine[1].destination);
    return {
      sourceMidPoint,
      destinationMidPointFromRefinementFunction,
      destinationMidPointsDistance,
      destinationLineDistance
    };
  }
  function shouldSplitGcpLine({ destinationMidPointsDistance, destinationLineDistance }, refinementOptions) {
    return destinationMidPointsDistance / destinationLineDistance > refinementOptions.minOffsetRatio || destinationMidPointsDistance > refinementOptions.minOffsetDistance;
  }
  function getSourceRefinementResolution(sourceBbox, refinementFunction, refinementOptions) {
    const sourceRectangle = bboxToRectangle(sourceBbox);
    const sourceTRPoint = sourceRectangle[2];
    const sourceTLPoint = sourceRectangle[3];
    const sourceBRPoint = sourceRectangle[1];
    const sourceBLPoint = sourceRectangle[0];
    const sourceCRPoint = refinementOptions.sourceMidPointFunction(sourceTRPoint, sourceBRPoint);
    const sourceCLPoint = refinementOptions.sourceMidPointFunction(sourceTLPoint, sourceBLPoint);
    const sourceTCPoint = refinementOptions.sourceMidPointFunction(sourceTRPoint, sourceTLPoint);
    const sourceBCPoint = refinementOptions.sourceMidPointFunction(sourceBRPoint, sourceBLPoint);
    const sourceHCLine = [sourceCRPoint, sourceCLPoint];
    const sourceVCLine = [sourceTCPoint, sourceBCPoint];
    const sourceMultiLine = [sourceHCLine, sourceVCLine];
    const sourceRefinedMultiLineString = sourceMultiLine.map((sourceLine) => refineLineString(sourceLine, refinementFunction, refinementOptions).map((generalGcp) => generalGcp.source));
    if (sourceRefinedMultiLineString.every((sourceRefinedLineString) => sourceRefinedLineString.length == 2)) {
      return void 0;
    }
    const sourceRefinedMultiLineStringSquaredLengths = sourceRefinedMultiLineString.map((sourceRefinedLineString) => sourceRefinedLineString.slice(0, -1).map((sourcePoint, index) => squaredDistance(sourcePoint, sourceRefinedLineString[index + 1])));
    const sourceRefinedMultiLineStringMinLength = Math.sqrt(Math.min(...sourceRefinedMultiLineStringSquaredLengths.flat()));
    return sourceRefinedMultiLineStringMinLength;
  }
  function gcpsToGcpLines(gcps, close = false) {
    const lineCount = gcps.length - (close ? 0 : 1);
    const lines = [];
    for (let index = 0; index < lineCount; index++) {
      lines.push([gcps[index], gcps[(index + 1) % gcps.length]]);
    }
    return lines;
  }
  function gcpLinesToGcps(lines, close = false) {
    const gcps = lines.map((line) => line[0]);
    if (close) {
      gcps.push(lines[lines.length - 1][1]);
    }
    return gcps;
  }

  // node_modules/@allmaps/transform/dist/shared/transform-functions.js
  var nonWarpingTransformationTypes = [
    "helmert",
    "polynomial",
    "polynomial1"
  ];
  var defaultGeneralGcpTransformOptions = {
    maxDepth: 0,
    minSourceDistance: 0,
    minDestinationDistance: 0,
    minOffsetRatio: 0,
    minOffsetDistance: Infinity,
    isMultiGeometry: false,
    distortionMeasures: [],
    referenceScale: 1,
    preForward: (point) => point,
    postForward: (point) => point,
    preBackward: (point) => point,
    postBackward: (point) => point
  };
  var defaultGeneralGcpTransformerOptions = {
    differentHandedness: false,
    ...defaultGeneralGcpTransformOptions
  };
  function gcpTransformOptionsToGeneralGcpTransformOptions(partialGcpTransformOptions) {
    if (partialGcpTransformOptions === void 0 || Object.keys(partialGcpTransformOptions).length === 0) {
      return {};
    }
    const partialGeneralGcpTransformOptions = partialGcpTransformOptions;
    if (partialGcpTransformOptions.postToGeo) {
      partialGeneralGcpTransformOptions.postForward = partialGcpTransformOptions.postToGeo;
    }
    if (partialGcpTransformOptions.preToResource) {
      partialGeneralGcpTransformOptions.preBackward = partialGcpTransformOptions.preToResource;
    }
    return partialGeneralGcpTransformOptions;
  }
  function gcpTransformerOptionsToGeneralGcpTransformerOptions(partialGcpTransformerOptions) {
    if (partialGcpTransformerOptions === void 0) {
      return {};
    }
    const partialGeneralGcpTransformerOptions = gcpTransformOptionsToGeneralGcpTransformOptions(partialGcpTransformerOptions);
    return partialGeneralGcpTransformerOptions;
  }
  function generalGcpTransformOptionsToGcpTransformOptions(partialGeneralGcpTransformOptions) {
    if (partialGeneralGcpTransformOptions === void 0) {
      return {};
    }
    const partialGcpTransformOptions = partialGeneralGcpTransformOptions;
    if (partialGeneralGcpTransformOptions.postForward) {
      partialGcpTransformOptions.postToGeo = partialGeneralGcpTransformOptions.postForward;
    }
    if (partialGeneralGcpTransformOptions.preBackward) {
      partialGcpTransformOptions.preToResource = partialGeneralGcpTransformOptions.preBackward;
    }
    return partialGcpTransformOptions;
  }
  function generalGcpTransformerOptionsToGcpTransformerOptions(partialGeneralGcpTransformerOptions) {
    if (partialGeneralGcpTransformerOptions == void 0) {
      return {};
    }
    const partialGcpTransformerOptions = partialGeneralGcpTransformerOptions;
    return partialGcpTransformerOptions;
  }
  var defaultGcpTransformOptions = generalGcpTransformOptionsToGcpTransformOptions(defaultGeneralGcpTransformOptions);
  var defaultGcpTransformerOptions = generalGcpTransformerOptionsToGcpTransformerOptions(defaultGeneralGcpTransformerOptions);
  function refinementOptionsFromForwardTransformOptions(generalGcpTransformOptions) {
    const refinementOptions = mergeOptions(defaultRefinementOptions, generalGcpTransformOptions);
    return refinementOptions;
  }
  function refinementOptionsFromBackwardTransformOptions(generalGcpTransformOptions) {
    const refinementOptions = mergeOptions(defaultRefinementOptions, generalGcpTransformOptions);
    return refinementOptions;
  }

  // node_modules/@allmaps/transform/dist/shared/conversion-functions.js
  function invertGeneralGcp(generalGcp) {
    return { source: generalGcp.destination, destination: generalGcp.source };
  }
  function generalGcpToPointForForward(generalGcp) {
    return generalGcp.destination;
  }
  function generalGcpToPointForBackward(generalGcp) {
    return generalGcp.source;
  }
  function gcpToPointForToGeo(gcp) {
    return gcp.geo;
  }
  function gcpToPointForToResource(gcp) {
    return gcp.resource;
  }
  function generalGcpToGcp(generalGcp) {
    return {
      resource: generalGcp.source,
      geo: generalGcp.destination,
      partialDerivativeX: generalGcp.partialDerivativeX,
      partialDerivativeY: generalGcp.partialDerivativeY,
      distortions: generalGcp.distortions,
      distortion: generalGcp.distortion
    };
  }
  function gcpToGeneralGcp(gcp) {
    return {
      source: gcp.resource,
      destination: gcp.geo,
      partialDerivativeX: gcp.partialDerivativeX,
      partialDerivativeY: gcp.partialDerivativeY,
      distortions: gcp.distortions,
      distortion: gcp.distortion
    };
  }

  // node_modules/@allmaps/transform/dist/transformers/BaseGcpTransformer.js
  var BaseGcpTransformer = class {
    generalGcpsInternal;
    sourcePointsInternal;
    destinationPointsInternal;
    type;
    transformerOptions;
    forwardTransformation;
    backwardTransformation;
    /**
     * Create a BaseGcpTransformer
     *
     * @param generalGcps - An array of General Ground Control Points (GCPs)
     * @param type - The transformation type
     * @param partialGeneralGcpTransformerOptions - General GCP Transformer options
     */
    constructor(generalGcps, type = "polynomial", partialGeneralGcpTransformerOptions) {
      this.transformerOptions = mergeOptions(defaultGeneralGcpTransformerOptions, partialGeneralGcpTransformerOptions);
      if (generalGcps.length === 0) {
        throw new Error("No control points");
      }
      this.generalGcpsInternal = generalGcps;
      this.sourcePointsInternal = this.generalGcpsInternal.map((generalGcp) => {
        const source = this.transformerOptions.differentHandedness ? flipY(generalGcp.source) : generalGcp.source;
        return this.transformerOptions.preForward(source);
      });
      this.destinationPointsInternal = this.generalGcpsInternal.map((generalGcp) => this.transformerOptions.preBackward(generalGcp.destination));
      this.type = type;
    }
    /**
     * Get the forward transformation. Create if it doesn't exist yet.
     */
    getForwardTransformationInternal() {
      if (!this.forwardTransformation) {
        this.forwardTransformation = this.createTransformation(this.sourcePointsInternal, this.destinationPointsInternal);
      }
      return this.forwardTransformation;
    }
    /**
     * Get the backward transformation. Create if it doesn't exist yet.
     */
    getBackwardTransformationInternal() {
      if (!this.backwardTransformation) {
        this.backwardTransformation = this.createTransformation(this.destinationPointsInternal, this.sourcePointsInternal);
      }
      return this.backwardTransformation;
    }
    /**
     * Create the (forward or backward) transformation.
     *
     * Results in forward transformation if source and destination points are entered as such.
     * Results in backward if source points are entered for destination points and vice versa.
     *
     * Results in a transformation of this instance's transformation type.
     *
     * @param sourcePoints - source points
     * @param destinationPoints - destination points
     * @returns Transformation
     */
    createTransformation(sourcePoints, destinationPoints) {
      if (this.type === "straight") {
        return new Straight(sourcePoints, destinationPoints);
      } else if (this.type === "helmert") {
        return new Helmert(sourcePoints, destinationPoints);
      } else if (this.type === "polynomial1" || this.type === "polynomial") {
        return new Polynomial1(sourcePoints, destinationPoints);
      } else if (this.type === "polynomial2") {
        return new Polynomial2(sourcePoints, destinationPoints);
      } else if (this.type === "polynomial3") {
        return new Polynomial3(sourcePoints, destinationPoints);
      } else if (this.type === "projective") {
        return new Projective(sourcePoints, destinationPoints);
      } else if (this.type === "thinPlateSpline") {
        return new RBF(sourcePoints, destinationPoints, thinPlateKernel, euclideanNorm, "thinPlateSpline");
      } else if (this.type === "linear") {
        return new RBF(sourcePoints, destinationPoints, linearKernel, euclideanNorm, "linear");
      } else {
        throw new Error(`Unsupported transformation type: ${this.type}`);
      }
    }
    /**
     * Transform a geometry forward from source space to destination space
     *
     * @param sourceGeometry - Geometry to transform
     * @param partialGeneralGcpTransformOptions - General GCP Transform options
     * @param generalGcpToP - Return type function
     * @returns Forward transform of input geometry
     */
    transformForwardInternal(sourceGeometry, partialGeneralGcpTransformOptions, generalGcpToP = generalGcpToPointForForward) {
      let transformOptions = mergeOptions(this.transformerOptions, partialGeneralGcpTransformOptions);
      if (this.isNonWarping()) {
        transformOptions = mergeOptions(transformOptions, { maxDepth: 0 });
      }
      if (!transformOptions.isMultiGeometry) {
        if (isPoint(sourceGeometry)) {
          return this.transformPointForwardInternal(sourceGeometry, transformOptions, generalGcpToP);
        } else if (isLineString(sourceGeometry)) {
          return this.transformLineStringForwardInternal(sourceGeometry, transformOptions, generalGcpToP);
        } else if (isPolygon(sourceGeometry)) {
          return this.transformPolygonForwardInternal(sourceGeometry, transformOptions, generalGcpToP);
        } else {
          throw new Error("Geometry type not supported");
        }
      } else {
        if (transformOptions) {
          transformOptions = mergeOptions(transformOptions, {
            isMultiGeometry: false
          });
        }
        if (isMultiPoint(sourceGeometry)) {
          return sourceGeometry.map((sourcePoint) => this.transformPointForwardInternal(sourcePoint, transformOptions, generalGcpToP));
        } else if (isMultiLineString(sourceGeometry)) {
          return sourceGeometry.map((sourceLineString) => this.transformLineStringForwardInternal(sourceLineString, transformOptions, generalGcpToP));
        } else if (isMultiPolygon(sourceGeometry)) {
          return sourceGeometry.map((sourcePolygon) => this.transformPolygonForwardInternal(sourcePolygon, transformOptions, generalGcpToP));
        } else {
          throw new Error("Geometry type not supported");
        }
      }
    }
    /**
     * Transform a geometry backward from destination space to source space
     *
     * @param destinationGeometry - Geometry to transform
     * @param partialGeneralGcpTransformOptions - General GCP Transform options
     * @param generalGcpToP - Return type function
     * @returns Backward transform of input geometry
     */
    transformBackwardInternal(destinationGeometry, partialGeneralGcpTransformOptions, generalGcpToP = generalGcpToPointForBackward) {
      let transformOptions = mergeOptions(this.transformerOptions, partialGeneralGcpTransformOptions);
      if (this.isNonWarping()) {
        transformOptions = mergeOptions(transformOptions, { maxDepth: 0 });
      }
      if (!transformOptions.isMultiGeometry) {
        if (isPoint(destinationGeometry)) {
          return this.transformPointBackwardInternal(destinationGeometry, transformOptions, generalGcpToP);
        } else if (isLineString(destinationGeometry)) {
          return this.transformLineStringBackwardInternal(destinationGeometry, transformOptions, generalGcpToP);
        } else if (isPolygon(destinationGeometry)) {
          return this.transformPolygonBackwardInternal(destinationGeometry, transformOptions, generalGcpToP);
        } else {
          throw new Error("Geometry type not supported");
        }
      } else {
        if (transformOptions) {
          transformOptions = mergeOptions(transformOptions, {
            isMultiGeometry: false
          });
        }
        if (isMultiPoint(destinationGeometry)) {
          return destinationGeometry.map((destinationPoint) => this.transformPointBackwardInternal(destinationPoint, transformOptions, generalGcpToP));
        } else if (isMultiLineString(destinationGeometry)) {
          return destinationGeometry.map((destinationLineString) => this.transformLineStringBackwardInternal(destinationLineString, transformOptions, generalGcpToP));
        } else if (isMultiPolygon(destinationGeometry)) {
          return destinationGeometry.map((destinationPolygon) => this.transformPolygonBackwardInternal(destinationPolygon, transformOptions, generalGcpToP));
        } else {
          throw new Error("Geometry type not supported");
        }
      }
    }
    // Handle specific geometries
    transformPointForwardInternal(point, generalGcpTransformOptions, generalGcpToP = generalGcpToPointForForward) {
      const forwardTransformation = this.getForwardTransformationInternal();
      let source = this.transformerOptions.differentHandedness ? flipY(point) : point;
      source = generalGcpTransformOptions.preForward(source);
      let destination = forwardTransformation.evaluateFunction(source);
      destination = generalGcpTransformOptions.postForward(destination);
      let partialDerivativeX = void 0;
      let partialDerivativeY = void 0;
      let distortions = /* @__PURE__ */ new Map();
      if (generalGcpTransformOptions.distortionMeasures.length > 0) {
        partialDerivativeX = forwardTransformation.evaluatePartialDerivativeX(source);
        partialDerivativeY = forwardTransformation.evaluatePartialDerivativeY(source);
        distortions = computeDistortionsFromPartialDerivatives(generalGcpTransformOptions.distortionMeasures, partialDerivativeX, partialDerivativeY, generalGcpTransformOptions.referenceScale);
      }
      return generalGcpToP({
        source: point,
        // don't apply differentHandedness here, this is only internally.
        destination,
        partialDerivativeX,
        partialDerivativeY,
        distortions
      });
    }
    transformPointBackwardInternal(point, generalGcpTransformOptions, generalGcpToP = generalGcpToPointForBackward) {
      const backwardTransformation = this.getBackwardTransformationInternal();
      const destination = generalGcpTransformOptions.preBackward(point);
      let source = backwardTransformation.evaluateFunction(destination);
      source = generalGcpTransformOptions.postBackward(source);
      source = this.transformerOptions.differentHandedness ? flipY(source) : source;
      let partialDerivativeX = void 0;
      let partialDerivativeY = void 0;
      let distortions = /* @__PURE__ */ new Map();
      if (generalGcpTransformOptions.distortionMeasures.length > 0) {
        partialDerivativeX = backwardTransformation.evaluatePartialDerivativeX(destination);
        partialDerivativeX = this.transformerOptions.differentHandedness ? flipY(partialDerivativeX) : partialDerivativeX;
        partialDerivativeY = backwardTransformation.evaluatePartialDerivativeY(destination);
        partialDerivativeY = this.transformerOptions.differentHandedness ? flipY(partialDerivativeY) : partialDerivativeY;
        distortions = computeDistortionsFromPartialDerivatives(generalGcpTransformOptions.distortionMeasures, partialDerivativeX, partialDerivativeY, generalGcpTransformOptions.referenceScale);
      }
      return generalGcpToP({
        source,
        destination,
        partialDerivativeX,
        partialDerivativeY,
        distortions
      });
    }
    transformLineStringForwardInternal(lineString, generalGcpTransformOptions, generalGcpToP) {
      return refineLineString(lineString, (p) => this.transformPointForwardInternal(p, generalGcpTransformOptions), refinementOptionsFromForwardTransformOptions(generalGcpTransformOptions)).map((generalGcp) => generalGcpToP(generalGcp));
    }
    transformLineStringBackwardInternal(lineString, generalGcpTransformOptions, generalGcpToP) {
      return refineLineString(lineString, (p) => this.transformPointBackwardInternal(p, generalGcpTransformOptions), refinementOptionsFromBackwardTransformOptions(generalGcpTransformOptions)).map((generalGcp) => generalGcpToP(invertGeneralGcp(generalGcp)));
    }
    transformRingForwardInternal(ring, generalGcpTransformOptions, generalGcpToP) {
      return refineRing(ring, (p) => this.transformPointForwardInternal(p, generalGcpTransformOptions), refinementOptionsFromForwardTransformOptions(generalGcpTransformOptions)).map((generalGcp) => generalGcpToP(generalGcp));
    }
    transformRingBackwardInternal(ring, generalGcpTransformOptions, generalGcpToP) {
      return refineRing(ring, (p) => this.transformPointBackwardInternal(p, generalGcpTransformOptions), refinementOptionsFromBackwardTransformOptions(generalGcpTransformOptions)).map((generalGcp) => generalGcpToP(invertGeneralGcp(generalGcp)));
    }
    transformPolygonForwardInternal(polygon, generalGcpTransformOptions, generalGcpToP) {
      return polygon.map((ring) => {
        return this.transformRingForwardInternal(ring, generalGcpTransformOptions, generalGcpToP);
      });
    }
    transformPolygonBackwardInternal(polygon, generalGcpTransformOptions, generalGcpToP) {
      return polygon.map((ring) => {
        return this.transformRingBackwardInternal(ring, generalGcpTransformOptions, generalGcpToP);
      });
    }
    isNonWarping() {
      return this.transformerOptions.postForward === this.transformerOptions.preBackward && this.transformerOptions.postBackward === this.transformerOptions.preForward && nonWarpingTransformationTypes.includes(this.type);
    }
    getForwardTransformationResolutionInternal(sourceBbox, partialGeneralGcpTransformOptions) {
      const transformOptions = mergeOptions(this.transformerOptions, partialGeneralGcpTransformOptions);
      sourceBbox = sourceBbox ?? computeBbox(this.sourcePointsInternal);
      return getSourceRefinementResolution(sourceBbox, (p) => this.transformPointForwardInternal(p, transformOptions), refinementOptionsFromForwardTransformOptions(transformOptions));
    }
    getBackwardTransformationResolutionInternal(destinationBbox, partialGeneralGcpTransformOptions) {
      const transformOptions = mergeOptions(this.transformerOptions, partialGeneralGcpTransformOptions);
      destinationBbox = destinationBbox ?? computeBbox(this.destinationPointsInternal);
      return getSourceRefinementResolution(destinationBbox, (p) => this.transformPointBackwardInternal(p, transformOptions), refinementOptionsFromBackwardTransformOptions(transformOptions));
    }
  };

  // node_modules/@allmaps/transform/dist/transformers/GcpTransformer.js
  var GcpTransformer = class _GcpTransformer extends BaseGcpTransformer {
    /**
     * Create a GcpTransformer
     *
     * @param gcps - An array of Ground Control Points (GCPs)
     * @param type - The transformation type
     * @param partialGcpTransformerOptions - GCP Transformer options
     */
    constructor(gcps, type = "polynomial", partialGcpTransformerOptions) {
      const generalGcps = gcps.filter((gcp) => gcp.geo && gcp.resource).map(gcpToGeneralGcp);
      partialGcpTransformerOptions = mergePartialOptions({ differentHandedness: true }, partialGcpTransformerOptions);
      super(generalGcps, type, gcpTransformerOptionsToGeneralGcpTransformerOptions(partialGcpTransformerOptions));
    }
    /**
     * Get GCPs as they were inputed to the GCP Transformer.
     */
    get gcps() {
      return this.generalGcpsInternal.map(generalGcpToGcp);
    }
    /**
     * Get the transformer options.
     */
    getTransformerOptions() {
      return this.transformerOptions;
    }
    /**
     * Set the transformer options.
     *
     * Use with caution, especially for options that have effects in the constructor.
     */
    setTransformerOptions(partialGcpTransformerOptions) {
      this.transformerOptions = mergeOptions(this.transformerOptions, gcpTransformerOptionsToGeneralGcpTransformerOptions(partialGcpTransformerOptions));
    }
    /**
     * Get the forward transformation. Create if it doesn't exist yet.
     */
    getToGeoTransformation() {
      return super.getForwardTransformationInternal();
    }
    /**
     * Get the backward transformation. Create if it doesn't exist yet.
     */
    getToResourceTransformation() {
      return super.getBackwardTransformationInternal();
    }
    /**
     * Transform a geometry from resource space to geo space
     *
     * @param resourceGeometry - Geometry to transform
     * @param partialGcpTransformOptions - GCP Transform options
     * @param gcpToP - Return type function
     * @returns Input geometry transformed to geo space
     */
    transformToGeo(resourceGeometry, partialGcpTransformOptions, gcpToP = gcpToPointForToGeo) {
      const generalGcpToP = (generalGcp) => gcpToP(generalGcpToGcp(generalGcp));
      const partialGeneralGcpTransformOptions = gcpTransformOptionsToGeneralGcpTransformOptions(partialGcpTransformOptions);
      return super.transformForwardInternal(resourceGeometry, partialGeneralGcpTransformOptions, generalGcpToP);
    }
    /**
     * Transform a geometry from geo space to resource space
     *
     * @param geoGeometry - Geometry to transform
     * @param partialGcpTransformOptions - GCP Transform options
     * @param gcpToP - Return type function
     * @returns Input geometry transformed to resource space
     */
    transformToResource(geoGeometry, partialGcpTransformOptions, gcpToP = gcpToPointForToResource) {
      const generalGcpToP = (generalGcp) => gcpToP(generalGcpToGcp(generalGcp));
      const partialGeneralGcpTransformOptions = gcpTransformOptionsToGeneralGcpTransformOptions(partialGcpTransformOptions);
      return super.transformBackwardInternal(geoGeometry, partialGeneralGcpTransformOptions, generalGcpToP);
    }
    /**
     * Get the resolution of the toGeo transformation in resource space, within a given bbox.
     *
     * This informs you in how fine the warping is, in resource space.
     * It can be useful e.g. to create a triangulation in resource space
     * that is fine enough for this warping or set the minSourceDistance options.
     *
     * It is obtained by transforming toGeo two linestring,
     * namely the horizontal and vertical midlines of the given bbox.
     * The toGeo transformation will refine these lines:
     * it will break them in small enough pieces to obtain a near continuous result.
     *
     * Resolution returned in the length of the shortest piece, measured in resource coordinates,
     * or undefined if no refinements were needed.
     *
     * @param resourceBbox - BBox in resource space where the resolution is requested, or undefined to get this from the GCPs
     * @param partialGcpTransformOptions - GCP Transform options to consider during the transformation
     * @returns Resolution of the toGeo transformation in resource space
     */
    getToGeoTransformationResolution(resourceBbox, partialGcpTransformOptions) {
      const partialGeneralGcpTransformOptions = gcpTransformOptionsToGeneralGcpTransformOptions(partialGcpTransformOptions);
      return super.getForwardTransformationResolutionInternal(resourceBbox, partialGeneralGcpTransformOptions);
    }
    /**
     * Get the resolution of the toResource transformation in geo space, within a given bbox.
     *
     * This informs you in how fine the warping is, in geo space.
     * It can be useful e.g. to create a triangulation in geo space
     * that is fine enough for this warping or set the minDestionationDistance options.
     *
     * It is obtained by transforming toResource two linestring,
     * namely the horizontal and vertical midlines of the given bbox.
     * The toResource transformation will refine these lines:
     * it will break them in small enough pieces to obtain a near continuous result.
     *
     * Resolution returned in the length of the shortest piece, measured in geo coordinates,
     * or undefined if no refinements were needed.
     *
     * @param geoBbox - BBox in geo space where the resolution is requested, or undefined to get this from the GCPs
     * @param partialGcpTransformOptions - GCP Transform options to consider during the transformation
     * @returns Resolution of the toResource transformation in geo space
     */
    getToResourceTransformationResolution(geoBbox, partialGcpTransformOptions) {
      const generalGcpTransformOptions = gcpTransformOptionsToGeneralGcpTransformOptions(partialGcpTransformOptions);
      return super.getBackwardTransformationResolutionInternal(geoBbox, generalGcpTransformOptions);
    }
    /**
     * Transform an SVG geometry from resource space to geo space as a GeoJSON Geometry
     *
     * This is a shortcut method, available as static method in order not to overpopulate intellisense suggestions
     * Note: Multi-geometries are not supported
     *
     * @param transformer - A GCP Transformer defining the transformation
     * @param svgGeometry - SVG geometry to transform
     * @param partialGcpTransformOptions - GCP Transform options
     * @returns Input SVG geometry transformed to geo space, as a GeoJSON Geometry
     */
    static transformSvgToGeojson(transformer, svgGeometry, partialGcpTransformOptions) {
      const transformedGeometry = transformer.transformToGeo(svgGeometryToGeometry(svgGeometry), partialGcpTransformOptions);
      return geometryToGeojsonGeometry(transformedGeometry);
    }
    /**
     * Transform an SVG string from resource space to geo space to a GeoJSON FeatureCollection
     *
     * This is a shortcut method, available as static method in order not to overpopulate intellisense suggestions
     * Note: Multi-geometries are not supported
     *
     * @param transformer - A GCP Transformer defining the transformation
     * @param svg - An SVG string to transform
     * @param partialGcpTransformOptions - GCP Transform options
     * @returns Input SVG string transformed to geo space, as a GeoJSON FeatureCollection
     */
    static transformSvgStringToGeojsonFeatureCollection(transformer, svg, partialGcpTransformOptions) {
      const geojsonGeometries = [];
      for (const svgGeometry of stringToSvgGeometriesGenerator(svg)) {
        const geojsonGeometry = this.transformSvgToGeojson(transformer, svgGeometry, partialGcpTransformOptions);
        geojsonGeometries.push(geojsonGeometry);
      }
      return geojsonGeometriesToGeojsonFeatureCollection(geojsonGeometries);
    }
    /**
     * Transform a GeoJSON Geometry from geo space to resource space to a SVG geometry
     *
     * This is a shortcut method, available as static method in order not to overpopulate intellisense suggestions
     * Note: Multi-geometries are not supported
     *
     * @param transformer - A GCP Transformer defining the transformation
     * @param geojsonGeometry - GeoJSON Geometry to transform
     * @param partialGcpTransformOptions - GCP Transform options
     * @returns Input GeoJSON Geometry transform to resource space, as SVG geometry
     */
    static transformGeojsonToSvg(transformer, geojsonGeometry, partialGcpTransformOptions) {
      const transformedGeometry = transformer.transformToResource(geojsonGeometryToGeometry(geojsonGeometry), partialGcpTransformOptions);
      return geometryToSvgGeometry(transformedGeometry);
    }
    /**
     * Transform a GeoJSON FeatureCollection from geo space to resource space to a SVG string
     *
     * This is a shortcut method, available as static method in order not to overpopulate intellisense suggestions
     * Note: Multi-geometries are not supported
     *
     * @param transformer - A GCP Transformer defining the transformation
     * @param geojson - GeoJSON FeatureCollection to transform
     * @param partialGcpTransformOptions - GCP Transform options
     * @returns Input GeoJSON FeaturesCollection transformed to resource space, as SVG string
     */
    static transformGeojsonFeatureCollectionToSvgString(transformer, geojson, partialGcpTransformOptions) {
      const svgGeometries = [];
      for (const geojsonGeometry of geojsonFeatureCollectionToGeojsonGeometries(geojson)) {
        const svgGeometry = this.transformGeojsonToSvg(transformer, geojsonGeometry, partialGcpTransformOptions);
        svgGeometries.push(svgGeometry);
      }
      return svgGeometriesToSvgString(svgGeometries);
    }
    /**
     * Create a Projected GCP Transformer from a Georeferenced Map
     *
     * @param georeferencedMap - A Georeferenced Map
     * @param options - Options, including GCP Transformer Options, and a transformation type to overrule the type defined in the Georeferenced Map
     * @returns A Projected GCP Transformer
     */
    static fromGeoreferencedMap(georeferencedMap, options) {
      return new _GcpTransformer(georeferencedMap.gcps, options?.transformationType || georeferencedMap.transformation?.type, options);
    }
  };
  return __toCommonJS(entry_exports);
})();
