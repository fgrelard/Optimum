import $ from 'jquery';
import Muuri from 'muuri';

export function filter(grid) {
    var filterFieldValue = $('.filter-field').val();
    grid.filter(function (item) {
        var element = item.getElement();
        var isFilterMatch = !filterFieldValue ? true : (element.getAttribute('label') || filterFieldValue) === filterFieldValue;
        return isFilterMatch;
    });
}

export function changeLayout(grid) {
    var layoutFieldValue = $('.layout-field').val();
    var elements = grid.getItems();
    $.each(elements, function(i, item) {
        item.getElement().className = "item" + layoutFieldValue + " muuri-item";
    });
    grid.refreshItems().layout();
}

export function generateGrid() {
    return new Muuri('.grid', {
        items: '.item',
        layout: {
            fillGaps: true
        },
        dragEnabled: true,
        dragStartPredicate: function(item, event) {
            var elemWidth = $(item.getElement()).width();
            var elemHeight = $(item.getElement()).height();
            if (event.srcEvent.layerX < 10 ||
                event.srcEvent.layerY < 10 ||
                event.srcEvent.layerX > elemWidth ||
                event.srcEvent.layerY > elemHeight)
                return false;
            return Muuri.ItemDrag.defaultStartPredicate(item, event);
        }
    });
}

export function loadImageAndFillGrid(grid, url, images, label, count, length) {
    var i = new Image();
    i.addEventListener('dragstart', function (e) {
        e.preventDefault();
    }, false);
    i.onload = function(event) {
        fillGrid(grid, i, images, label, count, length);
    };
    i.src = url;

}

export function fillGrid(grid, image, images, label, count, length) {
    var divItem = $("<div/>", {
        class: "item" + ($('.layout-field').val() || ""),
        "label": label.label,
        "distance": label.distance
    });
    var divItemContent = $("<div/>", {
        class:"item-content"
    });

    divItemContent.append(image);
    divItem.append(divItemContent);
    images.push(divItem.get(0));
    count.number++;
    if (count.number >= length) {
        grid.remove(grid.getItems(), {removeElements: true});
        grid.add(images, {layout:true});
        grid.refreshItems().layout();
        document.body.className = 'images-loaded';
    }
}
