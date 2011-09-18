function ToDoList(jsonlist) {
    // jsonlist must be in format "[item1, item2, ...]", else empty list will be created
    if (jsonlist) {
        var parsed = JSON.parse(jsonlist);
        if (parsed) {
            this.list = parsed;
            return;
        }
    }

    this.list = [];
}

ToDoList.prototype.add = function (item) {
    if (typeof item == "string") {
        // only add item if it is a string
        this.list.push(item);
        this.list.sort();
    }
}

ToDoList.prototype.remove = function (item) {
    if (typeof item == "string") {
        // remove item by name
        for (var i = 0; i < this.list.length; i++) {
            if (this.list[i] == item) {
                this.list.splice(i, 1);
                break;
            }
        }
    }
    else if (typeof item == "number") {
        // remove item by position
        this.list.splice(item, 1);
    }
}

ToDoList.prototype.createDom = function () {
    $list = $("<div class='list'/>");
    for (var i = 0; i < this.list.length; i++) {
        $list.append($("<div class='list-item'><input type='checkbox'/>" + this.list[i] + "</div>"));
    }

    return $list;
}
