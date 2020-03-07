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
    OperatorType[OperatorType["__Length"] = 5] = "__Length";
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
    getText() {
        return this.text == "" ? String(this.value) : this.text;
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
    setValue(value) {
        this.value = value;
        if (this.type == ANodeType.Operator) {
            switch (this.value) {
                case OperatorType.Addition: {
                    this.text = '+';
                    break;
                }
                case OperatorType.Multiplication: {
                    this.text = "*";
                    break;
                }
                case OperatorType.Division: {
                    this.text = "/";
                    break;
                }
                case OperatorType.Equality: {
                    this.text = "=";
                    break;
                }
            }
        }
    }
    inOrderTraversal(nodes = []) {
        if (this.lhs) {
            this.lhs.inOrderTraversal(nodes);
        }
        nodes.push(this);
        if (this.rhs) {
            this.rhs.inOrderTraversal(nodes);
        }
        return nodes;
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
var TileType;
(function (TileType) {
    TileType[TileType["Number"] = 0] = "Number";
    TileType[TileType["Variable"] = 1] = "Variable";
})(TileType || (TileType = {}));
class Tile {
    constructor(node, wasClicked) {
        this.children = [];
        this.upperLeftClamp = { x: 0, y: 0 };
        this.lowerRightClamp = { x: 0, y: 0 };
        this.wasClicked = wasClicked;
        this.node = node;
        this.layout = new Layout(0, 0, 5, 0, 0, 0, 50 + 10, 50);
        this.layout.isDraggable = false;
        this.root = new Rectangle(new Layout(0, 0, 0, 0, 1, 1, -10, 0));
        this.label = new TextLabel(new Layout(0.2, 0.2, 0, 0, 1, 1, -10, 0), node.getText());
        this.label.setFontSize(36);
        this.label.fillStyle = Constants.Colors.Black;
        this.children.push(this.root);
        this.children.push(this.label);
    }
    clamp() {
        this.layout.offset.position.x = Math.max(this.upperLeftClamp.x, this.layout.offset.position.x);
        this.layout.offset.position.y = Math.max(this.upperLeftClamp.y, this.layout.offset.position.y);
        this.layout.offset.position.x = Math.min(this.lowerRightClamp.x, this.layout.offset.position.x);
        this.layout.offset.position.y = Math.min(this.lowerRightClamp.y, this.layout.offset.position.y);
    }
    render(ctx, cp, timeMS) {
    }
    onClick(e) {
        this.wasClicked();
        this.label.text = this.node.getText();
        return InputResponse.Sunk;
    }
}
class Equation {
    // enum ANodeType {
    // 	Variable,
    // 	Number,
    // 	Operator,
    // }
    // enum OperatorType {
    // 	Addition = 1,
    // 	Multiplication = 2,
    // 	Division = 3,
    // 	Equality = 4,
    // 	__Length = 5,
    // }
    constructor(layout, raw) {
        this.children = [];
        this.layout = layout;
        this.layout.relativeLayout = RelativeLayout.StackHorizontal;
        let root = ANode.parse(raw);
        console.assert(root != null);
        if (root != null) {
            let iot = root.inOrderTraversal();
            for (let a of iot) {
                let o = a.text == "" ? String(a.value) : a.text;
                console.log("Node:", o);
                let tile = new Tile(a, function () {
                    console.log("Clicked:", a.getText());
                    if (a.type == ANodeType.Operator) {
                        let newValue = (a.value % 3) + 1;
                        a.setValue(newValue);
                    }
                    console.log("Now:", a.getText());
                    console.log("New computation:", root ? root.evaluate() : "NULL");
                });
                this.children.push(tile);
            }
        }
    }
    render(ctx, cp, timeMS) {
    }
}
class Main {
    constructor(container) {
        this.game = new Game(container, {});
        let equationLayout = new Layout(0.5, 0.5, 0, 0, 1, 1, 0, 0);
        let equation = new Equation(equationLayout, "2*3+4");
        equationLayout.anchor.x = 0.5;
        equationLayout.anchor.y = 0.5;
        this.game.components.push(equation);
        this.game.doLayout();
    }
}
let $container = document.getElementById('container');
let main = new Main($container);
main.game.start();
//# sourceMappingURL=main.js.map