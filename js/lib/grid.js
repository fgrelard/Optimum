/**
 * @fileOverview Code to handle grid of pictures, based on Muuri
 * @name grid.js
 * @author Florent Grélard
 * @license
 */

import $ from 'jquery';
import Muuri from 'muuri';

/**
 * Filters the grid according to values on HTML elements
 * @param {Muuri} grid
 * @returns {boolean} match
 */
export function filter(grid) {
    var filterFieldValue = $('.filter-field').val();
    grid.filter(function (item) {
        var element = item.getElement();
        var isFilterMatch = !filterFieldValue ? true : (element.getAttribute('label') || filterFieldValue) === filterFieldValue;
        return isFilterMatch;
    });
}

/**
 * Changes the number of columns inside the grid according to valyes on HTML elements
 * @param {Muuri} grid
 */
export function changeLayout(grid) {
    var layoutFieldValue = $('.layout-field').val();
    var elements = grid.getItems();
    $.each(elements, function(i, item) {
        item.getElement().className = "item" + layoutFieldValue + " muuri-item";
    });
    grid.refreshItems().layout();
}

/**
 * Creates an empty grid
 * @returns {Muuri}
 */
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

/**
 * Adds an image to the grid
 * @param {Muuri} grid
 * @param {URL} url
 * @param {Array} images
 * @param {string} label
 * @param {number} count
 * @param {number} length
 */
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

/**
 * Fill a grid of images (callback function)
 * @param {Muuri} grid
 * @param {Image} image
 * @param {Array} images
 * @param {string} label
 * @param {number} count
 * @param {number} length
 */
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
