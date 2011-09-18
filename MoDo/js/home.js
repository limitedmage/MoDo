/// <reference path="../winjs/js/base.js" />
/// <reference path="../winjs/js/ui.js" />
/// <reference path="../winjs/js/controls.js" />
/// <reference path="todo.js" />
/// <reference path="jquery.js" />

(function () {
    'use strict';

    var todo;
    var appdata = Windows.Storage.ApplicationData.current;
    var settings = appdata.roamingSettings;
    var appbar;
    var listview;

    function saveData() {
        settings.values['list'] = JSON.stringify(todo.list);
    }

    function loadData() {
        var saved = settings.values['list'];
        if (!saved) {
            todo = new ToDoList();
            todo.add("try out MoDo");
        } else {
            todo = new ToDoList(saved);
        }
    }

    function reload() {
        var data = new WinJS.UI.ArrayDataSource(todo.toObjectArray());

        listview = WinJS.UI.getControl($("#list-container")[0]);
        listview.dataSource = data;
    }

    function updateBadge() {
        var Notifications = Windows.UI.Notifications;
        var updater = Notifications.BadgeUpdateManager.createBadgeUpdaterForApplication();
        var xml = Notifications.BadgeUpdateManager.getTemplateContent(Notifications.BadgeTemplateType.badgeNumber);
        xml.getElementsByTagName('badge')[0].setAttribute('value', todo.list.length);
        
        var notification = Notifications.BadgeNotification(xml);
        updater.update(notification);
    }

    function swapAdjacentItems(index1, index2) {
        var currkey, nextkey;
        var binding = listview.dataSource.createListBinding();
        var currpromise = binding.fromIndex(index1).then(function (item) {
            currkey = item.key;
        });
        var prevpromise = binding.fromIndex(index2).then(function (item) {
            nextkey = item.key;
        });
        WinJS.Promise.join([currpromise, prevpromise]).then(function () {
            binding.release();

            listview.dataSource.moveBefore(currkey, nextkey);

            var temp = todo.list[index1];
            todo.list[index1] = todo.list[index2];
            todo.list[index2] = temp;

            updateAppbarForSelection();
            saveData();
        });
    }

    function updateAppbarForSelection() {
        if (listview.selection.getAllIndices().length > 0) {
            appbar.lightDismiss = false;
            appbar.show();

            if (listview.selection.getAllIndices().length === 1) {
                $('#reorder-buttons').show();
                var index = listview.selection.getAllIndices()[0];
                if (index === 0) {
                    $('#moveup').css('opacity', '0');
                } else {
                    $('#moveup').css('opacity', '1');
                }

                if (index === todo.list.length - 1) {
                    $('#movedown').hide();
                } else {
                    $('#movedown').show();
                }
            } else {
                $('#reorder-buttons').hide();
            }
        } else {
            appbar.lightDismiss = true;
            appbar.hide();
            $('#reorder-buttons').hide();
        }
    }

    WinJS.Application.addEventListener('fragmentappended', function handler(e) {
        if (e.location.indexOf('home.html') !== -1) { fragmentLoad(e.fragment, e.state); }
    });

    function fragmentLoad(elements, options) {
        WinJS.UI.processAll(elements).then(function () {
            loadData();
            reload();
            updateBadge();

            appbar = WinJS.UI.getControl($('#appbar')[0]);
            appbar.addEventListener('beforeshow', function () {
                if (listview.selection.getAllIndices().length > 0) {
                    $('#complete').show();
                } else {
                    $('#complete').hide();
                }
            });
            appbar.addEventListener('aftershow', function () {
                if (listview.selection.getAllIndices().length === 0) {
                    $('#add-input-text')[0].focus();
                }
            });


            listview.addEventListener('selectionchanged', function () {
                updateAppbarForSelection();
            });

            $('#complete').click(function (e) {
                var indexes = listview.selection.getAllIndices();
                if (indexes.length > 0) {
                    var binding = listview.dataSource.createListBinding();

                    var keys = [], promises = [], data = [];
                    for (var i = 0, count = indexes.length; i < count; i++) {

                        // Wrap the loop variable in a function to ensure
                        // the correct value when the async binding actually occurs.
                        (function (j) {

                            // Get the items based on the index (async).
                            promises[j] = binding.fromIndex(indexes[j]).then(function (item) {
                                keys[j] = item.key;
                                data[j] = item.data;
                            });
                        })(i);
                    }
                    // The fromIndex method is async, so use a join to wait for them all to be complete.
                    WinJS.Promise.join(promises).then(function () {

                        // We're done with the binding so it can be released.
                        binding.release();

                        // Start a batch for the edits.
                        listview.dataSource.beginEdits();

                        // To remove the items, call the IListDataSource object's
                        // remove method and pass it the item's key.
                        for (var i = 0, count = keys.length; i < count; i++) {
                            listview.dataSource.remove(keys[i]);
                            todo.remove(data[i].name);
                        }
                        // End the batch of edits.
                        listview.dataSource.endEdits();

                        appbar.hide();
                        saveData();
                        updateBadge();
                    });
                }
            });

            $("#moveup").click(function (e) {
                var indexes = listview.selection.getAllIndices();
                if (indexes.length === 1 && indexes[0] > 0) {
                    swapAdjacentItems(indexes[0], indexes[0] - 1);
                }
            });

            $("#movedown").click(function (e) {
                var indexes = listview.selection.getAllIndices();
                if (indexes.length === 1 && indexes[0] < todo.list.length) {
                    swapAdjacentItems(indexes[0] + 1, indexes[0]);
                }
            });


            $('#add-input').submit(function (e) {
                e.preventDefault();
                var newer = $('#add-input-text').val();

                if (newer != '') {
                    var oldsize = todo.list.length;
                    todo.add(newer);

                    if (oldsize === 0) {
                        reload();
                    } else {
                        listview.dataSource.insertAtEnd(oldsize, { name: newer });
                        listview.scrollTo(oldsize);
                    }

                    $('#add-input-text').val('')
                    
                    appbar.hide();
                    saveData();
                    updateBadge();
                }
            });
        });
    }

    WinJS.Namespace.define('home', {
        fragmentLoad: fragmentLoad,
    });
})();
