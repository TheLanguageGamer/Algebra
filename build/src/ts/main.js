"use strict";
var ANodeType;
(function (ANodeType) {
    ANodeType[ANodeType["Variable"] = 0] = "Variable";
    ANodeType[ANodeType["Number"] = 1] = "Number";
    ANodeType[ANodeType["Operator"] = 2] = "Operator";
})(ANodeType || (ANodeType = {}));
var OperatorType;
(function (OperatorType) {
    OperatorType[OperatorType["Addition"] = 1] = "Addition";
    OperatorType[OperatorType["Multiplication"] = 2] = "Multiplication";
    OperatorType[OperatorType["Division"] = 3] = "Division";
    OperatorType[OperatorType["Equality"] = 4] = "Equality";
})(OperatorType || (OperatorType = {}));
class ANode {
    constructor(type, value, text) {
        this.type = type;
        this.value = value;
        this.text = text;
    }
    evaluateAsOperator(assignments = null) {
        if (this.lhs && this.rhs) {
            let oType = this.value;
            switch (oType) {
                case OperatorType.Addition: {
                    let lhsE = this.lhs.evaluate(assignments);
                    let rhsE = this.rhs.evaluate(assignments);
                    return (lhsE != null && rhsE != null) ? (lhsE + rhsE) : null;
                }
                case OperatorType.Multiplication: {
                    let lhsE = this.lhs.evaluate(assignments);
                    let rhsE = this.rhs.evaluate(assignments);
                    return (lhsE != null && rhsE != null) ? (lhsE * rhsE) : null;
                }
                case OperatorType.Division: {
                    let lhsE = this.lhs.evaluate(assignments);
                    let rhsE = this.rhs.evaluate(assignments);
                    return (lhsE != null && rhsE != null) ? (lhsE / rhsE) : null;
                }
                case OperatorType.Equality: {
                    let lhsE = this.lhs.evaluate(assignments);
                    let rhsE = this.rhs.evaluate(assignments);
                    return (lhsE != null && rhsE != null) ? Number(lhsE == rhsE) : null;
                }
            }
        }
        return null;
    }
    evaluate(assignments = null) {
        switch (this.type) {
            case ANodeType.Number: {
                return this.value;
            }
            case ANodeType.Operator: {
                return this.evaluateAsOperator(assignments);
            }
            case ANodeType.Variable: {
                if (assignments
                    && assignments.has(this.text)) {
                    let value = assignments.get(this.text) || null;
                    return value;
                }
                return null;
            }
        }
    }
    toString() {
        switch (this.type) {
            case ANodeType.Number: {
                return String(this.value);
            }
            case ANodeType.Variable: {
                return this.text;
            }
            case ANodeType.Operator: {
                let lhsString = this.lhs ? this.lhs.toString() : "NULL";
                let rhsString = this.rhs ? this.rhs.toString() : "NULL";
                return lhsString + " " + this.text + " " + rhsString;
            }
        }
    }
    isAddition() {
        return this.type == ANodeType.Operator
            && this.value == OperatorType.Addition;
    }
    isMultiplication() {
        return this.type == ANodeType.Operator
            && this.value == OperatorType.Multiplication;
    }
    isDivision() {
        return this.type == ANodeType.Operator
            && this.value == OperatorType.Division;
    }
    isAtomic() {
        return this.type == ANodeType.Variable
            || this.type == ANodeType.Number;
    }
    static number(value) {
        return new ANode(ANodeType.Number, value, "");
    }
    static variable(text) {
        return new ANode(ANodeType.Variable, 0, text);
    }
    static equality() {
        return ANode.operator('=');
    }
    static operator(text) {
        let value = 0;
        switch (text) {
            case '+': {
                value = OperatorType.Addition;
                break;
            }
            case '*': {
                value = OperatorType.Multiplication;
                break;
            }
            case '/': {
                value = OperatorType.Division;
                break;
            }
            case '=': {
                value = OperatorType.Equality;
                break;
            }
        }
        return new ANode(ANodeType.Operator, value, text);
    }
    static parseAux(raw, startIndex) {
        let pending1 = null;
        let pending2 = null;
        function completePending() {
            if (pending1
                && !pending1.isAtomic()
                && pending1.rhs == undefined
                && pending2) {
                pending1.rhs = pending2;
            }
        }
        let i;
        for (i = startIndex; i < raw.length; ++i) {
            let c = raw[i];
            if (c == ' ') {
                continue;
            }
            if (c >= '0' && c <= '9') {
                while (i + 1 < raw.length
                    && raw[i + 1] >= '0'
                    && raw[i + 1] <= '9') {
                    c += raw[i + 1];
                    i += 1;
                }
                let node = ANode.number(Number(c));
                if (pending1 == null) {
                    pending1 = node;
                }
                else if (pending1
                    && (pending1.isMultiplication() || pending1.isDivision())
                    && pending1.rhs == undefined) {
                    pending1.rhs = node;
                }
                else if (pending2 == null) {
                    pending2 = node;
                }
                else if (pending2
                    && (pending2.isMultiplication() || pending2.isDivision())
                    && pending2.rhs == undefined) {
                    pending2.rhs = node;
                }
                else {
                    console.assert(false);
                }
            }
            else if (c >= 'a' && c <= 'z') {
                let node = ANode.variable(c);
                if (pending1 == null) {
                    pending1 = node;
                }
                else if (pending1
                    && (pending1.isMultiplication() || pending1.isDivision())
                    && pending1.rhs == undefined) {
                    pending1.rhs = node;
                }
                else if (pending2 == null) {
                    pending2 = node;
                }
                else if (pending2
                    && (pending2.isMultiplication() || pending2.isDivision())
                    && pending2.rhs == undefined) {
                    pending2.rhs = node;
                }
                else {
                    console.assert(false);
                }
            }
            else if (c == '*' || c == '/') {
                let node = ANode.operator(c);
                if (pending1
                    && (pending1.isAtomic()
                        || pending1.isMultiplication()
                        || pending1.isDivision())) {
                    node.lhs = pending1;
                    pending1 = node;
                }
                else if (pending2) {
                    node.lhs = pending2;
                    pending2 = node;
                }
                else {
                    console.assert(false);
                }
            }
            else if (c == '+') {
                let node = ANode.operator(c);
                console.assert(pending1 != null);
                if (pending1
                    && pending1.isAddition()
                    && pending2) {
                    console.assert(pending1.rhs == null);
                    pending1.rhs = pending2;
                    node.lhs = pending1;
                    pending1 = node;
                    pending2 = null;
                }
                else if (pending1
                    && pending2 == null) {
                    node.lhs = pending1;
                    pending1 = node;
                }
                else {
                    console.assert(false);
                }
            }
            else if (c == '=') {
                let node = ANode.equality();
                completePending();
                if (pending1) {
                    node.lhs = pending1;
                }
                else {
                    console.assert(false);
                }
                let completion = ANode.parseAux(raw, i + 1);
                i = completion.index;
                if (completion.node) {
                    node.rhs = completion.node;
                }
                else {
                    console.assert(false);
                }
                pending1 = node;
                break;
            }
            else {
                console.assert(false, "Unrecognized character, " + c);
            }
        }
        completePending();
        return { node: pending1, index: i };
    }
    static parse(raw) {
        let result = ANode.parseAux(raw, 0);
        console.assert(result.index == raw.length, "Could not complete parse");
        return result.node;
    }
}
function testValue(raw, value, assignments = null) {
    let node = ANode.parse(raw);
    console.assert(node != null);
    if (node) {
        console.assert(node.evaluate(assignments) == value);
        console.assert(node.toString().split(" ").join("") == raw.split(" ").join(""));
        console.log(raw, " == ", node.toString(), " == ", node.evaluate(assignments));
    }
}
testValue("5 +7", 12);
testValue("5 + 2*3+7", 18);
testValue("8*5 + 2*3+7", 53);
testValue("8 + 2 + 7 + 9", 26);
testValue("8 * 2 / 4 * 3", 12);
testValue("8 + x", null);
testValue("8 + 2 = 10", 1);
testValue("8*2 = 15", 0);
testValue("8 + x", 10, new Map([["x", 2]]));
// let raw1 = "5 +7";
// let node1 = ANode.parse2(raw1);
// console.log(raw1, node1, node1 ? node1.evaluate() : "null");
// let raw2 = "5 + 2*3+7";
// let node2 = ANode.parse2(raw2);
// console.log(raw2, node2, node2 ? node2.evaluate() : "null");
// let raw3 = "8*5 + 2*3+7";
// let node3 = ANode.parse2(raw3);
// console.log(raw3, node3, node3 ? node3.evaluate() : "null");
// let raw4 = "8 + 2 + 7 + 9";
// let node4 = ANode.parse2(raw4);
// console.log(raw4, node4, node4 ? node4.evaluate() : "null");
// let raw5 = "8 * 2 / 4 * 3";
// let node5 = ANode.parse2(raw5);
// console.log(raw5, node5, node5 ? node5.evaluate() : "null");
var TileType;
(function (TileType) {
    TileType[TileType["Number"] = 0] = "Number";
    TileType[TileType["Variable"] = 1] = "Variable";
})(TileType || (TileType = {}));
class Tile {
    constructor(value, type) {
        this.children = [];
        this.upperLeftClamp = { x: 0, y: 0 };
        this.lowerRightClamp = { x: 0, y: 0 };
        this.value = value;
        this.type = type;
        this.layout = new Layout(0, 0, 0, 0, 0, 0, 50, 50);
        this.layout.isDraggable = true;
        this.root = new Rectangle(new Layout(0, 0, 0, 0, 1, 1, 0, 0));
        this.children.push(this.root);
    }
    clamp() {
        this.layout.offset.position.x = Math.max(this.upperLeftClamp.x, this.layout.offset.position.x);
        this.layout.offset.position.y = Math.max(this.upperLeftClamp.y, this.layout.offset.position.y);
        this.layout.offset.position.x = Math.min(this.lowerRightClamp.x, this.layout.offset.position.x);
        this.layout.offset.position.y = Math.min(this.lowerRightClamp.y, this.layout.offset.position.y);
    }
    render(ctx, cp, timeMS) {
    }
}
class Main {
    constructor(container) {
        this.game = new Game(container, {});
        let margin = 30;
        let bottomDrawerHeight = 150;
        let rect1Layout = new Layout(0, 0, margin, margin, 0.5, 1.0, margin * (-1.5), margin * (-2) - bottomDrawerHeight);
        let rect1 = new Rectangle(rect1Layout);
        let rect2Layout = new Layout(0.5, 0, margin * (-1.5 + 1 + 1), margin, 0.5, 1.0, margin * (-1.5), margin * (-2) - bottomDrawerHeight);
        let rect2 = new Rectangle(rect2Layout);
        let tile1 = new Tile(0, TileType.Number);
        this.game.components.push(rect1);
        this.game.components.push(rect2);
        this.game.components.push(tile1);
        this.game.doLayout();
        tile1.upperLeftClamp = {
            x: margin + 2,
            y: margin + 2,
        };
        tile1.lowerRightClamp = {
            x: rect1.layout.computed.position.x + rect1.layout.computed.size.width - 50 - 2,
            y: rect1.layout.computed.position.y + rect1.layout.computed.size.height - 50 - 2,
        };
        tile1.clamp();
        this.game.doLayout();
    }
}
let $container = document.getElementById('container');
let main = new Main($container);
main.game.start();
//# sourceMappingURL=main.js.map