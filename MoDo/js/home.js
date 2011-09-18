/// <reference path="../winjs/js/controls.js" />
/// <reference path="../winjs/js/ui.js" />
/// <reference path="../winjs/js/base.js" />
/// <reference path="todo.js" />
/// <reference path="jquery.js" />

(function () {
    'use strict';

    var todo;
    var appdata = Windows.Storage.ApplicationData.current;
    var settings = appdata.roamingSettings;
    var appbar;

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
        $list = todo.createDom();
        $('#list-container').html($list);
    }

    function updateBadge() {
        var Notifications = Windows.UI.Notifications;
        var updater = Notifications.BadgeUpdateManager.createBadgeUpdaterForApplication();
        var xml = Notifications.BadgeUpdateManager.getTemplateContent(Notifications.BadgeTemplateType.badgeNumber);
        xml.getElementsByTagName('badge')[0].setAttribute('value', todo.list.length);
        
        var notification = Notifications.BadgeNotification(xml);
        updater.update(notification);
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
            appbar.addEventListener('aftershow', function () {
                $('#add-input-text')[0].focus();
            });

            $('input[type=checkbox]').live('mouseover mouseout', function (event) {
                if (event.type === 'mouseover') {
                    $(this).parent().css('text-decoration', 'line-through');
                } else {
                    $(this).parent().css('text-decoration', 'none');
                }
            });

            $('#add-input').submit(function (e) {
                e.preventDefault();
                var name = $('#add-input-text').val();

                if (name != '') {
                    var oldLength = todo.list.length;
                    todo.add(name);

                    // insert item
                    var i = $.inArray(name, todo.list);
                    var newItem = $('<div class="list-item"><input type="checkbox"/>' + name + '</div>').hide();
                    if (i >= oldLength) {
                        newItem.appendTo($('.list')).slideDown('normal', function() {
                            newItem.css('display', 'block');
                        });
                    }
                    else {
                        $($('.list').children('div')[i]).before(newItem);
                        newItem.slideDown('normal', function() {
                            newItem.css('display', 'block');
                        });
                    }

                    $('#add-input-text').val('')
                    $('#add-input-text')[0].focus();
                    
                    appbar.hide();

                    saveData();
                    updateBadge();
                }
            });

            $('input[type=checkbox]').live('click', function (e) {
                todo.remove($(e.target).parent().text());

                // remove item
                $(e.target).parent().slideUp('normal', function () {
                    $(this).remove();
                });

                saveData();
                updateBadge();
            });
        });
    }

    WinJS.Namespace.define('home', {
        fragmentLoad: fragmentLoad,
    });
})();
